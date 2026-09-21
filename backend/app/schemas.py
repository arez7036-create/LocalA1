from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    rate_limit: Optional[int] = None
    rate_window: Optional[int] = None

class UserRead(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    is_verified: bool
    rate_limit: int
    rate_window: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChatSessionBase(BaseModel):
    title: Optional[str] = "Новый чат"
    model: Optional[str] = ""

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    is_pinned: Optional[bool] = None

class ChatSessionRead(ChatSessionBase):
    id: int
    user_id: int
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageRead(ChatMessageBase):
    id: int
    session_id: int
    model: str
    tokens: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChatRequest(BaseModel):
    model: str
    messages: List[dict]
    session_id: Optional[int] = None

class ChatResponse(BaseModel):
    content: str
    done: bool
    session_id: int

class ModelList(BaseModel):
    models: List[str]