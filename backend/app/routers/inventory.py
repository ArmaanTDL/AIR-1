from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import Inventory, Product, Warehouse
from ..schemas import BatchUpdateRequest, InventoryCreate, InventoryRow
from ..services.concurrency import run_concurrent_test
from ..services.transaction import batch_stock_update

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _status(qty: int, threshold: int) -> str:
    if qty <= threshold:
        return "CRITICAL"
    if qty <= threshold * 1.2:
        return "WARNING"
    return "HEALTHY"


async def _rows(db: AsyncSession, warehouse_id: int | None = None) -> list[InventoryRow]:
    stmt = (
        select(Inventory, Product.name, Product.sku, Product.low_stock_threshold)
        .join(Product, Product.id == Inventory.product_id)
        .order_by(Inventory.warehouse_id, Product.name)
    )
    if warehouse_id is not None:
        stmt = stmt.where(Inventory.warehouse_id == warehouse_id)
    result = await db.execute(stmt)
    rows: list[InventoryRow] = []
    for inv, name, sku, threshold in result.all():
        row = InventoryRow.model_validate(inv)
        row.product_name = name
        row.sku = sku
        row.threshold = threshold
        row.status = _status(inv.quantity, threshold)
        rows.append(row)
    return rows


@router.get("", response_model=list[InventoryRow])
async def all_inventory(db: AsyncSession = Depends(get_db)):
    return await _rows(db)


@router.get("/{warehouse_id}", response_model=list[InventoryRow])
async def inventory_for_warehouse(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    return await _rows(db, warehouse_id)


@router.post("", response_model=InventoryRow, status_code=201)
async def create_inventory(
    payload: InventoryCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Add a product to a warehouse's stock (creates an inventory row)."""
    wh = await db.execute(select(Warehouse).where(Warehouse.id == payload.warehouse_id))
    warehouse = wh.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    product = await db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = await db.execute(
        select(Inventory).where(
            Inventory.product_id == payload.product_id,
            Inventory.warehouse_id == payload.warehouse_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Inventory row already exists for this product/warehouse"
        )

    inv = Inventory(
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        warehouse_region=warehouse.region,
        quantity=payload.quantity,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    row = InventoryRow.model_validate(inv)
    row.product_name = product.name
    row.sku = product.sku
    row.threshold = product.low_stock_threshold
    row.status = _status(inv.quantity, product.low_stock_threshold)
    return row


@router.delete("/{inventory_id}", status_code=204)
async def delete_inventory(
    inventory_id: int,
    region: str = Query(..., description="warehouse_region (partition key)"),
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    result = await db.execute(
        select(Inventory).where(
            Inventory.id == inventory_id,
            Inventory.warehouse_region == region.upper(),
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory row not found")
    await db.delete(inv)
    await db.commit()


@router.post("/batch-update")
async def batch_update(
    payload: BatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """ACID batch stock update — all-or-nothing with row-level locking.

    Returns the committed result, or HTTP 400 with a rollback explanation.
    Every attempt (commit or rollback) is recorded in transaction_log.
    """
    if not payload.updates:
        raise HTTPException(status_code=422, detail="No updates provided")
    return await batch_stock_update(db, payload.updates)


@router.post("/demo/concurrent-test")
async def concurrent_test(
    product_id: int = Query(...),
    warehouse_id: int = Query(...),
    delta: int = Query(5, description="delta each transaction applies"),
    _user=Depends(get_current_user),
):
    """Fire two batch updates at the same inventory row simultaneously."""
    return await run_concurrent_test(product_id, warehouse_id, delta)
