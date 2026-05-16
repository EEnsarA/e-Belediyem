import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket bağlantı yöneticisi."""

    def __init__(self):
        # Aktif bağlantılar: {user_id: WebSocket}
        self.active_connections: Dict[int, WebSocket] = {}
        # Belediye admin bağlantıları: {municipality_id: [WebSocket]}
        self.admin_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, municipality_id: Optional[int] = None, is_admin: bool = False):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if is_admin and municipality_id:
            if municipality_id not in self.admin_connections:
                self.admin_connections[municipality_id] = []
            self.admin_connections[municipality_id].append(websocket)
        logger.info(f"WebSocket bağlandı: user_id={user_id}")

    def disconnect(self, user_id: int, municipality_id: Optional[int] = None, is_admin: bool = False):
        ws = self.active_connections.pop(user_id, None)
        if is_admin and municipality_id and ws:
            connections = self.admin_connections.get(municipality_id, [])
            if ws in connections:
                connections.remove(ws)
        logger.info(f"WebSocket ayrıldı: user_id={user_id}")

    async def send_to_user(self, user_id: int, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Mesaj gönderilemedi user_id={user_id}: {e}")
                self.active_connections.pop(user_id, None)

    async def broadcast_to_municipality_admins(self, municipality_id: int, message: dict):
        """Belediyenin tüm admin'lerine broadcast."""
        connections = self.admin_connections.get(municipality_id, [])
        dead_connections = []
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.append(ws)
        for ws in dead_connections:
            connections.remove(ws)

    async def broadcast_complaint_update(self, municipality_id: int, complaint_id: int, status: str):
        """Şikayet durum güncellemesini admin'lere yayınla."""
        await self.broadcast_to_municipality_admins(municipality_id, {
            "type": "complaint_update",
            "complaint_id": complaint_id,
            "status": status,
        })

    async def broadcast_new_complaint(self, municipality_id: int, complaint_data: dict):
        """Yeni şikayet geldiğinde admin'lere yayınla."""
        await self.broadcast_to_municipality_admins(municipality_id, {
            "type": "new_complaint",
            "data": complaint_data,
        })

    async def send_chat_message(self, user_id: int, message_data: dict):
        """Chat mesajı gönder."""
        await self.send_to_user(user_id, {
            "type": "chat_message",
            "data": message_data,
        })


ws_manager = ConnectionManager()
