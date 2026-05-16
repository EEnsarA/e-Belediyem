from pydantic import BaseModel, field_validator
from typing import Optional
import re


class EDevletLoginRequest(BaseModel):
    """Mock e-Devlet login - production'da OAuth2 code exchange ile değiştirilir."""
    tckn: str
    password: str  # e-Devlet şifresi (mock)
    municipality_district: Optional[str] = None  # İlçe adı

    @field_validator("tckn")
    @classmethod
    def validate_tckn(cls, v: str) -> str:
        if not re.match(r"^\d{11}$", v):
            raise ValueError("TCKN 11 haneli olmalıdır")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # saniye


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserMeResponse(BaseModel):
    id: int
    full_name: str
    email: Optional[str]
    is_admin: bool
    municipality_id: Optional[int]
    municipality_name: Optional[str]
    municipality_logo_url: Optional[str] = None
    push_enabled: bool
    email_enabled: bool

    class Config:
        from_attributes = True
