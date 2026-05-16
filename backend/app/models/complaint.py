import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Text, Float, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

try:
    from pgvector.sqlalchemy import Vector
    VECTOR_AVAILABLE = True
except ImportError:
    VECTOR_AVAILABLE = False


class ComplaintStatus(str, enum.Enum):
    PENDING = "Beklemede"
    REVIEWING = "İnceleniyor"
    FORWARDED = "İlgili Birime Yönlendirildi"
    RESOLVED = "Çözüldü"


class ComplaintCategory(str, enum.Enum):
    ROAD = "Yol ve Kaldırım"
    PARK = "Park ve Yeşil Alan"
    WATER = "Su ve Kanalizasyon"
    ELECTRICITY = "Elektrik ve Aydınlatma"
    WASTE = "Çöp ve Temizlik"
    NOISE = "Gürültü"
    BUILDING = "İmar ve Ruhsat"
    ENVIRONMENT = "Çevre"
    TRANSPORT = "Ulaşım"
    SOCIAL = "Sosyal Hizmetler"
    OTHER = "Diğer"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)

    # Vatandaş girdisi
    description = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address_text = Column(Text, nullable=True)

    # Durum ve atama
    status = Column(SAEnum(ComplaintStatus), default=ComplaintStatus.PENDING, nullable=False)
    assigned_unit = Column(String(200), nullable=True)  # Atanan birim

    # Kategori (AI veya manuel)
    category = Column(SAEnum(ComplaintCategory), nullable=True)
    is_category_manual = Column(Boolean, default=False)  # Admin tarafından manuel atandı mı?

    # AI Analiz Sonuçları
    ai_category = Column(String(100), nullable=True)
    ai_sentiment = Column(String(50), nullable=True)  # positive/neutral/negative
    ai_urgency_score = Column(Integer, nullable=True)  # 1-10
    ai_spam_score = Column(Float, nullable=True)  # 0.0-1.0
    ai_toxicity_score = Column(Float, nullable=True)  # 0.0-1.0
    ai_summary = Column(Text, nullable=True)  # Yönetici özeti
    ai_photo_analysis = Column(Text, nullable=True)  # Görsel analiz sonucu
    ai_keywords = Column(Text, nullable=True)  # JSON string
    ai_processed = Column(Boolean, default=False)

    # Embedding (pgvector)
    if VECTOR_AVAILABLE:
        embedding = Column(Vector(768), nullable=True)

    # Grup ilişkisi (benzer şikayetler)
    group_id = Column(Integer, ForeignKey("complaint_groups.id"), nullable=True)

    # Gizlilik & Memnuniyet
    is_hidden = Column(Boolean, default=False)  # Spam olarak işaretlendi
    satisfaction_score = Column(Integer, nullable=True)  # 1-5 çözüm sonrası

    # Kamuya açık & Öne çıkart
    is_public = Column(Boolean, default=False)   # Vatandaş herkese açık yaptı mı?
    upvote_count = Column(Integer, default=0)     # Öne çıkart sayısı

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    municipality = relationship("Municipality", back_populates="complaints")
    timeline = relationship("ComplaintTimeline", back_populates="complaint", cascade="all, delete-orphan")
    group = relationship("ComplaintGroup", back_populates="complaints")
    upvotes = relationship("ComplaintUpvote", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintTimeline(Base):
    __tablename__ = "complaint_timelines"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    old_status = Column(SAEnum(ComplaintStatus), nullable=True)
    new_status = Column(SAEnum(ComplaintStatus), nullable=False)
    note = Column(Text, nullable=True)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    complaint = relationship("Complaint", back_populates="timeline")
    changed_by = relationship("User", back_populates="complaint_timelines")


class ComplaintGroup(Base):
    __tablename__ = "complaint_groups"

    id = Column(Integer, primary_key=True, index=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    complaint_count = Column(Integer, default=0)
    avg_urgency = Column(Float, nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    municipality = relationship("Municipality", back_populates="complaint_groups")
    complaints = relationship("Complaint", back_populates="group")


class ComplaintUpvote(Base):
    """Bir vatandaşın bir şikayeti 'öne çıkart' oylaması. Aynı belediye vatandaşlarına özgü."""
    __tablename__ = "complaint_upvotes"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("complaint_id", "user_id", name="uq_complaint_upvote"),
    )

    # Relationships
    complaint = relationship("Complaint", back_populates="upvotes")
    user = relationship("User")

