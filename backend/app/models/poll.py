from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Text, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Poll(Base):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    options = Column(JSON, nullable=False)  # [{"id": 1, "text": "Evet", "votes": 0}, ...]
    is_active = Column(Boolean, default=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    ai_analysis = Column(Text, nullable=True)  # Kapanış sonrası AI analizi
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    municipality = relationship("Municipality", back_populates="polls")
    votes = relationship("Vote", back_populates="poll", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_id])


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    option_id = Column(Integer, nullable=False)  # Seçilen opsiyon ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # UNIQUE constraint - bir kullanıcı aynı ankete bir kez oy verebilir
    __table_args__ = (UniqueConstraint("poll_id", "user_id", name="uq_votes_poll_user"),)

    # Relationships
    poll = relationship("Poll", back_populates="votes")
    user = relationship("User", back_populates="votes")
