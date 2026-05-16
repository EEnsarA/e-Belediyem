from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class StatCard(BaseModel):
    label: str
    value: int | float | str
    change_percent: Optional[float] = None
    trend: Optional[str] = None  # up, down, stable


class DashboardStats(BaseModel):
    total_complaints: int
    pending_complaints: int
    resolved_complaints: int
    resolution_rate: float
    avg_resolution_hours: Optional[float]
    nps_score: Optional[float]  # -100 to 100
    active_conversations: int
    urgent_complaints: int  # urgency_score >= 8


class ComplaintsByStatus(BaseModel):
    status: str
    count: int
    percentage: float


class ComplaintsByCategory(BaseModel):
    category: str
    count: int


class WeeklyTrend(BaseModel):
    date: str
    complaints: int
    resolved: int


class AdminDashboardResponse(BaseModel):
    stats: DashboardStats
    by_status: List[ComplaintsByStatus]
    by_category: List[ComplaintsByCategory]
    weekly_trend: List[WeeklyTrend]
    recent_urgent: List[Dict[str, Any]]
    ai_summary: Optional[str]  # Haftalık AI brifing


class MapDataResponse(BaseModel):
    points: List[Dict[str, Any]]
    heatmap_data: List[Dict[str, float]]


class ComplaintGroupResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    complaint_count: int
    avg_urgency: Optional[float]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportRequest(BaseModel):
    format: str  # pdf or docx
    report_type: str = "general"  # general, performance, satisfaction, urgent
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_ai_summary: bool = True
