"""Core ACID transaction logic for NEXUS SUPPLY.

`batch_stock_update` is the ADBMS hero feature: it applies a list of inventory
deltas atomically. If ANY delta is invalid (missing row / would go negative) the
whole batch is rolled back and nothing is persisted. Each affected row is locked
with SELECT ... FOR UPDATE (pessimistic / row-level locking) so two concurrent
batches touching the same row serialize instead of corrupting the count.
"""
import time

from fastapi import HTTPException
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Inventory, TransactionLog
from ..schemas import StockUpdateItem


async def _log(db: AsyncSession, **values) -> None:
    await db.execute(insert(TransactionLog).values(**values))


async def batch_stock_update(
    db: AsyncSession,
    updates: list[StockUpdateItem],
    *,
    transaction_type: str = "BATCH_UPDATE",
    lock_delay_s: float = 0.0,
) -> dict:
    """Atomically apply inventory deltas. All-or-nothing.

    `lock_delay_s` is purely for the concurrency demo — it holds the row locks
    a little longer so a competing transaction visibly waits.
    """
    start = time.time()
    steps: list[dict] = []
    try:
        updated = []
        for item in updates:
            # SELECT FOR UPDATE — acquire a row lock for concurrency control.
            result = await db.execute(
                select(Inventory)
                .where(
                    Inventory.product_id == item.product_id,
                    Inventory.warehouse_id == item.warehouse_id,
                )
                .with_for_update()
            )
            inv = result.scalar_one_or_none()
            if inv is None:
                raise ValueError(
                    f"Inventory not found for product {item.product_id} "
                    f"at warehouse {item.warehouse_id}"
                )

            steps.append({"product_id": item.product_id, "step": "locked"})

            new_qty = inv.quantity + item.quantity_delta
            if new_qty < 0:
                raise ValueError(
                    f"Insufficient stock for product {item.product_id}. "
                    f"Current: {inv.quantity}, attempted delta: {item.quantity_delta}"
                )

            inv.quantity = new_qty
            updated.append(
                {
                    "product_id": item.product_id,
                    "warehouse_id": item.warehouse_id,
                    "new_quantity": new_qty,
                }
            )

        if lock_delay_s:
            # Flush so the locks are held in the DB, then hold them briefly.
            await db.flush()
            import asyncio

            await asyncio.sleep(lock_delay_s)

        duration = int((time.time() - start) * 1000)
        await _log(
            db,
            transaction_type=transaction_type,
            status="SUCCESS",
            affected_records=len(updates),
            duration_ms=duration,
        )
        await db.commit()
        return {
            "status": "committed",
            "updated": updated,
            "duration_ms": duration,
            "steps": steps,
        }

    except Exception as e:  # noqa: BLE001 — we re-raise as HTTP below
        await db.rollback()
        duration = int((time.time() - start) * 1000)
        # Log the rollback in its own committed transaction so the proof survives.
        await _log(
            db,
            transaction_type=transaction_type,
            status="ROLLED_BACK",
            affected_records=0,
            error_message=str(e),
            duration_ms=duration,
        )
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail={
                "error": str(e),
                "status": "rolled_back",
                "duration_ms": duration,
            },
        )
