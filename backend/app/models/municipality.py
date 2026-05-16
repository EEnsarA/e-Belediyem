from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Municipality(Base):
    __tablename__ = "municipalities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    province = Column(String(100), nullable=False)  # İl
    district = Column(String(100), nullable=False)  # İlçe
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    website = Column(String(200), nullable=True)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    mayor_name = Column(String(200), nullable=True)
    population = Column(Integer, nullable=True)
    # Coğrafi merkez koordinatları
    center_lat = Column(String(20), nullable=True)
    center_lon = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="municipality")
    complaints = relationship("Complaint", back_populates="municipality")
    polls = relationship("Poll", back_populates="municipality")
    announcements = relationship("Announcement", back_populates="municipality")
    conversations = relationship("Conversation", back_populates="municipality")
    complaint_groups = relationship("ComplaintGroup", back_populates="municipality")
