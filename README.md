<div align="center">
  <h1>AIR 1 — Key Vault System</h1>
  <p>A Premium, High-Performance Game Key Distribution Platform</p>

  <!-- VIDEO PLACEHOLDER: Replace the href and src with your actual video link -->
  <a href="https://your-video-link.com">
    <img src="https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg" alt="AIR 1 Video Walkthrough" width="800"/>
  </a>
  <p><i>Click the image above to watch the AIR 1 platform in action!</i></p>
</div>

---

## 🌟 Overview

**AIR 1** is a high-end, full-stack game key inventory dashboard and distribution platform. Built with a focus on **premium aesthetics** (cinematic GSAP scroll animations, glassmorphism, monochrome cream/black palettes) and **high-performance engineering** (Angular 18, FastAPI, PostgreSQL).

It features a kinetic, Apple-style interactive landing page that seamlessly transitions into a powerful, data-rich management console.

## ✨ Features

- **Cinematic Landing Page:** Hardware-accelerated GSAP animations, ScrollTrigger zoom scaling, and Lenis smooth scrolling.
- **Premium Dashboard Console:** Glassmorphism UI, real-time metric cards, and a synchronized page-transition experience.
- **ACID-Compliant Inventory:** Row-level locking and atomic batch updates via PostgreSQL to prevent overselling of digital keys.
- **Asynchronous Architecture:** Built on FastAPI with `asyncpg` for high-throughput concurrency.
- **Modular Angular 18 Frontend:** Utilizes Standalone Components, RxJS data streams, and robust HTTP interceptors.

---

## 🛠 Tech Stack

- **Frontend:** Angular 18 (Standalone), Tailwind CSS, GSAP, Lenis
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 (Async)
- **Database:** PostgreSQL (Neon.tech or local)
- **Authentication:** JWT (JSON Web Tokens)

---

## 🚀 Local Development Guide

### 1. Database Setup
Create a free PostgreSQL database on [neon.tech](https://neon.tech) (or run it locally).
Convert your connection string to the `asyncpg` format:
```
postgresql+asyncpg://USER:PASS@HOST/DB?ssl=require
```

### 2. Backend Setup
```bash
cd backend
python3.11 -m venv .venv 
source .venv/bin/activate
pip install -r requirements.txt

# Create your .env file and paste your DATABASE_URL
cp .env.example .env          

# Run the server
uvicorn app.main:app --reload --port 8000
```
*Note: On first boot, the system automatically creates the schema, seeds the database with games (Elden Ring, Cyberpunk, etc.), and creates an `admin` user.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`. 
**Default Login:** `admin` / `admin123`

---

## 🌍 How to Deploy (Live Link)

To get a live, public link for your project, you need to deploy the Database, Backend, and Frontend separately:

### Step 1: Database (Neon.tech)
1. Go to [Neon.tech](https://neon.tech) and create a free PostgreSQL project.
2. Copy the connection string.

### Step 2: Backend (Render.com)
1. Push this repository to your GitHub.
2. Go to [Render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the build command to: `pip install -r requirements.txt`
5. Set the start command to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. In the Environment Variables section, add your `DATABASE_URL` (using the `postgresql+asyncpg://` format) and your JWT `SECRET_KEY`.

### Step 3: Frontend (Netlify)
1. Go to [Netlify.com](https://netlify.com) and click **Add new site > Import an existing project**.
2. Connect your GitHub repository.
3. Configure the build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist/frontend` (or `frontend/dist` depending on Angular output)
4. Add an Environment Variable for your backend API URL so the frontend knows where to fetch data (e.g., `API_URL = https://your-backend-url.onrender.com`).
5. Click **Deploy Site**.

Once Netlify finishes building, you will have a live public URL for your AIR 1 platform!

---

## 📄 License
Demonstration purposes only.
