from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

VALID_REGIONS = {"NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"}


# ----------------------------- Auth -----------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# --------------------------- Suppliers ---------------------------
class SupplierBase(BaseModel):
    name: str
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    reliability_score: Decimal = Field(default=Decimal("5.0"), ge=0, le=10)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    reliability_score: Decimal | None = Field(default=None, ge=0, le=10)


class SupplierOut(SupplierBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------------------------- Products ---------------------------
class ProductBase(BaseModel):
    sku: str
    name: str
    category: str | None = None
    unit_price: Decimal = Field(ge=0)
    supplier_id: int | None = None
    low_stock_threshold: int = Field(default=10, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: str | None = None
    name: str | None = None
    category: str | None = None
    unit_price: Decimal | None = Field(default=None, ge=0)
    supplier_id: int | None = None
    low_stock_threshold: int | None = Field(default=None, ge=0)


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    supplier_name: str | None = None


# --------------------------- Warehouses --------------------------
class WarehouseBase(BaseModel):
    name: str
    region: str
    location: str | None = None
    capacity: int = Field(default=10000, ge=0)


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    capacity: int | None = Field(default=None, ge=0)


class WarehouseOut(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    partition: str | None = None  # which physical partition this row lives in


# ---------------------------- Inventory --------------------------
class InventoryRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    warehouse_id: int
    warehouse_region: str
    quantity: int
    last_updated: datetime
    product_name: str | None = None
    sku: str | None = None
    threshold: int | None = None
    status: str | None = None  # HEALTHY | WARNING | CRITICAL


class InventoryCreate(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = Field(ge=0)


class StockUpdateItem(BaseModel):
    product_id: int
    warehouse_id: int
    quantity_delta: int  # may be negative


class BatchUpdateRequest(BaseModel):
    updates: list[StockUpdateItem]


# ----------------------------- Orders ----------------------------
class OrderItemIn(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    notes: str | None = None
    items: list[OrderItemIn]


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    warehouse_id: int
    warehouse_region: str
    quantity: int
    unit_price: Decimal
    product_name: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_number: str
    status: str
    total_amount: Decimal | None
    notes: str | None
    created_at: datetime
    completed_at: datetime | None
    items: list[OrderItemOut] = []


# ----------------------------- Alerts ----------------------------
class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    warehouse_id: int
    warehouse_region: str | None
    current_quantity: int | None
    threshold: int | None
    alert_status: str
    triggered_at: datetime
    resolved_at: datetime | None
    product_name: str | None = None


# ----------------------- Transaction log -------------------------
class TransactionLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    transaction_type: str | None
    status: str | None
    affected_records: int | None
    error_message: str | None
    duration_ms: int | None
    executed_at: datetime
