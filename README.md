<div align="center">

<br/>

<!-- HERO BANNER -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=200&section=header&text=AIR%201&fontSize=90&fontAlignY=35&desc=Key%20Vault%20System&descAlignY=60&descSize=22&fontColor=FFFFFF&animation=fadeIn"/>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=200&section=header&text=AIR%201&fontSize=90&fontAlignY=35&desc=Key%20Vault%20System&descAlignY=60&descSize=22&fontColor=FFFFFF&animation=fadeIn" alt="AIR 1 Banner" width="100%"/>
</picture>

<br/>

<!-- TAGLINE -->
<h3>
  <samp>〔 A Premium, Cinematic Game Key Distribution Platform 〕</samp>
</h3>

<br/>

<!-- LIVE BADGES -->
<a href="https://air-1-rosy.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge&logo=statuspage&logoColor=white" alt="Status"/>
</a>
<a href="https://github.com/ArmaanTDL/AIR-1---"><img src="https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular"/></a>
&nbsp;
<a href="https://github.com/ArmaanTDL/AIR-1---"><img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/></a>
&nbsp;
<a href="https://github.com/ArmaanTDL/AIR-1---"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/></a>
&nbsp;
<a href="https://github.com/ArmaanTDL/AIR-1---"><img src="https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=black" alt="GSAP"/></a>

<br/><br/>

<!-- VIDEO SECTION -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<!--   📽️  REPLACE THE HREF AND SRC BELOW WITH YOUR VIDEO DETAILS  -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<a href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID">
  <img src="https://img.shields.io/badge/▶%20Watch%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo" height="50"/>
</a>

<br/>

> **💡 To add your own video:** Replace `YOUR_VIDEO_ID` above with your YouTube video ID.
> Then paste a thumbnail image from your video directly below this section.

<br/>

<!-- PUT YOUR PROJECT SCREENSHOT OR VIDEO THUMBNAIL HERE -->
<!-- Example: <img src="your-screenshot-url" alt="AIR 1 Dashboard Preview" width="90%"/> -->

---

</div>

## ✦ What is AIR 1?

**AIR 1** is a high-end, full-stack **Game Key Distribution & Inventory Management Platform**. It was built to showcase a deep command of modern web engineering — combining a cinematic, Apple-style interactive frontend with a battle-hardened, asynchronous Python backend and an ACID-compliant PostgreSQL database.

The design philosophy is rooted in **premium minimalism** — warm cream tones, stark black typography, and scroll-bound kinetic animations that feel buttery and organic on every display.

---

## ✦ Experience Preview

| | |
|:---:|:---:|
| **Interactive Landing Page** | **Command Center Dashboard** |
| Cinematic GSAP scroll animations with Lenis smooth-scrolling, split-letter convergence, and video background | Real-time metric cards, ACID-compliant inventory tables, stock distribution charts, and live alert feeds |
| **Game Vault Catalog** | **Secure API Console** |
| Seeded with real gaming titles (Elden Ring, Cyberpunk 2077, Portal 2) with key distribution specs | JWT-authenticated FastAPI backend with interactive Swagger docs at `/docs` |

---

## ✦ Tech Stack

<table>
  <tr>
    <td valign="top" width="33%">

### Frontend
- **Angular 18** — Standalone Components
- **Tailwind CSS** — Utility-First Styling
- **GSAP + ScrollTrigger** — Cinematic Animations
- **Lenis** — Buttery Smooth Scrolling
- **RxJS** — Reactive Data Streams
- **TypeScript** — Type Safety

    </td>
    <td valign="top" width="33%">

### Backend
- **FastAPI** — High-performance API
- **SQLAlchemy 2.0** — Async ORM
- **asyncpg** — Fast PostgreSQL Driver
- **JWT** — Secure Authentication
- **Pydantic** — Data Validation
- **Uvicorn** — ASGI Server

    </td>
    <td valign="top" width="33%">

### Infrastructure
- **PostgreSQL** — ACID Transactions
- **Neon.tech** — Serverless Postgres
- **Render** — Backend Hosting
- **Vercel** — Frontend Hosting
- **List Partitioning** — Regional Key Vaults
- **Row-Level Locking** — No Overselling

    </td>
  </tr>
</table>

---

## ✦ Architecture Highlights

```
AIR 1 Platform
│
├── 🎬 Landing Page         GSAP timeline, Lenis scroll, split-letter
│   ├── Phase A: Letter Convergence (A I R → AIR)
│   ├── Phase B: Logo Flight & Dock (top-left corner)
│   └── Phase C: Header Reveal + Hero Content Fade-In
│
├── 🔐 Auth Guard           JWT token validation on protected routes
│
└── 🖥️  Console Dashboard
    ├── /console             Command Center (Live metrics, charts)
    ├── /console/products    Game Catalog (11+ games seeded)
    ├── /console/inventory   Regional Key Vaults (NORTH/SOUTH/EAST/WEST)
    ├── /console/orders      Order fulfillment pipeline
    ├── /console/suppliers   Publisher management
    ├── /console/warehouses  Vault partition management
    ├── /console/alerts      Live low-stock alert feed
    └── /console/transactions Audit trail log
```

---

## ✦ Live Deployment Guide

> **Everything below can be deployed for FREE using these 3 platforms.**

### 1️⃣ Database → Neon.tech
```
1. Sign up at https://neon.tech
2. Create a new project called "AIR-1"
3. Copy your connection string and convert it:
   postgresql+asyncpg://USER:PASS@HOST/DB?ssl=require
```

### 2️⃣ Backend → Render.com
```
1. Go to https://render.com → New Web Service
2. Connect your GitHub repo
3. Set Root Directory to: backend
4. Build Command: pip install -r requirements.txt
5. Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT

Environment Variables:
  DATABASE_URL = postgresql+asyncpg://...  (from Neon)
  SECRET_KEY   = any_long_random_string
```
> ✅ Render will give you a live URL: `https://air-1-backend.onrender.com`

### 3️⃣ Frontend → Vercel
```
1. Go to https://vercel.com → Add New Project
2. Import your GitHub repository
3. Set Root Directory to: frontend
4. Framework will auto-detect as Angular
5. Click Deploy
```
> ✅ Vercel will give you a live URL: `https://air-1.vercel.app`

---

## ✦ Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/ArmaanTDL/AIR-1---.git
cd AIR-1---

# 2. Backend setup
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # Add your DATABASE_URL here
uvicorn app.main:app --reload --port 8000

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

| Credential | Value |
|:-----------|:------|
| URL | `http://localhost:5173` |
| Username | `admin` |
| Password | `admin123` |
| API Docs | `http://localhost:8000/docs` |

---

## ✦ Key API Endpoints

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/auth/login` | JWT Login |
| `GET/POST` | `/products` | Game catalog |
| `GET/POST` | `/inventory` | Key vault inventory |
| `POST` | `/inventory/batch-update` | Atomic ACID batch update |
| `GET/POST` | `/orders` | Order pipeline |
| `GET` | `/analytics/dashboard` | Real-time metrics |
| `GET` | `/analytics/stock-levels` | Stock by region |
| `GET` | `/analytics/transaction-log` | Full audit trail |

---

## ✦ FSD Showcase Parameters

This project was built to demonstrate all five FSD modules:

| # | Module | Demonstrated By |
|:--|:-------|:----------------|
| **1** | Modular Layout & Styling | Angular standalone components, Tailwind, glassmorphism |
| **2** | Interpolation & Data Binding | `{{ }}`, `[property]`, `(event)`, `[(ngModel)]` throughout all pages |
| **3** | Services & Dependency Injection | 10+ injectable services (Auth, Product, Inventory, Toast, Transition...) |
| **4** | Routing & Guards | SPA navigation, `routerLink`, `<router-outlet>`, `authGuard` |
| **5** | Async API Integration | FastAPI + SQLAlchemy async, JWT, HTTP interceptors, RxJS streams |

---

<div align="center">

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=100&section=footer&animation=fadeIn" width="100%"/>

<sub>Built with 🖤 by <a href="https://github.com/ArmaanTDL">ArmaanTDL</a> · AIR 1 Key Vault System © 2026</sub>

</div>
