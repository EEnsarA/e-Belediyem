from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class DynamicForm(Base):
    __tablename__ = "dynamic_forms"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    
    # Tüm sorular, tipleri ve atlama kuralları (logic jump) JSON formatında burada tutulacak
    schema = Column(JSONB, default=[], nullable=False) 
    
    # Form ayarları: Bitiş tarihi, herkese açıklık, kota vb.
    settings = Column(JSONB, default={
        "is_public": True,
        "allow_multiple_responses": False,
        "max_responses": None,
        "expires_at": None
    }, nullable=False)
    
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    municipality = relationship("Municipality")
    created_by = relationship("User")
    responses = relationship("FormResponse", back_populates="form", cascade="all, delete-orphan")


class FormResponse(Base):
    __tablename__ = "form_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("dynamic_forms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Anonim yanıtlar için null olabilir
    
    # Anti-cheat mekanizması
    ip_address = Column(String(100), nullable=True)
    browser_fingerprint = Column(String(200), nullable=True)
    
    # Kullanıcının cevapları: {"soru_id": "cevap"} şeklinde tutulacak
    data = Column(JSONB, default={}, nullable=False)
    
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    form = relationship("DynamicForm", back_populates="responses")
    user = relationship("User")
