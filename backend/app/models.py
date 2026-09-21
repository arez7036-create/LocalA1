from sqlalchemy import String, Integer, DateTime, Boolean, Text, ForeignKey, func, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from app.database import Base
from datetime import datetime
import enum

class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"

class ChatSession(AsyncAttrs, Base):
    __tablename__ = "chat_sessions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), default="Новый чат")
    model: Mapped[str] = mapped_column(String(100), default="")
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    
    user: Mapped["User"] = relationship(back_populates="sessions", lazy="selectin")
    messages: Mapped[list["ChatMessage"]] = relationship(back_populates="session", lazy="selectin", order_by="ChatMessage.created_at")

class User(AsyncAttrs, Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(1024))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    rate_limit: Mapped[int] = mapped_column(Integer, default=50)
    rate_window: Mapped[int] = mapped_column(Integer, default=3600)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    
    sessions: Mapped[list["ChatSession"]] = relationship(back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    messages: Mapped[list["ChatMessage"]] = relationship(back_populates="user", lazy="selectin")

class ChatMessage(AsyncAttrs, Base):
    __tablename__ = "chat_messages"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True)
    role: Mapped[ChatRole] = mapped_column(SQLEnum(ChatRole), default=ChatRole.user)
    content: Mapped[str] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(100))
    tokens: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    
    user: Mapped["User"] = relationship(back_populates="messages")
    session: Mapped["ChatSession"] = relationship(back_populates="messages")