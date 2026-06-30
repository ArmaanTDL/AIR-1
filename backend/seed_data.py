"""Seed NEXUS SUPPLY with realistic gaming demo data.

Usage (standalone):  python seed_data.py
Also imported by app.main on first startup when AUTO_SEED=true.
"""
import asyncio
import random
import uuid
from decimal import Decimal

# pyrefly: ignore [missing-import]
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
    ("EU West Vault", "NORTH", "London Data Center, United Kingdom"),
    ("Chennai Coastal Depot", "SOUTH", "Ambattur, Chennai"),
    ("NA East Vault", "WEST", "Northern Virginia Data Center, USA"),
]

SUPPLIERS = [
    "Bandai Namco Entertainment",
    "CD Projekt Red",
    "Valve Corporation",
    "Rockstar Games",
    "Nintendo",
]

CATEGORIES = {
    "Action RPG": ["Elden Ring", "Dark Souls III", "The Witcher 3: Wild Hunt"],
    "Action Sci-Fi": ["Cyberpunk 2077", "Deus Ex: Human Revolution"],
    "Puzzle": ["Portal 2", "The Witness"],
    "Sandbox": ["Minecraft", "Terraria"],
    "Roguelike": ["Hades", "Dead Cells"],
}


async def seed() -> None:
    await init_db()
    async with AsyncSessionLocal() as db:
        # Clear existing tables to force fresh gaming seed
        await db.execute(text("DELETE FROM low_stock_alerts;"))
        await db.execute(text("DELETE FROM order_items;"))
        await db.execute(text("DELETE FROM orders;"))
        await db.execute(text("DELETE FROM inventory;"))
        await db.execute(text("DELETE FROM products;"))
        await db.execute(text("DELETE FROM warehouses;"))
        await db.execute(text("DELETE FROM suppliers;"))
        await db.commit()

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
                contact_email=f"publishing@{slug}.com",
                contact_phone=f"+1-{random.randint(100,999)}-{random.randint(1000,9999)}",
                reliability_score=Decimal(str(round(random.uniform(4.0, 5.0), 2))),
            )
            db.add(sup)
            sup_objs.append(sup)
        await db.flush()

        # Products (Games)
        prod_objs = []
        for category, names in CATEGORIES.items():
            for pname in names:
                sup = random.choice(sup_objs)
                product = Product(
                    sku=f"GAME-{uuid.uuid4().hex[:6].upper()}",
                    name=pname,
                    category=category,
                    unit_price=Decimal(str(round(random.uniform(299, 4999), 2))),
                    supplier_id=sup.id,
                    low_stock_threshold=random.choice([10, 15, 20, 25]),
                )
                db.add(product)
                prod_objs.append(product)
        await db.flush()

        # Inventory: spread games across warehouses, some below threshold
        inv_count = 0
        for product in prod_objs:
            chosen = random.sample(wh_objs, k=random.randint(1, 2))
            for wh in chosen:
                # 25% chance to be at/below threshold so alerts trigger
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
                notes=random.choice([None, "Digital Delivery", "Pre-order key"]),
                total_amount=0,
            )
            db.add(order)
            await db.flush()
            total = Decimal("0")
            for _ in range(random.randint(1, 2)):
                product = random.choice(prod_objs)
                wh = random.choice(wh_objs)
                qty = random.randint(1, 2)
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

        # Generate alerts for currently-low inventory via database trigger
        await db.execute(
            text(
                "UPDATE inventory SET quantity = quantity + 0 "
                "WHERE quantity <= (SELECT low_stock_threshold FROM products "
                "WHERE products.id = inventory.product_id)"
            )
        )
        await db.commit()
        print(f"Seeded Game Data: {len(wh_objs)} vaults, {len(sup_objs)} publishers, "
              f"{len(prod_objs)} games, {inv_count} inventory keys, {len(statuses)} orders.")


if __name__ == "__main__":
    asyncio.run(seed())
