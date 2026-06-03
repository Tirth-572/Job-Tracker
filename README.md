# TalentFlow ATS — Production-Ready Applicant Tracking System

A full-stack ATS platform built with React.js, Node.js, Express.js, PostgreSQL, Prisma ORM, Socket.IO, Nodemailer, Redis, and Cloudinary.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 19, Tailwind CSS, Framer Motion, Recharts |
| Backend    | Node.js, Express.js, MVC Architecture          |
| Database   | PostgreSQL + Prisma ORM                         |
| Auth       | JWT + Role-Based Access Control                 |
| Real-time  | Socket.IO (Chat + Notifications)                |
| Email      | Nodemailer + Bull Queue + Redis                 |
| Storage    | Cloudinary (Resumes, Avatars, Files)            |
| Cache/Queue| Redis + ioredis                                 |

---

## Roles

- **Candidate** — Browse jobs, apply, track applications, chat with HR, download offer letters
- **Company** — Post jobs, manage pipeline (Kanban board), schedule interviews, upload offers
- **Admin** — Manage users, companies, jobs, view analytics, email logs

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Cloudinary account
- Gmail account (for SMTP)

---

## Installation

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

**backend/.env**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ats_db"
JWT_SECRET="your-super-secret-key-min-32-chars"
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

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Setup Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE ats_db;"

# Run migrations
cd backend
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo data
node prisma/seed.js
```

### 4. Start Services

```bash
# Start Redis (Windows)
redis-server

# Start Backend (from /backend)
npm run dev

# Start Frontend (from /frontend)
npm start
```

### 5. Access the App

| URL                         | Description        |
|-----------------------------|--------------------|
| http://localhost:3000       | Frontend           |
| http://localhost:5000/api   | Backend API        |

---

## Demo Accounts

| Role      | Email                    | Password        |
|-----------|--------------------------|-----------------|
| Admin     | admin@talentflow.com     | admin123456     |
| Company   | hr@techcorp.com          | company123456   |
| Candidate | john@example.com         | candidate123456 |

---

## Features

### Candidate Portal
- Register / Login
- Complete profile with avatar and resume upload
- Skills, Experience, Education management
- Browse & search jobs with filters
- Save jobs for later
- Apply with cover letter
- Track application status with visual timeline
- Download offer letters
- Real-time chat with HR
- Real-time notifications

### Company Portal
- Company profile with logo
- Create, edit, delete, close job posts
- View all applicants with resume preview
- Drag-and-drop Kanban pipeline board
- Schedule interviews (Video, Phone, In-Person, Technical)
- Upload offer letters
- Status update → automatic email sent to candidate
- Real-time chat with candidates

### Application Status Flow
```
Applied → Under Review → Shortlisted → Interview Scheduled →
Interview Completed → Selected → Offer Sent → Joined
                                              ↓
                                           Rejected (any stage)
```

### Admin Panel
- Platform analytics dashboard with charts
- Manage all users (block/unblock)
- Manage all companies (verify/block)
- Manage all jobs (delete)
- Email delivery logs

### Email System
- Automatic emails on every status change
- Professional HTML templates
- Bull Queue + Redis for background processing
- 3 retry attempts on failure
- Email logs stored in database

### Real-time Features (Socket.IO)
- Instant notifications
- Live chat with typing indicators
- Online/offline status

---

## API Endpoints

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/auth/register    | Register          |
| POST   | /api/auth/login       | Login             |
| GET    | /api/auth/me          | Get current user  |
| PUT    | /api/auth/password    | Change password   |

### Jobs
| Method | Endpoint                  | Description        |
|--------|---------------------------|--------------------|
| GET    | /api/jobs                 | List jobs (public) |
| GET    | /api/jobs/:id             | Get job details    |
| POST   | /api/jobs                 | Create job         |
| PUT    | /api/jobs/:id             | Update job         |
| DELETE | /api/jobs/:id             | Delete job         |
| GET    | /api/jobs/company/mine    | Company's jobs     |

### Applications
| Method | Endpoint                          | Description             |
|--------|-----------------------------------|-------------------------|
| POST   | /api/applications                 | Apply to job            |
| GET    | /api/applications/candidate       | Candidate's applications|
| GET    | /api/applications/company         | Company's applications  |
| PATCH  | /api/applications/:id/status      | Update status + email   |
| POST   | /api/applications/:id/interviews  | Schedule interview      |
| POST   | /api/applications/:id/offer       | Upload offer letter     |

---

## Folder Structure

```
Job Tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Complete DB schema
│   │   └── seed.js            # Demo data
│   └── src/
│       ├── config/            # Prisma, Redis, Cloudinary
│       ├── controllers/       # Auth, Candidate, Company, Job, Application, Chat, Admin
│       ├── middleware/        # Auth, Validation, Error Handler
│       ├── routes/            # All API routes
│       ├── services/          # Socket.IO, Email Queue, Email Templates, Notifications
│       └── server.js          # Entry point
│
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/        # DashboardLayout with sidebar
        │   └── ui/            # Button, Card, Modal, Avatar, Skeleton, etc.
        ├── context/           # Auth, Theme, Notification
        ├── hooks/             # Custom hooks
        ├── lib/               # utils, cn helper
        ├── pages/
        │   ├── auth/          # Login, Register
        │   ├── candidate/     # Dashboard, BrowseJobs, Applications, Profile, SavedJobs
        │   ├── company/       # Dashboard, Jobs, Applications, Pipeline, Profile
        │   ├── admin/         # Dashboard, Users, Companies, Jobs, EmailLogs
        │   └── shared/        # Chat
        ├── services/          # API client (axios), Socket.IO
        └── App.js             # Routes + Providers
```

---

## Production Deployment

### Backend
```bash
npm run build
NODE_ENV=production npm start
```

### Frontend
```bash
npm run build
# Deploy /build folder to Nginx / Vercel / Netlify
```

### Recommended Services
- **Database**: Supabase / Railway / Neon
- **Redis**: Upstash / Redis Cloud
- **File Storage**: Cloudinary (already integrated)
- **Backend Hosting**: Railway / Render / AWS EC2
- **Frontend Hosting**: Vercel / Netlify
