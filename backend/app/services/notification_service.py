import logging
import json
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """Web Push ve E-posta bildirimleri."""

    async def send_push_notification(
        self,
        push_token_json: str,
        title: str,
        body: str,
        data: Optional[dict] = None,
    ) -> bool:
        """Web Push bildirimi gönder."""
        if not settings.VAPID_PRIVATE_KEY:
            logger.debug("VAPID key ayarlanmamış, push bildirimi atlandı")
            return False

        try:
            from pywebpush import webpush, WebPushException
            subscription = json.loads(push_token_json)
            payload = json.dumps({
                "title": title,
                "body": body,
                "data": data or {},
            })
            webpush(
                subscription_info=subscription,
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIMS_EMAIL}"},
            )
            return True
        except Exception as e:
            logger.error(f"Push bildirim hatası: {e}")
            return False

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
    ) -> bool:
        """SMTP e-posta gönder."""
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.debug("SMTP ayarlanmamış, e-posta atlandı")
            return False

        try:
            import aiosmtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_email
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )
            logger.info(f"E-posta gönderildi: {to_email}")
            return True
        except Exception as e:
            logger.error(f"E-posta gönderme hatası: {e}")
            return False

    async def notify_complaint_status_change(
        self,
        user_push_token: Optional[str],
        user_email: Optional[str],
        complaint_id: int,
        new_status: str,
    ):
        """Şikayet durum değişikliği bildirimi."""
        title = "Şikayetiniz Güncellendi"
        body = f"#{complaint_id} numaralı şikayetinizin durumu '{new_status}' olarak güncellendi."

        if user_push_token:
            await self.send_push_notification(
                user_push_token, title, body, {"complaint_id": complaint_id}
            )

        if user_email:
            html = f"""
            <h2>Şikayetiniz Güncellendi</h2>
            <p>{body}</p>
            <p>Detayları görüntülemek için sisteme giriş yapın.</p>
            """
            await self.send_email(user_email, title, html)

    async def notify_urgent_complaint_to_admin(
        self,
        admin_push_tokens: list,
        complaint_id: int,
        urgency_score: int,
        summary: str,
    ):
        """Acil şikayet admin bildirimi (urgency >= 8)."""
        title = f"🚨 Acil Şikayet #{complaint_id}"
        body = f"Aciliyet: {urgency_score}/10 - {summary[:100]}"

        for token in admin_push_tokens:
            if token:
                await self.send_push_notification(
                    token, title, body, {"complaint_id": complaint_id, "urgent": True}
                )


notification_service = NotificationService()
