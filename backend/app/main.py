import logging
from contextlib import asynccontextmanager

# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from sqlalchemy import select

from .config import settings
from .database import AsyncSessionLocal, init_db, table_is_empty
from .auth import hash_password
from .models import User
from .routers import (
    alerts,
    analytics,
    auth,
    inventory,
    orders,
    products,
    suppliers,
    warehouses,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexus")


async def ensure_admin_user() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.username == settings.ADMIN_USERNAME)
        )
        if result.scalar_one_or_none() is None:
            db.add(
                User(
                    username=settings.ADMIN_USERNAME,
                    hashed_password=hash_password(settings.ADMIN_PASSWORD),
                )
            )
            await db.commit()
            logger.info("Created admin user '%s'", settings.ADMIN_USERNAME)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.AUTO_INIT_DB:
        try:
            await init_db()
            logger.info("Schema initialized (partitions + triggers).")
        except Exception:  # noqa: BLE001
            logger.exception("Schema init failed — check DATABASE_URL.")

        try:
            await ensure_admin_user()
        except Exception:  # noqa: BLE001
            logger.exception("Admin user creation failed.")

        if settings.AUTO_SEED:
            try:
                if await table_is_empty("products"):
                    from seed_data import seed  # local import to avoid hard dep

                    await seed()
                    logger.info("Seeded demo data.")
            except Exception:  # noqa: BLE001
                logger.exception("Seeding failed (non-fatal).")
    yield


app = FastAPI(
    title="TRACKOS API",
    description="Intelligent Inventory & Supply Chain Platform — ADBMS showcase",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (
    auth,
    products,
    warehouses,
    suppliers,
    inventory,
    orders,
    alerts,
    analytics,
):
    app.include_router(r.router)


@app.get("/")
async def root():
    return {"service": "TRACKOS API", "status": "online", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
