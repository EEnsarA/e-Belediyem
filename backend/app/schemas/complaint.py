from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.complaint import ComplaintStatus, ComplaintCategory


class ComplaintCreate(BaseModel):
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_text: Optional[str] = None
    category: Optional[ComplaintCategory] = None
    is_public: bool = False  # Kamuya açık şikayet

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Şikayet açıklaması en az 10 karakter olmalıdır")
        if len(v) > 2000:
            raise ValueError("Şikayet açıklaması en fazla 2000 karakter olmalıdır")
        return v.strip()


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    note: Optional[str] = None
    assigned_unit: Optional[str] = None


class ComplaintSatisfactionUpdate(BaseModel):
    score: int

    @field_validator("score")
    @classmethod
    def validate_score(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Memnuniyet puanı 1-5 arasında olmalıdır")
        return v


class TimelineItem(BaseModel):
    id: int
    old_status: Optional[ComplaintStatus]
    new_status: ComplaintStatus
    note: Optional[str]
    changed_by_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintResponse(BaseModel):
    id: int
    description: str
    photo_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address_text: Optional[str]
    status: ComplaintStatus
    category: Optional[ComplaintCategory]
    assigned_unit: Optional[str]
    ai_category: Optional[str]
    ai_sentiment: Optional[str]
    ai_urgency_score: Optional[int]
    ai_summary: Optional[str]
    ai_photo_analysis: Optional[str]
    ai_processed: bool
    satisfaction_score: Optional[int]
    is_public: bool = False          # Kamuya açık mı?
    upvote_count: int = 0            # Öne çıkart sayısı
    user_upvoted: bool = False       # Mevcut kullanıcı oy verdi mi?
    municipality_id: int
    user_id: int
    user_name: Optional[str]
    group_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    timeline: List[TimelineItem] = []

    class Config:
        from_attributes = True


class ComplaintListResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ComplaintMapPoint(BaseModel):
    id: int
    latitude: float
    longitude: float
    status: ComplaintStatus
    category: Optional[ComplaintCategory]
    ai_urgency_score: Optional[int]
    created_at: datetime

