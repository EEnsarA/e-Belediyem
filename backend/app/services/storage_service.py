import io
import logging
from typing import Optional
from minio import Minio
from minio.error import S3Error
from datetime import timedelta
from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.use_local = False
        self.local_dir = "static/uploads"
        
        try:
            self.client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,
            )
            # Bağlantıyı test et
            self.client.list_buckets()
            self._ensure_bucket()
            logger.info("✅ MinIO bağlantısı başarılı.")
        except Exception as e:
            logger.warning(f"⚠️ MinIO bağlantısı kurulamadı, yerel depolamaya geçiliyor: {e}")
            self.client = None
            self.use_local = True
            import os
            if not os.path.exists(self.local_dir):
                os.makedirs(self.local_dir, exist_ok=True)

    def _ensure_bucket(self):
        """Bucket yoksa oluştur."""
        try:
            if not self.client.bucket_exists(settings.MINIO_BUCKET):
                self.client.make_bucket(settings.MINIO_BUCKET)
                logger.info(f"Bucket oluşturuldu: {settings.MINIO_BUCKET}")
        except Exception as e:
            logger.warning(f"Bucket kontrolü başarısız: {e}")

    async def upload_complaint_photo(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        complaint_id: int,
    ) -> Optional[str]:
        """Şikayet fotoğrafı yükle, signed URL döndür."""
        object_name = f"complaints/{complaint_id}/{filename}"

        if self.use_local:
            import os
            file_path = os.path.join(self.local_dir, object_name)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(file_bytes)
            return f"http://localhost:8000/{self.local_dir}/{object_name}"

        if not self.client:
            logger.warning("MinIO mevcut değil, fotoğraf yüklenemedi")
            return None
        
        # ... (rest of the checks)
        try:
            self.client.put_object(
                settings.MINIO_BUCKET,
                object_name,
                io.BytesIO(file_bytes),
                length=len(file_bytes),
                content_type=content_type,
            )
            return await self.get_signed_url(object_name)
        except Exception as e:
            logger.error(f"Yükleme hatası: {e}")
            return None

    async def get_signed_url(self, object_name: str) -> Optional[str]:
        """Signed URL üret (24 saat geçerli)."""
        if not self.client:
            return None
        try:
            url = self.client.presigned_get_object(
                settings.MINIO_BUCKET,
                object_name,
                expires=timedelta(hours=settings.SIGNED_URL_EXPIRE_HOURS),
            )
            return url
        except Exception as e:
            logger.error(f"Signed URL hatası: {e}")
            return None

    async def delete_object(self, object_name: str) -> bool:
        if not self.client:
            return False
        try:
            self.client.remove_object(settings.MINIO_BUCKET, object_name)
            return True
        except Exception as e:
            logger.error(f"Silme hatası: {e}")
            return False


storage_service = StorageService()
