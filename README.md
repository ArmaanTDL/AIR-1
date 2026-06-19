# NEXUS SUPPLY — Intelligent Inventory & Supply Chain Platform

A full-stack **ADBMS showcase**: a dark, animated inventory dashboard backed by a
PostgreSQL database that demonstrates **ACID transactions, triggers, table
partitioning, and concurrency control**.

- **Frontend:** React (Vite) · Tailwind CSS · Framer Motion · Recharts · Zustand · Axios
- **Backend:** FastAPI · SQLAlchemy 2.0 (async) · asyncpg · JWT auth
- **Database:** PostgreSQL (Neon.tech free tier)
- **Deploy:** Render (backend) · Vercel (frontend) · Neon (DB) — all free tier

---

## ADBMS concepts (where to see them)

| Concept | Where | Proof in the UI |
|---|---|---|
| **ACID transactions** | `POST /inventory/batch-update`, `POST /orders/{id}/fulfill` | **Inventory → Batch Update** animation; **Transaction Log** page |
| **Triggers** | `sql/schema.sql` (`check_low_stock`, `resolve_low_stock_alert`, `update_inventory_timestamp`) | **Alerts** page (auto-generated rows) |
| **Partitioning** | `warehouses` & `inventory` LIST-partitioned by region | **Warehouses** page shows each row's physical partition |
| **Concurrency control** | `SELECT … FOR UPDATE` in `services/transaction.py`; `POST /inventory/demo/concurrent-test` | **Inventory →** 🧪 beaker button fires two concurrent TXs |

---

## Full CRUD

Add / edit / delete is implemented end-to-end for **Products, Suppliers,
Warehouses, Inventory rows, and Orders** (create + fulfill + delete). All write
endpoints require a JWT (log in first).

---

## Run locally

### 1. Database
Create a free PostgreSQL DB on [neon.tech](https://neon.tech) (or run Postgres locally).
Grab the connection string and convert it to the async driver form:
```
postgresql+asyncpg://USER:PASS@HOST/DB?ssl=require
```

### 2. Backend  (Python 3.11 recommended — matches pinned requirements)
```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then paste your DATABASE_URL
uvicorn app.main:app --reload --port 8000
```
On first boot it auto-creates the schema (partitions + triggers), an `admin`
user, and seeds demo data (`AUTO_INIT_DB` / `AUTO_SEED` in `.env`).
API docs: http://localhost:8000/docs

> To seed manually instead: `python seed_data.py`

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npm run dev                   # http://localhost:5173
```
Login: **admin / admin123**

---

## Deploy (free tier)

- **DB:** Neon project → copy `postgresql+asyncpg://…` string.
- **Backend → Render:** New Web Service from `backend/` (uses `render.yaml`).
  Set `DATABASE_URL`, `ADMIN_PASSWORD`, and `CORS_ORIGINS` (your Vercel URL).
- **Frontend → Vercel:** Import `frontend/`, set `VITE_API_URL` to the Render URL.

---

## Key endpoints

```
POST   /auth/login
GET/POST/PUT/DELETE  /products
GET/POST/PUT/DELETE  /suppliers
GET/POST/PUT/DELETE  /warehouses
GET/POST/DELETE      /inventory            GET /inventory/{warehouse_id}
POST   /inventory/batch-update             ← ACID transaction (all-or-nothing)
POST   /inventory/demo/concurrent-test     ← row-lock concurrency demo
GET/POST /orders     POST /orders/{id}/fulfill     DELETE /orders/{id}
GET    /alerts       PATCH /alerts/{id}/acknowledge
GET    /analytics/dashboard | /stock-levels | /transaction-log
```
