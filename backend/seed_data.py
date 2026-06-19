"""Seed NEXUS SUPPLY with realistic demo data.

Usage (standalone):  python seed_data.py
Also imported by app.main on first startup when AUTO_SEED=true.

Idempotent-ish: it only seeds when the products table is empty.
"""
import asyncio
import random
import uuid
from decimal import Decimal

from sqlalchemy import insert, select, text

from app.database import AsyncSessionLocal, init_db
from app.models import (
    Inventory,
    Order,
    OrderItem,
    Product,
    Supplier,
    Warehouse,
)

REGIONS = ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"]

WAREHOUSES = [
    ("Delhi Distribution Hub", "NORTH", "Okhla Industrial Area, New Delhi"),
    ("Chennai Coastal Depot", "SOUTH", "Ambattur, Chennai"),
    ("Mumbai Port Warehouse", "WEST", "Bhiwandi, Mumbai"),
]

SUPPLIERS = [
    "Tata Logistics Pvt Ltd",
    "Reliance Supply Chain",
    "Mahindra Distributors",
]

CATEGORIES = {
    "Electronics": ["Wireless Mouse", "USB-C Hub"],
    "Apparel": ["Cotton T-Shirt", "Denim Jeans"],
    "Food & Beverage": ["Organic Coffee 1kg", "Green Tea 100pk"],
    "Automotive": ["Brake Pads Set", "Engine Oil 4L"],
    "Pharmaceuticals": ["Paracetamol 500mg", "Vitamin C 1000"],
}


async def seed() -> None:
    await init_db()
    async with AsyncSessionLocal() as db:
        # Guard: only seed an empty catalog.
        existing = (await db.execute(select(Product.id).limit(1))).first()
        if existing:
            return

        # Warehouses
        wh_objs = []
        for name, region, loc in WAREHOUSES:
            wh = Warehouse(name=name, region=region, location=loc,
                           capacity=random.randint(8000, 20000))
            db.add(wh)
            wh_objs.append(wh)
        await db.flush()

        # Suppliers
        sup_objs = []
        for name in SUPPLIERS:
            slug = name.lower().split()[0]
            sup = Supplier(
                name=name,
                contact_email=f"sales@{slug}.co.in",
                contact_phone=f"+91-{random.randint(70,99)}{random.randint(10000000,99999999)}",
                reliability_score=Decimal(str(round(random.uniform(3.5, 5.0), 2))),
            )
            db.add(sup)
            sup_objs.append(sup)
        await db.flush()

        # Products (50)
        prod_objs = []
        for category, names in CATEGORIES.items():
            for pname in names:
                sup = random.choice(sup_objs)
                product = Product(
                    sku=f"{category[:3].upper()}-{uuid.uuid4().hex[:6].upper()}",
                    name=pname,
                    category=category,
                    unit_price=Decimal(str(round(random.uniform(5, 500), 2))),
                    supplier_id=sup.id,
                    low_stock_threshold=random.choice([10, 15, 20, 25]),
                )
                db.add(product)
                prod_objs.append(product)
        await db.flush()

        # Inventory: spread products across warehouses, some below threshold
        inv_count = 0
        for product in prod_objs:
            chosen = random.sample(wh_objs, k=random.randint(1, 2))
            for wh in chosen:
                # 25% chance to be at/below threshold so alerts trigger on first update
                if random.random() < 0.25:
                    qty = random.randint(0, product.low_stock_threshold)
                else:
                    qty = random.randint(product.low_stock_threshold + 5, 200)
                db.add(
                    Inventory(
                        product_id=product.id,
                        warehouse_id=wh.id,
                        warehouse_region=wh.region,
                        quantity=qty,
                    )
                )
                inv_count += 1
        await db.flush()

        # Orders (5) with a mix of statuses
        statuses = ["COMPLETED", "PENDING", "FAILED", "PENDING", "COMPLETED"]
        for status in statuses:
            order = Order(
                order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
                status=status,
                notes=random.choice([None, "Priority customer", "Bulk order"]),
                total_amount=0,
            )
            db.add(order)
            await db.flush()
            total = Decimal("0")
            for _ in range(random.randint(1, 2)):
                product = random.choice(prod_objs)
                wh = random.choice(wh_objs)
                qty = random.randint(1, 5)
                total += product.unit_price * qty
                db.add(
                    OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        warehouse_id=wh.id,
                        warehouse_region=wh.region,
                        quantity=qty,
                        unit_price=product.unit_price,
                    )
                )
            order.total_amount = total

        await db.commit()

        # Generate alerts for currently-low inventory. An UPDATE that lists the
        # quantity column fires `inventory_low_stock_trigger` even when the value
        # is unchanged, so this populates low_stock_alerts via the DB trigger.
        await db.execute(
            text(
                "UPDATE inventory SET quantity = quantity + 0 "
                "WHERE quantity <= (SELECT low_stock_threshold FROM products "
                "WHERE products.id = inventory.product_id)"
            )
        )
        await db.commit()
        print(f"Seeded: {len(wh_objs)} warehouses, {len(sup_objs)} suppliers, "
              f"{len(prod_objs)} products, {inv_count} inventory rows, {len(statuses)} orders.")


if __name__ == "__main__":
    asyncio.run(seed())
