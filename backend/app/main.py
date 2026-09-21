from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqladmin import Admin
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.database import engine, create_db_and_tables, get_async_session, async_session_maker
from app.models import User, ChatMessage, ChatSession, ChatRole
from app.auth import auth_backend, fastapi_users, current_active_user, current_superuser, password_helper
from app.schemas import UserRead, UserCreate, UserUpdate, ChatRequest, ModelList, ChatSessionRead, ChatSessionCreate, ChatSessionUpdate
from app.ollama_client import ollama_client
from app.admin import UserAdmin, ChatSessionAdmin, ChatMessageAdmin
from app.rate_limit import rate_limit_dependency
from app.config import get_settings

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    async with async_session_maker() as session:
        existing_admin = await session.scalar(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        )
        if existing_admin is None:
            session.add(User(
                email=settings.FIRST_SUPERUSER,
                hashed_password=password_helper.hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_active=True,
                is_superuser=True,
                is_verified=True,
                rate_limit=0,
            ))
            await session.commit()
    await ollama_client.start()
    yield
    await ollama_client.close()

app = FastAPI(
    title="LocalAI Custom",
    lifespan=lifespan,
    docs_url="/docs",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

admin = Admin(app, engine, title="LocalAI Admin")
admin.add_view(UserAdmin)
admin.add_view(ChatSessionAdmin)
admin.add_view(ChatMessageAdmin)

# ===== Sessions =====
@app.get("/sessions", response_model=list[ChatSessionRead])
@limiter.limit("30/minute")
async def list_sessions(request: Request, user=Depends(current_active_user), db: AsyncSession = Depends(get_async_session)):
    result = await db.execute(
        select(ChatSession, func.count(ChatMessage.id).label("message_count"))
        .outerjoin(ChatMessage, ChatSession.id == ChatMessage.session_id)
        .where(ChatSession.user_id == user.id)
        .group_by(ChatSession.id)
        .order_by(ChatSession.is_pinned.desc(), ChatSession.updated_at.desc())
    )
    sessions = []
    for session, msg_count in result.all():
        s = ChatSessionRead.model_validate(session)
        s.message_count = msg_count
        sessions.append(s)
    return sessions

@app.post("/sessions", response_model=ChatSessionRead)
@limiter.limit("30/minute")
async def create_session(request: Request, data: ChatSessionCreate, user=Depends(current_active_user), db: AsyncSession = Depends(get_async_session)):
    session = ChatSession(
        user_id=user.id,
        title=data.title or "Новый чат",
        model=data.model or "",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return ChatSessionRead.model_validate(session, update={"message_count": 0})

@app.get("/sessions/{session_id}", response_model=ChatSessionRead)
@limiter.limit("30/minute")
async def get_session(session_id: int, request: Request, user=Depends(current_active_user), db: AsyncSession = Depends(get_async_session)):
    result = await db.execute(
        select(ChatSession, func.count(ChatMessage.id).label("message_count"))
        .outerjoin(ChatMessage, ChatSession.id == ChatMessage.session_id)
        .where(ChatSession.id == session_id, ChatSession.user_id == user.id)
        .group_by(ChatSession.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(404, "Session not found")
    session, msg_count = row
    s = ChatSessionRead.model_validate(session)
    s.message_count = msg_count
    return s

@app.patch("/sessions/{session_id}", response_model=ChatSessionRead)
@limiter.limit("30/minute")
async def update_session(session_id: int, data: ChatSessionUpdate, request: Request, user=Depends(current_active_user), db: AsyncSession = Depends(get_async_session)):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(404, "Session not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    await db.commit()
    await db.refresh(session)
    return ChatSessionRead.model_validate(session)

@app.delete("/sessions/{session_id}")
@limiter.limit("30/minute")
async def delete_session(session_id: int, request: Request, user=Depends(current_active_user), db: AsyncSession = Depends(get_async_session)):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(404, "Session not found")
    await db.delete(session)
    await db.commit()
    return {"ok": True}

@app.get("/sessions/{session_id}/messages")
@limiter.limit("30/minute")
async def get_session_messages(session_id: int, request: Request, user=Depends(current_active_user), db: AsyncSession = Depends(get_async_session)):
    session = await db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(404, "Session not found")
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return [{"role": m.role.value, "content": m.content} for m in messages]

# ===== Models =====
@app.get("/models", response_model=ModelList)
@limiter.limit("30/minute")
async def list_models(request: Request, user=Depends(current_active_user)):
    models = await ollama_client.list_models()
    return {"models": models}

# ===== Chat =====
@app.post("/chat")
@limiter.limit("50/hour")
async def chat(
    request: Request,
    data: ChatRequest,
    user=Depends(current_active_user),
    _rate_limit=Depends(rate_limit_dependency),
    db: AsyncSession = Depends(get_async_session),
):
    models = await ollama_client.list_models()
    if data.model not in models:
        raise HTTPException(400, f"Model {data.model} not found. Available: {models}")

    # Get or create session
    if data.session_id:
        session = await db.get(ChatSession, data.session_id)
        if not session or session.user_id != user.id:
            raise HTTPException(404, "Session not found")
    else:
        session = ChatSession(user_id=user.id, title="Новый чат", model=data.model)
        db.add(session)
        await db.flush()

    # Load history from session
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at)
    )
    history = result.scalars().all()
    history_messages = [{"role": m.role.value, "content": m.content} for m in history]

    # Combine history + new messages
    all_messages = history_messages + data.messages

    # Save user messages from request
    for msg in data.messages:
        db.add(ChatMessage(
            user_id=user.id,
            session_id=session.id,
            role=ChatRole(msg["role"]),
            content=msg["content"],
            model=data.model,
        ))

    async def generate():
        assistant_content = ""
        async for chunk in ollama_client.chat_stream(data.model, all_messages):
            yield f"data: {chunk}\n\n"
            try:
                parsed = json.loads(chunk)
                if parsed.get("content"):
                    assistant_content += parsed["content"]
            except:
                pass
        yield "data: [DONE]\n\n"

        # Save assistant response after streaming
        if assistant_content.strip():
            db.add(ChatMessage(
                user_id=user.id,
                session_id=session.id,
                role=ChatRole.assistant,
                content=assistant_content,
                model=data.model,
            ))
            session.updated_at = func.now()
            await db.commit()

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"X-Session-ID": str(session.id)})

# ===== Health =====
@app.get("/health")
async def health():
    return {"status": "ok", "ollama": await ollama_client.health_check()}