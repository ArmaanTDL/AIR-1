"""Concurrency-control demo.

Fires two batch updates against the SAME inventory row at the same time. Because
`batch_stock_update` takes a SELECT ... FOR UPDATE lock, the second transaction
blocks until the first commits — proving row-level pessimistic locking. The
result reports which transaction won the lock first and how long the other waited.
"""
import asyncio
import time

from ..database import AsyncSessionLocal
from ..schemas import StockUpdateItem
from .transaction import batch_stock_update


async def _competitor(name: str, item: StockUpdateItem, delay_s: float) -> dict:
    start = time.time()
    async with AsyncSessionLocal() as db:
        try:
            res = await batch_stock_update(
                db,
                [item],
                transaction_type=f"CONCURRENT_TEST[{name}]",
                lock_delay_s=delay_s,
            )
            return {
                "name": name,
                "outcome": "committed",
                "waited_ms": int((time.time() - start) * 1000),
                "new_quantity": res["updated"][0]["new_quantity"],
            }
        except Exception as e:  # noqa: BLE001
            detail = getattr(e, "detail", str(e))
            return {
                "name": name,
                "outcome": "rolled_back",
                "waited_ms": int((time.time() - start) * 1000),
                "error": detail,
            }


async def run_concurrent_test(product_id: int, warehouse_id: int, delta: int) -> dict:
    item = StockUpdateItem(
        product_id=product_id, warehouse_id=warehouse_id, quantity_delta=delta
    )
    # Transaction A holds its lock for 0.6s; B starts simultaneously and must wait.
    results = await asyncio.gather(
        _competitor("A", item, delay_s=0.6),
        _competitor("B", item, delay_s=0.0),
    )
    results.sort(key=lambda r: r["waited_ms"])
    return {
        "description": (
            "Both transactions targeted the same inventory row. SELECT FOR UPDATE "
            "forced them to serialize — the second waited for the first to commit."
        ),
        "winner": results[0]["name"],
        "results": results,
    }
