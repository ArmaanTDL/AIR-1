from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import (
    Inventory,
    LowStockAlert,
    Order,
    Product,
    TransactionLog,
    Warehouse,
)
from ..schemas import TransactionLogOut

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db)):
    total_products = (await db.execute(select(func.count(Product.id)))).scalar() or 0
    total_warehouses = (
        await db.execute(select(func.count()).select_from(Warehouse))
    ).scalar() or 0

    # Total stock value = sum(quantity * unit_price)
    stock_value = (
        await db.execute(
            select(func.coalesce(func.sum(Inventory.quantity * Product.unit_price), 0))
            .join(Product, Product.id == Inventory.product_id)
        )
    ).scalar() or 0

    total_units = (
        await db.execute(select(func.coalesce(func.sum(Inventory.quantity), 0)))
    ).scalar() or 0

    active_alerts = (
        await db.execute(
            select(func.count(LowStockAlert.id)).where(
                LowStockAlert.alert_status == "ACTIVE"
            )
        )
    ).scalar() or 0

    today = datetime.now(timezone.utc).date()
    orders_today = (
        await db.execute(
            select(func.count(Order.id)).where(func.date(Order.created_at) == today)
        )
    ).scalar() or 0

    total_orders = (await db.execute(select(func.count(Order.id)))).scalar() or 0

    # Orders by status (for kanban / charts)
    status_rows = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    orders_by_status = {s: c for s, c in status_rows.all()}

    return {
        "total_products": total_products,
        "total_warehouses": total_warehouses,
        "total_stock_value": float(stock_value),
        "total_units": int(total_units),
        "active_alerts": active_alerts,
        "orders_today": orders_today,
        "total_orders": total_orders,
        "orders_by_status": orders_by_status,
    }


@router.get("/stock-levels")
async def stock_levels(db: AsyncSession = Depends(get_db)):
    """Aggregate stock per region — drives the donut + area charts."""
    rows = await db.execute(
        select(
            Inventory.warehouse_region,
            func.sum(Inventory.quantity),
            func.coalesce(func.sum(Inventory.quantity * Product.unit_price), 0),
        )
        .join(Product, Product.id == Inventory.product_id)
        .group_by(Inventory.warehouse_region)
    )
    by_region = [
        {"region": region, "units": int(units or 0), "value": float(value or 0)}
        for region, units, value in rows.all()
    ]

    # Stock by category
    cat_rows = await db.execute(
        select(Product.category, func.sum(Inventory.quantity))
        .join(Inventory, Inventory.product_id == Product.id)
        .group_by(Product.category)
    )
    by_category = [
        {"category": cat or "Uncategorized", "units": int(units or 0)}
        for cat, units in cat_rows.all()
    ]

    return {"by_region": by_region, "by_category": by_category}


@router.get("/transaction-log", response_model=list[TransactionLogOut])
async def transaction_log(
    type: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TransactionLog).order_by(TransactionLog.executed_at.desc()).limit(limit)
    if type:
        stmt = stmt.where(TransactionLog.transaction_type == type)
    if status:
        stmt = stmt.where(TransactionLog.status == status.upper())
    result = await db.execute(stmt)
    return result.scalars().all()
