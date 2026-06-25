# Stellar Inventory & Order Management System

A production-ready, fully containerized full-stack application for managing products, customers, and orders. The system features a high-performance **Python FastAPI** backend, a stunning dark-themed glassmorphic **React** frontend (built with Vite), and a robust **PostgreSQL** database, all orchestrated using **Docker Compose**.

---

## 🚀 Key Features & Business Logic

- **Product Catalog Management**: Create, view, update, and delete products. Enforces unique SKUs/codes, positive prices, and non-negative stock levels.
- **Customer Directory**: Add and manage customers. Enforces unique email addresses and valid contact formats.
- **Transactional Order Builder**: Create orders with multiple line items, automatically checking stock availability in real-time, calculating totals on the server, and decrementing inventory on successful purchase.
- **Stock Restoration**: Deleting or cancelling an order automatically restores the items back into the inventory stock.
- **Cyberpunk Dark Glassmorphism UI**: Beautifully styled interface with responsive layouts for desktop and mobile, micro-animations, loading indicators, and a custom toast notification system.
- **Immediate Data Seeding**: Automatically seeds the database on startup with realistic mock products, customers, and orders if it is empty, providing a rich, immediate showcase.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React (JavaScript) | Vite, Lucide Icons, Custom Vanilla CSS |
| **Backend** | Python 3.10 | FastAPI, Uvicorn, Pydantic v2, SQLAlchemy |
| **Database** | PostgreSQL 15 | pg_isready healthcheck, alpine footprint |
| **Orchestration** | Docker, Docker Compose | Multi-stage builds, Named volumes, Private network |

---

## 📦 Running the Application (Local Development)

### Method A: With Docker Compose (Recommended)

This is the fastest and easiest way to run the entire system in a production-like containerized environment.

1. **Prerequisites**: Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. **Start the containers**:
   ```bash
   docker-compose up --build
   ```
3. **Access the applications**:
   - **React Frontend**: [http://localhost:3000](http://localhost:3000)
   - **FastAPI Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Backend API Root**: [http://localhost:8000/](http://localhost:8000/)
4. **Stop the containers**:
   ```bash
   docker-compose down
   ```
   *Note: Your data is safely persisted in the named Docker volume `inventory_postgres_data` and will remain intact across restarts.*

---

### Method B: Without Docker (Local Development Run)

If you wish to run the backend and frontend separately outside containers for rapid development:

#### 1. Setup Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server (runs by default on SQLite `./inventory.db` for easy local setup):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

#### 2. Setup Frontend
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the frontend at the URL outputted in the terminal (usually `http://localhost:3000`).

---

## 🌐 Complete Step-by-Step Deployment Guide

Follow these instructions to deploy the application online and obtain your submission deliverables.

### Step 1: Version Control Setup (GitHub)
1. Initialize git in the root folder:
   ```bash
   git init
   ```
2. Create a repository on GitHub (e.g., `inventory-order-system`).
3. Add files, commit, and push to your GitHub:
   ```bash
   git add .
   git commit -m "feat: initial release of inventory system"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
   👉 **Deliverable 1 obtained**: Your GitHub repository link.

---

### Step 2: Build & Push Docker Image to Docker Hub
To fulfill the backend Docker image deliverable, build and push the backend image to Docker Hub.

1. **Log in to Docker Hub** in your terminal:
   ```bash
   docker login
   ```
2. **Build the production backend image** (replace `YOUR_DOCKERHUB_USERNAME`):
   ```bash
   docker build -t YOUR_DOCKERHUB_USERNAME/inventory-backend:latest ./backend
   ```
3. **Push the image** to Docker Hub:
   ```bash
   docker push YOUR_DOCKERHUB_USERNAME/inventory-backend:latest
   ```
   👉 **Deliverable 2 obtained**: `https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventory-backend`

---

### Step 3: Deploy the Backend API
You can deploy the backend to free platforms like **Render**, **Railway**, or **Fly.io**. We recommend **Render** or **Railway**.

#### Option A: Deploying on Render (with Web Service + Database)
1. **Create a PostgreSQL Database on Render**:
   - Go to the [Render Dashboard](https://dashboard.render.com/) and click **New > PostgreSQL**.
   - Name it `inventory-db` and choose the **Free** tier.
   - Click **Create Database**. Once created, copy the **Internal Database URL** (for Render-to-Render connection) or **External Database URL** (for remote connection).
2. **Create a Web Service for the FastAPI Backend**:
   - Click **New > Web Service**.
   - Connect your GitHub repository.
   - **Configuration**:
     - **Runtime**: `Python`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - Add `DATABASE_URL` and paste your Render PostgreSQL database URL.
     - Add `CORS_ORIGINS` and set it to `*` (or your frontend live URL once deployed).
3. Click **Deploy Web Service**.
   👉 **Deliverable 3 obtained**: Your live backend API URL (e.g., `https://inventory-backend.onrender.com`).

---

### Step 4: Deploy the Frontend UI
You can deploy the React frontend to **Vercel** or **Netlify** for free. We recommend **Vercel**.

#### Option A: Deploying on Vercel
1. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
2. Connect your GitHub repository.
3. Configure the project:
   - **Root Directory**: Select `frontend`.
   - **Framework Preset**: `Vite` (automatically detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Add a new environment variable:
     - **Key**: `VITE_API_URL`
     - **Value**: Your live backend API URL obtained in Step 3 (e.g., `https://inventory-backend.onrender.com`).
5. Click **Deploy**.
   👉 **Deliverable 4 obtained**: Your live frontend deployment URL (e.g., `https://inventory-frontend.vercel.app`).

---

## 📋 Submission Checklist
Ensure your final submission contains:
1. **GitHub Repository Link**: `https://github.com/YOUR_USERNAME/YOUR_REPO`
2. **Docker Hub Image Link**: `https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventory-backend`
3. **Live Backend API URL**: `https://YOUR-BACKEND.onrender.com`
4. **Live Frontend Deployment URL**: `https://YOUR-FRONTEND.vercel.app`
