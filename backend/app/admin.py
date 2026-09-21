from sqladmin import ModelView
from app.models import User, ChatMessage, ChatSession

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.is_active, User.is_superuser, User.rate_limit, User.created_at]
    column_searchable_list = [User.email]
    column_sortable_list = [User.id, User.created_at, User.rate_limit]
    column_filters = [User.is_active, User.is_superuser, User.created_at]
    form_columns = [User.email, User.hashed_password, User.is_active, User.is_superuser, User.rate_limit, User.rate_window]
    column_labels = {
        User.email: "Email",
        User.is_superuser: "Админ",
        User.rate_limit: "Лимит запросов",
        User.rate_window: "Окно (сек)",
    }
    can_create = True
    can_edit = True
    can_delete = True
    can_export = True
    page_size = 50

class ChatSessionAdmin(ModelView, model=ChatSession):
    column_list = [ChatSession.id, ChatSession.user_id, ChatSession.title, ChatSession.model, ChatSession.is_pinned, ChatSession.created_at, ChatSession.updated_at]
    column_searchable_list = [ChatSession.title]
    column_sortable_list = [ChatSession.id, ChatSession.created_at, ChatSession.updated_at]
    column_filters = [ChatSession.is_pinned, ChatSession.model, ChatSession.created_at]
    column_labels = {
        ChatSession.title: "Название",
        ChatSession.model: "Модель",
        ChatSession.is_pinned: "Закреплен",
    }
    can_create = False
    can_edit = True
    can_delete = True
    can_export = True
    page_size = 50

class ChatMessageAdmin(ModelView, model=ChatMessage):
    column_list = [ChatMessage.id, ChatMessage.user_id, ChatMessage.session_id, ChatMessage.role, ChatMessage.model, ChatMessage.tokens, ChatMessage.created_at]
    column_searchable_list = [ChatMessage.content]
    column_sortable_list = [ChatMessage.id, ChatMessage.created_at, ChatMessage.tokens]
    column_filters = [ChatMessage.role, ChatMessage.model, ChatMessage.created_at]
    column_labels = {
        ChatMessage.content: "Содержимое",
        ChatMessage.tokens: "Токены",
    }
    can_create = False
    can_edit = False
    can_delete = True
    can_export = True
    page_size = 50