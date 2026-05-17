from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from datetime import datetime, timezone

from app.core.dependencies import get_db, get_current_user, get_optional_user, get_current_admin
from app.models.dynamic_form import DynamicForm, FormResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/forms", tags=["Dynamic Forms"])

@router.post("/generate-ai")
async def generate_ai_form(
    topic: str = Query(..., description="Anket konusu"),
    current_user = Depends(get_current_admin)
):
    """Verilen konuya göre AI ile otomatik form soruları üretir."""
    questions = await ai_service.generate_form_questions(topic)
    if not questions:
        raise HTTPException(status_code=500, detail="AI soru üretemedi. Lütfen API anahtarını kontrol edin.")
    return {"questions": questions}

@router.post("")
async def create_form(
    title: str,
    schema: list,
    description: Optional[str] = None,
    settings: Optional[dict] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Yeni bir dinamik form oluştur (Sadece Admin)."""
    default_settings = {
        "is_public": True,
        "allow_multiple_responses": False,
        "max_responses": None,
        "expires_at": None
    }
    if settings:
        default_settings.update(settings)
        
    form = DynamicForm(
        title=title,
        description=description,
        schema=schema,
        settings=default_settings,
        municipality_id=current_user.municipality_id,
        created_by_id=current_user.id
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return {"message": "Form başarıyla oluşturuldu", "form_id": form.id}


@router.get("")
async def get_forms(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Belediyenin tüm formlarını listele (Admin için)."""
    query = select(DynamicForm).where(
        DynamicForm.municipality_id == current_user.municipality_id
    ).order_by(desc(DynamicForm.created_at))
    
    result = await db.execute(query)
    forms = result.scalars().all()
    
    return {"forms": [
        {
            "id": f.id,
            "title": f.title,
            "is_active": f.is_active,
            "created_at": f.created_at,
            "responses_count": len(f.responses) if hasattr(f, 'responses') else 0
        } for f in forms
    ]}


@router.get("/{form_id}")
async def get_form_by_id(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_optional_user)
):
    """Kullanıcının doldurması için form şemasını getir."""
    result = await db.execute(select(DynamicForm).where(DynamicForm.id == form_id))
    form = result.scalar_one_or_none()
    
    if not form or not form.is_active:
        raise HTTPException(status_code=404, detail="Form bulunamadı veya aktif değil.")
        
    # Güvenlik ve Kota kontrolleri
    if not form.settings.get("is_public") and not current_user:
        raise HTTPException(status_code=401, detail="Bu formu doldurmak için giriş yapmalısınız.")
        
    if form.settings.get("expires_at"):
        expires_at = datetime.fromisoformat(form.settings["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Bu formun süresi dolmuştur.")
            
    return {
        "id": form.id,
        "title": form.title,
        "description": form.description,
        "schema": form.schema,
        "settings": form.settings
    }


@router.post("/{form_id}/responses")
async def submit_response(
    form_id: int,
    data: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_optional_user)
):
    """Kullanıcının form cevaplarını kaydet."""
    result = await db.execute(select(DynamicForm).where(DynamicForm.id == form_id))
    form = result.scalar_one_or_none()
    
    if not form or not form.is_active:
        raise HTTPException(status_code=404, detail="Form bulunamadı.")
        
    # Anti-cheat: Çoklu katılım kontrolü
    if not form.settings.get("allow_multiple_responses") and current_user:
        existing = await db.execute(
            select(FormResponse).where(
                FormResponse.form_id == form_id,
                FormResponse.user_id == current_user.id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Bu formu daha önce doldurdunuz.")

    response = FormResponse(
        form_id=form_id,
        user_id=current_user.id if current_user else None,
        data=data
    )
    db.add(response)
    await db.commit()
    
    # İleride burada BackgroundTasks ile form bitiş maili vb. eklenebilir.
    return {"message": "Yanıtınız başarıyla kaydedildi."}


@router.get("/{form_id}/export")
async def export_responses(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Form yanıtlarını CSV olarak dışa aktar (Sadece Admin)."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    # Formu ve yanıtları getir
    result = await db.execute(
        select(DynamicForm).where(DynamicForm.id == form_id)
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form bulunamadı.")

    # Yanıtları getir
    res_result = await db.execute(
        select(FormResponse).where(FormResponse.form_id == form_id).order_by(desc(FormResponse.submitted_at))
    )
    responses = res_result.scalars().all()

    # CSV oluşturma
    output = io.StringIO()
    writer = csv.writer(output)

    # Header: Soru başlıklarını sütun isimleri olarak kullan
    questions = form.schema
    header = ["Tarih", "Kullanıcı ID"] + [q["title"] for q in questions]
    writer.writerow(header)

    for res in responses:
        row = [res.submitted_at.isoformat(), res.user_id or "Anonim"]
        for q in questions:
            ans = res.data.get(q["id"], "")
            if isinstance(ans, list):
                ans = ", ".join(ans)
            row.append(ans)
        writer.writerow(row)

    output.seek(0)
    
    filename = f"form_{form_id}_responses.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{form_id}/analytics")
async def get_form_analytics(
    form_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Form yanıtlarının istatistiksel özetini getir (Sadece Admin)."""
    result = await db.execute(
        select(DynamicForm).where(DynamicForm.id == form_id)
    )
    form = result.scalar_one_or_none()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form bulunamadı.")

    res_result = await db.execute(
        select(FormResponse).where(FormResponse.form_id == form_id)
    )
    responses = res_result.scalars().all()
    total_responses = len(responses)

    analytics = []
    
    for q in form.schema:
        q_id = q["id"]
        q_type = q["type"]
        q_title = q["title"]
        
        q_data = {
            "id": q_id,
            "title": q_title,
            "type": q_type,
            "total_answers": 0,
            "data": []
        }

        if q_type in ["multiple_choice", "checkbox", "dropdown"]:
            counts = {}
            for res in responses:
                ans = res.data.get(q_id)
                if ans:
                    q_data["total_answers"] += 1
                    if isinstance(ans, list):
                        for item in ans:
                            counts[item] = counts.get(item, 0) + 1
                    else:
                        counts[ans] = counts.get(ans, 0) + 1
            
            q_data["data"] = [{"name": k, "value": v} for k, v in counts.items()]
        
        elif q_type in ["short_text", "paragraph"]:
            recent_answers = []
            for res in responses[:10]: # Son 10 cevabı göster
                ans = res.data.get(q_id)
                if ans:
                    q_data["total_answers"] += 1
                    recent_answers.append(ans)
            q_data["recent_answers"] = recent_answers

        analytics.append(q_data)

    return {
        "form_title": form.title,
        "total_responses": total_responses,
        "analytics": analytics
    }
