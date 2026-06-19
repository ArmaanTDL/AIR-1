from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import Warehouse
from ..schemas import VALID_REGIONS, WarehouseCreate, WarehouseOut, WarehouseUpdate

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


def _to_out(w: Warehouse) -> WarehouseOut:
    out = WarehouseOut.model_validate(w)
    out.partition = f"warehouses_{w.region.lower()}"
    return out


@router.get("", response_model=list[WarehouseOut])
async def list_warehouses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse).order_by(Warehouse.region, Warehouse.id))
    return [_to_out(w) for w in result.scalars().all()]


@router.post("", response_model=WarehouseOut, status_code=201)
async def create_warehouse(
    payload: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    region = payload.region.upper()
    if region not in VALID_REGIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Region must be one of {sorted(VALID_REGIONS)}",
        )
    data = payload.model_dump()
    data["region"] = region
    warehouse = Warehouse(**data)
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return _to_out(warehouse)


async def _get(db: AsyncSession, warehouse_id: int) -> Warehouse:
    result = await db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse


@router.put("/{warehouse_id}", response_model=WarehouseOut)
async def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    warehouse = await _get(db, warehouse_id)
    # region is the partition key — it cannot change in place, so it's not editable.
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(warehouse, key, value)
    await db.commit()
    await db.refresh(warehouse)
    return _to_out(warehouse)


@router.delete("/{warehouse_id}", status_code=204)
async def delete_warehouse(
    warehouse_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    warehouse = await _get(db, warehouse_id)
    await db.delete(warehouse)
    await db.commit()
