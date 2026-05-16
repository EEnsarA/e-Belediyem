from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tckn_hash = Column(String(200), nullable=False, unique=True)  # Argon2 hash - KVKK
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True, unique=True)
    phone = Column(String(20), nullable=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    push_token = Column(Text, nullable=True)  # Web Push subscription JSON
    push_enabled = Column(Boolean, default=True)
    email_enabled = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    municipality = relationship("Municipality", back_populates="users")
    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id")
    votes = relationship("Vote", back_populates="user")
    conversations = relationship("Conversation", back_populates="user", foreign_keys="Conversation.user_id")
    audit_logs = relationship("AuditLog", back_populates="user")
    assigned_conversations = relationship(
        "Conversation", back_populates="assigned_admin", foreign_keys="Conversation.assigned_admin_id"
    )
    complaint_timelines = relationship("ComplaintTimeline", back_populates="changed_by")
