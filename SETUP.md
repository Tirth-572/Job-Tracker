# 🚀 TalentFlow ATS — Quick Setup Guide

Follow these steps to run the project:

---

## Prerequisites

Before starting, make sure you have installed:

- ✅ **Node.js 18+** — [Download](https://nodejs.org/)
- ✅ **PostgreSQL 14+** — [Download](https://www.postgresql.org/download/)
- ✅ **Redis** — [Download for Windows](https://github.com/microsoftarchive/redis/releases)
- ✅ **Cloudinary Account** — [Sign up free](https://cloudinary.com/)
- ✅ **Gmail Account** — For sending emails (use App Password)

---

## Step 1: Install Dependencies

Open terminal in the root folder and run:

```bash
npm run install:all
```

This will install all backend and frontend dependencies.

---

## Step 2: Configure Environment Variables

### Backend (.env)

Create or update `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ats_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:3000"

REDIS_URL="redis://localhost:6379"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
EMAIL_FROM="TalentFlow <your-email@gmail.com>"

NODE_ENV="development"
```

**Important:**
- Replace `YOUR_PASSWORD` with your PostgreSQL password
- Get Cloudinary credentials from [cloudinary.com/console](https://cloudinary.com/console)
- Get Gmail App Password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### Frontend (.env)

The `frontend/.env` is already configured correctly:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## Step 3: Setup Database

### 3.1 Create Database

```bash
psql -U postgres
```

Then run:

```sql
CREATE DATABASE ats_db;
\q
```

### 3.2 Run Migrations & Seed Data

```bash
npm run db:setup
```

This will:
- Run Prisma migrations
- Generate Prisma client
- Seed demo data with 3 accounts

---

## Step 4: Start Redis

**Windows:**

Open a new terminal and run:

```bash
redis-server
```

Keep this terminal open.

**Mac/Linux:**

```bash
redis-server
```

---

## Step 5: Run the Project (Both Backend + Frontend)

Open a terminal in the root folder and run:

```bash
npm run dev
```

This will start:
- ✅ Backend on `http://localhost:5000`
- ✅ Frontend on `http://localhost:3000`

Both will run in the same terminal with colored output!

---

## 🎉 Access the Application

Open your browser and go to:

👉 **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role      | Email                    | Password        |
|-----------|--------------------------|-----------------|
| 🔧 Admin  | admin@talentflow.com     | admin123456     |
| 🏢 Company| hr@techcorp.com          | company123456   |
| 👤 Candidate | john@example.com      | candidate123456 |

---

## 📌 Individual Commands

If you want to run backend and frontend separately:

### Backend Only
```bash
npm run dev:backend
```

### Frontend Only
```bash
npm run dev:frontend
```

### Database Studio (GUI)
```bash
npm run db:studio
```

---

## ⚡ Troubleshooting

### Port Already in Use

If port 3000 or 5000 is busy:

**Frontend:** Edit `frontend/package.json`, change the start script:
```json
"start": "set PORT=3001 && react-scripts start"
```

**Backend:** Edit `backend/.env`:
```env
PORT=5001
```

### Redis Connection Error

Make sure Redis is running:
```bash
redis-cli ping
```

Should return `PONG`.

### Database Connection Error

Check PostgreSQL is running:
```bash
psql -U postgres -c "SELECT version();"
```

---

## 🎯 What to Test

1. **Candidate Flow:**
   - Login as John (candidate)
   - Browse jobs
   - Apply to a job
   - Track application status

2. **Company Flow:**
   - Login as TechCorp (company)
   - Create a new job
   - View applications
   - Drag & drop in Pipeline (Kanban)
   - Schedule interview
   - Upload offer letter

3. **Admin Flow:**
   - Login as Admin
   - View analytics dashboard
   - Manage users and companies
   - Check email logs

4. **Real-time Features:**
   - Open chat between candidate and company
   - Test typing indicators
   - Check notifications

---

## 🛠️ Additional Commands

```bash
# Install all dependencies
npm run install:all

# Setup database (migrate + seed)
npm run db:setup

# Run migrations only
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Seed demo data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

---

## 📦 Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm start
```

---

Enjoy using TalentFlow ATS! 🚀
