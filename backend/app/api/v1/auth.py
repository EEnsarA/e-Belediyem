from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import EDevletLoginRequest, TokenResponse, RefreshTokenRequest, UserMeResponse
from app.models.municipality import Municipality
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/edevlet", response_model=TokenResponse, summary="e-Devlet Girişi")
async def edevlet_login(
    request: EDevletLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Mock e-Devlet OAuth2 girişi.
    Production'da gerçek e-Devlet API entegrasyonu ile değiştirilir.
    """
    service = AuthService(db)
    return await service.edevlet_login(request)


@router.post("/refresh", response_model=TokenResponse, summary="Token Yenile")
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    try:
        return await service.refresh_tokens(request.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", summary="Çıkış Yap")
async def logout(current_user=Depends(get_current_user)):
    """JWT stateless olduğu için client token'ı siler. Refresh token blacklist eklenebilir."""
    return {"message": "Başarıyla çıkış yapıldı"}


@router.get("/me", response_model=UserMeResponse, summary="Mevcut Kullanıcı")
async def get_me(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    municipality_name = None
    if current_user.municipality_id:
        result = await db.execute(
            select(Municipality).where(Municipality.id == current_user.municipality_id)
        )
        municipality = result.scalar_one_or_none()
        if municipality:
            municipality_name = municipality.name

    return UserMeResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        is_admin=current_user.is_admin,
        municipality_id=current_user.municipality_id,
        municipality_name=municipality_name,
        push_enabled=current_user.push_enabled,
        email_enabled=current_user.email_enabled,
    )
