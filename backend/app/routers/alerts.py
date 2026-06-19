from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import LowStockAlert, Product
from ..schemas import AlertOut

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
async def list_alerts(
    status: str | None = Query(None, description="ACTIVE | RESOLVED | ACKNOWLEDGED"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(LowStockAlert, Product.name)
        .join(Product, Product.id == LowStockAlert.product_id)
        .order_by(LowStockAlert.triggered_at.desc())
    )
    if status:
        stmt = stmt.where(LowStockAlert.alert_status == status.upper())
    result = await db.execute(stmt)
    out: list[AlertOut] = []
    for alert, name in result.all():
        item = AlertOut.model_validate(alert)
        item.product_name = name
        out.append(item)
    return out


@router.patch("/{alert_id}/acknowledge", response_model=AlertOut)
async def acknowledge_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    alert = await db.get(LowStockAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.alert_status = "ACKNOWLEDGED"
    await db.commit()
    await db.refresh(alert)
    return AlertOut.model_validate(alert)


@router.patch("/{alert_id}/resolve", response_model=AlertOut)
async def resolve_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    alert = await db.get(LowStockAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.alert_status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)
    return AlertOut.model_validate(alert)
