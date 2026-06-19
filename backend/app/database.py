from collections.abc import AsyncGenerator
from pathlib import Path

# pyrefly: ignore [missing-import]
from sqlalchemy import text
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import DeclarativeBase

from .config import settings

# Neon serverless works best with modest pooling + pre-ping to survive idle drops.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


SCHEMA_PATH = Path(__file__).resolve().parent.parent / "sql" / "schema.sql"


async def init_db() -> None:
    """Run the idempotent schema.sql (partitions + triggers) against the DB."""
    sql = SCHEMA_PATH.read_text()
    async with engine.begin() as conn:
        raw_conn = await conn.get_raw_connection()
        await raw_conn.driver_connection.execute(sql)


async def table_is_empty(table: str) -> bool:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
        return (result.scalar() or 0) == 0
