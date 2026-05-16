from typing import Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_tckn, verify_tckn, create_access_token, create_refresh_token, verify_refresh_token
from app.repositories.user_repo import UserRepository
from app.repositories.municipality_repo import MunicipalityRepository
from app.models.user import User
from app.schemas.auth import EDevletLoginRequest, TokenResponse
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Mock e-Devlet kullanıcı veritabanı (gerçek entegrasyonda OAuth2 ile değişir)
MOCK_EDEVLET_USERS = {
    "12345678901": {"full_name": "Ahmet Yılmaz", "email": "ahmet.yilmaz@example.com", "district": "Kadıköy"},
    "23456789012": {"full_name": "Fatma Demir", "email": "fatma.demir@example.com", "district": "Kadıköy"},
    "34567890123": {"full_name": "Mehmet Kaya", "email": "mehmet.kaya@example.com", "district": "Çankaya"},
    "45678901234": {"full_name": "Ayşe Şahin", "email": "ayse.sahin@example.com", "district": "Çankaya"},
    "56789012345": {"full_name": "Ali Çelik", "email": "ali.celik@example.com", "district": "Konak"},
    "67890123456": {"full_name": "Zeynep Arslan", "email": "zeynep.arslan@example.com", "district": "Konak"},
    # Admin kullanıcıları
    "11111111111": {"full_name": "Kadıköy Admin", "email": "admin.kadikoy@example.com", "district": "Kadıköy", "is_admin": True},
    "22222222222": {"full_name": "Çankaya Admin", "email": "admin.cankaya@example.com", "district": "Çankaya", "is_admin": True},
    "33333333333": {"full_name": "Konak Admin", "email": "admin.konak@example.com", "district": "Konak", "is_admin": True},
}


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.municipality_repo = MunicipalityRepository(db)

    async def edevlet_login(self, request: EDevletLoginRequest) -> TokenResponse:
        """
        Mock e-Devlet login.
        Production'da: TCKN + şifre → e-Devlet OAuth2 → user bilgisi alınır.
        """
        tckn = request.tckn

        # Mock doğrulama (production'da e-Devlet API'si ile değişir)
        mock_user_data = MOCK_EDEVLET_USERS.get(tckn)
        if not mock_user_data:
            # Demo: bilinmeyen TCKN'ler için varsayılan kullanıcı oluştur
            mock_user_data = {
                "full_name": f"Vatandaş {tckn[-4:]}",
                "email": f"vatandas{tckn[-4:]}@example.com",
                "district": request.municipality_district or "Kadıköy",
            }

        # Kullanıcı var mı kontrol et (tüm kullanıcıları getir, hash'i verify et)
        all_users = await self.user_repo.find_by_tckn_hash_candidates()
        existing_user = None
        for user in all_users:
            if verify_tckn(tckn, user.tckn_hash):
                existing_user = user
                break

        if existing_user:
            # Mevcut kullanıcı - last_login güncelle
            user = await self.user_repo.update(existing_user, last_login=datetime.now(timezone.utc))
        else:
            # Yeni kullanıcı - belediyesini bul ve kaydet
            district = mock_user_data.get("district") or request.municipality_district or "Kadıköy"
            municipality = await self.municipality_repo.get_by_district(district)

            user = await self.user_repo.create(
                tckn_hash=hash_tckn(tckn),
                full_name=mock_user_data["full_name"],
                email=mock_user_data.get("email"),
                municipality_id=municipality.id if municipality else None,
                is_admin=mock_user_data.get("is_admin", False),
                last_login=datetime.now(timezone.utc),
            )
            logger.info(f"Yeni kullanıcı oluşturuldu: {user.id} - {user.full_name}")

        # JWT üret
        token_data = {"sub": str(user.id), "municipality_id": user.municipality_id}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        payload = verify_refresh_token(refresh_token)
        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise ValueError("Geçersiz token")

        token_data = {"sub": str(user.id), "municipality_id": user.municipality_id}
        access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
