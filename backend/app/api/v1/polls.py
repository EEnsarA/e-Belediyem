from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.dependencies import get_db, get_current_user, get_current_admin
from app.models.poll import Poll, Vote
from app.schemas.poll import PollCreate, PollVoteRequest, PollResponse, PollOption
from app.services.ai_service import ai_service
from datetime import datetime, timezone

router = APIRouter(prefix="/polls", tags=["Polls"])


@router.get("", response_model=List[PollResponse])
async def list_polls(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.municipality_id:
        return []

    result = await db.execute(
        select(Poll).where(
            Poll.municipality_id == current_user.municipality_id,
            Poll.is_active == True,
        ).order_by(Poll.created_at.desc())
    )
    polls = list(result.scalars().all())

    responses = []
    for poll in polls:
        responses.append(await _build_poll_response(poll, current_user.id, db))
    return responses


@router.post("", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
async def create_poll(
    data: PollCreate,
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    options_with_votes = [
        {"id": i + 1, "text": opt, "votes": 0}
        for i, opt in enumerate(data.options)
    ]
    poll = Poll(
        municipality_id=current_user.municipality_id,
        title=data.title,
        description=data.description,
        options=options_with_votes,
        ends_at=data.ends_at,
        created_by_id=current_user.id,
    )
    db.add(poll)
    await db.commit()
    await db.refresh(poll)
    return await _build_poll_response(poll, current_user.id, db)


@router.post("/{poll_id}/vote")
async def vote_on_poll(
    poll_id: int,
    vote_data: PollVoteRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Anketi bul
    result = await db.execute(select(Poll).where(Poll.id == poll_id))
    poll = result.scalar_one_or_none()
    if not poll or poll.municipality_id != current_user.municipality_id:
        raise HTTPException(status_code=404, detail="Anket bulunamadı")
    if not poll.is_active:
        raise HTTPException(status_code=400, detail="Anket aktif değil")
    if poll.ends_at and poll.ends_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Anket süresi dolmuş")

    # Daha önce oy kullandı mı?
    existing = await db.execute(
        select(Vote).where(Vote.poll_id == poll_id, Vote.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Bu ankete zaten oy kullandınız")

    # Seçenek geçerli mi?
    option_ids = [o["id"] for o in poll.options]
    if vote_data.option_id not in option_ids:
        raise HTTPException(status_code=400, detail="Geçersiz seçenek")

    # Oy kaydet
    vote = Vote(poll_id=poll_id, user_id=current_user.id, option_id=vote_data.option_id)
    db.add(vote)

    # Seçenek oy sayısını güncelle
    new_options = []
    for opt in poll.options:
        if opt["id"] == vote_data.option_id:
            new_options.append({**opt, "votes": opt["votes"] + 1})
        else:
            new_options.append(opt)
    poll.options = new_options

    await db.commit()
    return {"message": "Oy başarıyla kaydedildi"}


@router.patch("/{poll_id}/close")
async def close_poll(
    poll_id: int,
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Poll).where(Poll.id == poll_id))
    poll = result.scalar_one_or_none()
    if not poll or poll.municipality_id != current_user.municipality_id:
        raise HTTPException(status_code=404, detail="Anket bulunamadı")

    poll.is_active = False

    # AI analiz
    ai_analysis = await ai_service.analyze_poll_results(poll.title, poll.options)
    poll.ai_analysis = ai_analysis

    await db.commit()
    return {"message": "Anket kapatıldı", "ai_analysis": ai_analysis}


async def _build_poll_response(poll: Poll, user_id: int, db: AsyncSession) -> PollResponse:
    total_votes = sum(o.get("votes", 0) for o in poll.options)

    # Kullanıcı oy kullandı mı?
    vote_result = await db.execute(
        select(Vote).where(Vote.poll_id == poll.id, Vote.user_id == user_id)
    )
    user_vote = vote_result.scalar_one_or_none()

    options = [PollOption(**o) for o in poll.options]

    return PollResponse(
        id=poll.id,
        title=poll.title,
        description=poll.description,
        options=options,
        is_active=poll.is_active,
        ends_at=poll.ends_at,
        total_votes=total_votes,
        user_voted=user_vote is not None,
        user_vote_option=user_vote.option_id if user_vote else None,
        ai_analysis=poll.ai_analysis,
        municipality_id=poll.municipality_id,
        created_at=poll.created_at,
    )
