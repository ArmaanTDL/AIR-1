import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import Inventory, Order, OrderItem, Product, TransactionLog
from ..schemas import OrderCreate, OrderItemOut, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


def _to_out(order: Order, names: dict[int, str] | None = None) -> OrderOut:
    out = OrderOut.model_validate(order)
    if names:
        for item in out.items:
            item.product_name = names.get(item.product_id)
    return out


@router.get("", response_model=list[OrderOut])
async def list_orders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).order_by(Order.id.desc())
    )
    orders = result.scalars().all()
    names = await _product_names(db)
    return [_to_out(o, names) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _to_out(order, await _product_names(db))


async def _product_names(db: AsyncSession) -> dict[int, str]:
    result = await db.execute(select(Product.id, Product.name))
    return {pid: name for pid, name in result.all()}


@router.post("", response_model=OrderOut, status_code=201)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Create a PENDING order. Stock is reserved only when fulfilled."""
    if not payload.items:
        raise HTTPException(status_code=422, detail="Order must have at least one item")

    order = Order(
        order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
        status="PENDING",
        notes=payload.notes,
        total_amount=0,
    )
    db.add(order)
    await db.flush()

    total = 0
    for it in payload.items:
        product = await db.get(Product, it.product_id)
        if not product:
            await db.rollback()
            raise HTTPException(status_code=404, detail=f"Product {it.product_id} not found")
        inv = await db.execute(
            select(Inventory).where(
                Inventory.product_id == it.product_id,
                Inventory.warehouse_id == it.warehouse_id,
            )
        )
        inv_row = inv.scalar_one_or_none()
        if not inv_row:
            await db.rollback()
            raise HTTPException(
                status_code=404,
                detail=f"No inventory for product {it.product_id} at warehouse {it.warehouse_id}",
            )
        line_total = product.unit_price * it.quantity
        total += line_total
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=it.product_id,
                warehouse_id=it.warehouse_id,
                warehouse_region=inv_row.warehouse_region,
                quantity=it.quantity,
                unit_price=product.unit_price,
            )
        )

    order.total_amount = total
    await db.commit()
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order.id)
    )
    return _to_out(result.scalar_one(), await _product_names(db))


@router.post("/{order_id}/fulfill", response_model=OrderOut)
async def fulfill_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """ACID fulfillment: lock + decrement stock for every line atomically.

    If any line lacks stock the whole order is rolled back and marked FAILED.
    """
    start = time.time()
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "COMPLETED":
        raise HTTPException(status_code=409, detail="Order already completed")

    try:
        for item in order.items:
            inv = await db.execute(
                select(Inventory)
                .where(
                    Inventory.product_id == item.product_id,
                    Inventory.warehouse_id == item.warehouse_id,
                )
                .with_for_update()
            )
            inv_row = inv.scalar_one_or_none()
            if not inv_row or inv_row.quantity < item.quantity:
                available = inv_row.quantity if inv_row else 0
                raise ValueError(
                    f"Insufficient stock for product {item.product_id}: "
                    f"need {item.quantity}, have {available}"
                )
            inv_row.quantity -= item.quantity

        order.status = "COMPLETED"
        order.completed_at = datetime.now(timezone.utc)
        await db.execute(
            insert(TransactionLog).values(
                transaction_type="ORDER_FULFILLMENT",
                status="SUCCESS",
                affected_records=len(order.items),
                duration_ms=int((time.time() - start) * 1000),
            )
        )
        await db.commit()

    except Exception as e:  # noqa: BLE001
        await db.rollback()
        order = await db.get(Order, order_id)
        order.status = "FAILED"
        await db.execute(
            insert(TransactionLog).values(
                transaction_type="ORDER_FULFILLMENT",
                status="ROLLED_BACK",
                affected_records=0,
                error_message=str(e),
                duration_ms=int((time.time() - start) * 1000),
            )
        )
        await db.commit()
        raise HTTPException(
            status_code=400, detail={"error": str(e), "status": "rolled_back"}
        )

    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    return _to_out(result.scalar_one(), await _product_names(db))


@router.delete("/{order_id}", status_code=204)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.delete(order)
    await db.commit()
