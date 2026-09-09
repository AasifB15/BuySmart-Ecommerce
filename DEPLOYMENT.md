# BuySmart E-Commerce Platform — Complete Production Deployment Guide

This guide covers all recommended deployment pathways for the **BuySmart Full-Stack E-Commerce System** (Spring Boot 3.3 + React 18 / Vite + MySQL 8).

---

## 📋 Architecture Overview

| Layer | Technology | Default Port | Production Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 + Vite (SPA) | `80` (NGINX) / `5173` (Dev) | Client-side routing, responsive UI, dark/light theme |
| **Backend API** | Spring Boot 3.3.4 (Java 17) | `8080` | REST API, JWT Auth, Business Logic, Role Access |
| **Database** | MySQL 8.0 | `3306` | Persistent relational store (`shopora_db`) |

---

## 🚀 Option 1: 1-Command Deployment with Docker Compose (Recommended for VPS / Cloud VM)

**Best for**: AWS EC2, DigitalOcean Droplet, Linode, Hostinger VPS, Ubuntu 20.04/22.04 LTS.

### Step 1: Install Docker & Docker Compose on the Server
```bash
sudo apt update && sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

### Step 2: Clone the Repository & Configure Environment
```bash
git clone <your-repository-url>
cd ecommerce-management-system
```

Create a `.env` file in the root:
```env
DB_NAME=shopora_db
DB_USERNAME=root
DB_PASSWORD=YourStrongPasswordHere!
JWT_SECRET=Your64CharacterOrBase64ProductionSecretKeyHere1234567890
```

### Step 3: Launch Full Stack
```bash
docker compose up -d --build
```

### Step 4: Verify Deployment
- Open `http://your-server-ip` in your browser.
- NGINX on port `80` serves the React frontend and reverse-proxies `/api/*` directly to the Spring Boot container on port `8080`.

---

## ☁️ Option 2: Cloud Managed Platform Deployment (PaaS — Zero Server Management)

### Part A: Database (Railway or Aiven or PlanetScale)
1. Go to [Railway.app](https://railway.app) &rarr; **New Project** &rarr; **Provision MySQL**.
2. Copy the connection details:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`

### Part B: Spring Boot Backend (Render.com or Railway)
1. Go to [Render.com](https://render.com) &rarr; **New Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `.` (or leave empty)
   - **Environment**: `Docker` (Render will automatically detect the root `Dockerfile`)
   - Or Native Maven:
     - **Build Command**: `mvn clean package -DskipTests`
     - **Start Command**: `java -jar target/ecommerce-management-system-1.0.0.jar --spring.profiles.active=mysql`
4. Add **Environment Variables**:
   - `DB_HOST` = `<from Railway MySQL>`
   - `DB_PORT` = `<from Railway MySQL>`
   - `DB_NAME` = `<from Railway MySQL>`
   - `DB_USERNAME` = `<from Railway MySQL>`
   - `DB_PASSWORD` = `<from Railway MySQL>`
   - `JWT_SECRET` = `<your secret key>`
   - `SPRING_PROFILES_ACTIVE` = `mysql`
5. Click **Deploy**. Note your backend public URL (e.g. `https://buysmart-backend.onrender.com`).

### Part C: React Frontend (Vercel or Cloudflare Pages)
1. Go to [Vercel.com](https://vercel.com) &rarr; **Add New Project**.
2. Select your repository.
3. Configure project settings:
   - **Root Directory**: Click "Edit" and choose `BuySmart_Frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_BASE_URL` = `https://buysmart-backend.onrender.com/api` (your backend URL)
5. Click **Deploy**. Vercel will build and assign an instant global SSL domain (e.g. `https://buysmart.vercel.app`).

---

## 📦 Option 3: Unified Single-JAR Deployment (All-in-One)

You can serve both the React build and Spring Boot REST API from a single standalone `.jar` file!

### Step 1: Build the Frontend
```powershell
cd BuySmart_Frontend
npm.cmd run build
```

### Step 2: Copy Frontend Assets to Spring Boot Static Folder
```powershell
xcopy /E /I /Y dist ..\src\main\resources\static
```

### Step 3: Package Single Runnable JAR
```powershell
cd ..
mvn clean package -DskipTests
```

### Step 4: Run Anywhere
```bash
java -jar target/ecommerce-management-system-1.0.0.jar --spring.profiles.active=mysql
```
- Open `http://localhost:8080` (or `http://your-server-ip:8080`) — both the frontend UI and the backend REST API run on the exact same port with **zero CORS complexity**!

---

## 🔒 Production Security & Performance Checklist

- [ ] **Strong JWT Secret**: Change the default JWT secret in production to a cryptographically random 256-bit string.
- [ ] **Database Credentials**: Use strong passwords for the MySQL user and restrict root access to localhost.
- [ ] **SSL / HTTPS**: Enable HTTPS via Let's Encrypt (Certbot) on NGINX or use Cloudflare / Vercel SSL automatically.
- [ ] **Database Backups**: Set up automated daily MySQL database dumps:
  ```bash
  mysqldump -u root -p shopora_db > backup_$(date +%F).sql
  ```
- [ ] **JPA DDL Mode**: In `application-prod.properties`, ensure `spring.jpa.hibernate.ddl-auto=validate` or `update` to preserve production order data.
