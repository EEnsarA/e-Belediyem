from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.core.dependencies import get_db, get_current_user
from app.core.security import verify_access_token
from app.models.conversation import Conversation, Message, ConversationStatus, MessageSenderType
from app.models.knowledge import KnowledgeBase
from app.models.user import User
from app.schemas.poll import (
    ConversationCreate, MessageCreate, ConversationResponse, MessageResponse
)
from app.services.ai_service import ai_service
from app.websocket.connection_manager import ws_manager

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.post("/quick-chat", summary="Hızlı AI Yanıtı")
async def quick_chat(
    data: MessageCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard üzerindeki asistan için hızlı yanıt."""
    # Bilgi bankasını al
    k_result = await db.execute(
        select(KnowledgeBase)
        .where(KnowledgeBase.municipality_id == current_user.municipality_id, KnowledgeBase.is_active == True)
    )
    k_entries = k_result.scalars().all()
    knowledge_context = "\n".join([f"Soru: {e.question}\nCevap: {e.answer}" for e in k_entries])

    ai_response = await ai_service.generate_chat_response(
        topic="Genel Destek",
        message=data.content,
        history=[],
        knowledge_context=knowledge_context
    )
    return {"content": ai_response}


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.is_admin:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.municipality_id == current_user.municipality_id)
            .order_by(Conversation.last_message_at.desc())
        )
    else:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.user_id == current_user.id)
            .order_by(Conversation.last_message_at.desc())
        )
    conversations = list(result.scalars().all())
    return [await _build_conv_response(c, db) for c in conversations]


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def start_conversation(
    data: ConversationCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.municipality_id:
        raise HTTPException(status_code=400, detail="Belediye atanmamış")

    conv = Conversation(
        user_id=current_user.id,
        municipality_id=current_user.municipality_id,
        topic=data.topic,
        status=ConversationStatus.AI_RESPONDING,
        last_message_at=datetime.now(timezone.utc),
    )
    db.add(conv)
    await db.flush()

    # İlk kullanıcı mesajı
    user_msg = Message(
        conversation_id=conv.id,
        sender_type=MessageSenderType.CITIZEN,
        sender_id=current_user.id,
        content=data.first_message,
    )
    db.add(user_msg)
    await db.flush()

    # Bilgi bankasını al
    k_result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.municipality_id == current_user.municipality_id, KnowledgeBase.is_active == True))
    k_entries = k_result.scalars().all()
    knowledge_context = "\n".join([f"Soru: {e.question}\nCevap: {e.answer}" for e in k_entries])

    # AI yanıtı
    ai_response = await ai_service.generate_chat_response(
        topic=data.topic or "Genel",
        message=data.first_message,
        history=[],
        knowledge_context=knowledge_context
    )
    ai_msg = Message(
        conversation_id=conv.id,
        sender_type=MessageSenderType.AI,
        content=ai_response,
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(conv)

    return await _build_conv_response(conv, db)


@router.post("/{conv_id}/messages", response_model=MessageResponse)
async def send_message(
    conv_id: int,
    data: MessageCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=404, detail="Konuşma bulunamadı")
    if not current_user.is_admin and conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Erişim reddedildi")

    # Kullanıcı mesajı
    sender_type = MessageSenderType.OFFICIAL if current_user.is_admin else MessageSenderType.CITIZEN
    msg = Message(
        conversation_id=conv_id,
        sender_type=sender_type,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    await db.flush()

    # AI yanıtı (sadece AI modunda ve vatandaş mesajı ise)
    if conv.status == ConversationStatus.AI_RESPONDING and not current_user.is_admin:
        # Geçmiş mesajları al
        history_result = await db.execute(
            select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at).limit(10)
        )
        history = [
            {"sender": m.sender_type.value, "content": m.content}
            for m in history_result.scalars().all()
        ]

        # Bilgi bankasını al
        k_result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.municipality_id == conv.municipality_id, KnowledgeBase.is_active == True))
        k_entries = k_result.scalars().all()
        knowledge_context = "\n".join([f"Soru: {e.question}\nCevap: {e.answer}" for e in k_entries])

        ai_response = await ai_service.generate_chat_response(
            topic=conv.topic or "Genel",
            message=data.content,
            history=history,
            knowledge_context=knowledge_context
        )
        ai_msg = Message(
            conversation_id=conv_id,
            sender_type=MessageSenderType.AI,
            content=ai_response,
        )
        db.add(ai_msg)

    await db.commit()
    await db.refresh(msg)

    # WebSocket: diğer tarafa bildir
    target_user_id = conv.assigned_admin_id if current_user.is_admin else conv.user_id
    if target_user_id:
        await ws_manager.send_chat_message(target_user_id, {
            "conversation_id": conv_id,
            "sender_type": sender_type.value,
            "content": data.content,
        })

    return MessageResponse(
        id=msg.id,
        sender_type=msg.sender_type.value,
        sender_name=current_user.full_name,
        content=msg.content,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )


@router.patch("/{conv_id}/takeover")
async def takeover_conversation(
    conv_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin konuşmayı devralsın."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Sadece admin kullanabilir")

    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv or conv.municipality_id != current_user.municipality_id:
        raise HTTPException(status_code=404, detail="Konuşma bulunamadı")

    conv.status = ConversationStatus.HUMAN_TRANSFERRED
    conv.assigned_admin_id = current_user.id

    system_msg = Message(
        conversation_id=conv_id,
        sender_type=MessageSenderType.OFFICIAL,
        content=f"Konuşma {current_user.full_name} tarafından devralındı. Size yardımcı olmaktan memnuniyet duyarım.",
    )
    db.add(system_msg)
    await db.commit()
    return {"message": "Konuşma devralındı"}


async def _build_conv_response(conv: Conversation, db: AsyncSession) -> ConversationResponse:
    messages_result = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
    )
    messages = []
    for m in messages_result.scalars().all():
        sender_name = None
        if m.sender_id:
            user_result = await db.execute(select(User).where(User.id == m.sender_id))
            sender = user_result.scalar_one_or_none()
            if sender:
                sender_name = sender.full_name
        messages.append(MessageResponse(
            id=m.id,
            sender_type=m.sender_type.value,
            sender_name=sender_name,
            content=m.content,
            is_read=m.is_read,
            created_at=m.created_at,
        ))

    unread = sum(1 for m in messages if not m.is_read)
    return ConversationResponse(
        id=conv.id,
        topic=conv.topic,
        status=conv.status.value,
        last_message_at=conv.last_message_at,
        created_at=conv.created_at,
        messages=messages,
        unread_count=unread,
    )


# WebSocket endpoint
@router.websocket("/ws/{token}")
async def websocket_chat(
    websocket: WebSocket,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = verify_access_token(token)
        user_id = int(payload["sub"])
        municipality_id = payload.get("municipality_id")
    except Exception:
        await websocket.close(code=4001)
        return

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        await websocket.close(code=4001)
        return

    await ws_manager.connect(websocket, user_id, municipality_id, user.is_admin)
    try:
        while True:
            data = await websocket.receive_json()
            # Ping-pong keepalive
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, municipality_id, user.is_admin)
