import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ConversationStatus(str, enum.Enum):
    OPEN = "Açık"
    AI_RESPONDING = "AI Yanıtlıyor"
    HUMAN_TRANSFERRED = "İnsan Devredildi"
    CLOSED = "Kapatıldı"


class MessageSenderType(str, enum.Enum):
    CITIZEN = "Vatandaş"
    AI = "AI"
    OFFICIAL = "Yetkili"


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    topic = Column(String(300), nullable=True)
    status = Column(SAEnum(ConversationStatus), default=ConversationStatus.OPEN)
    assigned_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="conversations", foreign_keys=[user_id])
    municipality = relationship("Municipality", back_populates="conversations")
    assigned_admin = relationship("User", back_populates="assigned_conversations", foreign_keys=[assigned_admin_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_type = Column(SAEnum(MessageSenderType), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
