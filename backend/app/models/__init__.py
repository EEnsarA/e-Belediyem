# Import all models here so Alembic can detect them
from app.db.base import Base
from app.models.municipality import Municipality
from app.models.user import User
from app.models.complaint import Complaint, ComplaintTimeline, ComplaintGroup, ComplaintStatus, ComplaintCategory
from app.models.poll import Poll, Vote
from app.models.conversation import Conversation, Message
from app.models.announcement import Announcement, AuditLog
from app.models.knowledge import KnowledgeBase
from app.models.dynamic_form import DynamicForm, FormResponse

__all__ = [
    "Base",
    "Municipality",
    "User",
    "Complaint",
    "ComplaintTimeline",
    "ComplaintGroup",
    "ComplaintStatus",
    "ComplaintCategory",
    "Poll",
    "Vote",
    "Conversation",
    "Message",
    "Announcement",
    "AuditLog",
    "KnowledgeBase",
    "DynamicForm",
    "FormResponse",
]
