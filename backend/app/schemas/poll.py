from pydantic import BaseModel, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime


class PollOption(BaseModel):
    id: int
    text: str
    votes: int = 0


class PollCreate(BaseModel):
    title: str
    description: Optional[str] = None
    options: List[str]  # Opsyon metinleri
    ends_at: Optional[datetime] = None

    @field_validator("options")
    @classmethod
    def validate_options(cls, v: List[str]) -> List[str]:
        if len(v) < 2:
            raise ValueError("En az 2 seçenek olmalıdır")
        if len(v) > 10:
            raise ValueError("En fazla 10 seçenek olabilir")
        return v


class PollVoteRequest(BaseModel):
    option_id: int


class PollResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    options: List[PollOption]
    is_active: bool
    ends_at: Optional[datetime]
    total_votes: int
    user_voted: bool
    user_vote_option: Optional[int]
    ai_analysis: Optional[str]
    municipality_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Conversations & Messages
class ConversationCreate(BaseModel):
    topic: Optional[str] = None
    first_message: str


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    sender_type: str
    sender_name: Optional[str]
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    topic: Optional[str]
    status: str
    last_message_at: Optional[datetime]
    created_at: datetime
    messages: List[MessageResponse] = []
    unread_count: int = 0

    class Config:
        from_attributes = True


# Announcements
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    is_pinned: bool = False
    expires_at: Optional[datetime] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    category: Optional[str]
    is_pinned: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
