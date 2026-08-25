# 🚗 SmartCar QR

**Reach any vehicle owner instantly — no phone number required.**

SmartCar QR gives every registered vehicle a unique QR code. Anyone can scan it to message the owner, report a blocked car, or send an emergency alert with their location — all without ever seeing a private phone number. Registered users get a persistent inbox; anonymous scanners are still tracked so their conversation can carry over if they sign up later.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Deployment](#deployment)

---

## ✨ Features

- 📝 **Simple onboarding** — sign up, complete your profile, register your vehicle, and get a QR code in one flow
- 🔒 **Private QR contact** — visitors can message you without ever seeing your phone number
- 🚨 **Emergency alerts** — one-tap emergency notifications with GPS location
- 🚧 **Blocked-car reports** — quick, predefined messages for common situations
- 📩 **Unified inbox** — a single place for all conversations, with unread tracking and quick replies
- 🕵️ **Anonymous-friendly** — people can reach out without an account, and claim that conversation later by signing up
- 🔧 **Vehicle services directory** — browse and filter nearby automotive services
- 📲 **Installable PWA** — works like a native app on mobile and desktop
- 🌗 **Light & dark themes**

---

## 🔄 How It Works

### 🚘 For vehicle owners
1. **Sign up** and complete your profile — personal details, an emergency contact, and your vehicle info.
2. Get a **unique QR code** for your vehicle, ready to print or display.
3. Manage everything from your dashboard — profile, password, QR code, and messages.

### 📱 For anyone scanning a QR code
1. **Scan** the code on a vehicle to open its public contact page — no login needed.
2. Choose an action: send an **automated or custom message**, report a **blocked vehicle**, or trigger an **emergency alert** (shares your location).
3. The owner receives it instantly in their inbox. If you're logged in, it starts a proper conversation. If not, you're shown as **Unknown** — but your messages stay grouped together.

### 🔄 Anonymous → registered handoff
If you message someone anonymously and later create an account, your previous messages are automatically linked to your new profile. The owner sees your username instead of "Unknown," and the full conversation history is preserved.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router, PWA support |
| Backend | Node.js, Express, JWT authentication |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A PostgreSQL database (Supabase recommended)

### 1. Clone and install

```bash
git clone <repository-url>
cd "SmartCar QR"

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/`, and fill in your values (see [Environment Variables](#environment-variables)).

### 3. Set up the database

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
node scripts/seed-services.js   # optional: adds sample services
```

### 4. Run the app

```bash
# Terminal 1 — backend
cd backend
npm run dev        # runs on http://localhost:3000

# Terminal 2 — frontend
cd frontend
npm run dev        # runs on http://localhost:5173
```

Open `http://localhost:5173`, sign up, complete registration, and you're in.

---

## 🔐 Environment Variables

**Backend (`backend/.env`)**

```env
PORT=3000
DATABASE_URL="your-supabase-pooled-connection-url"
DIRECT_URL="your-supabase-direct-connection-url"
JWT_SECRET="a-strong-random-secret"
```

**Frontend (`frontend/.env`)**

```env
VITE_API_URL=http://localhost:3000/api
```

> Never commit `.env` files or secrets to version control.

---

## 📁 Project Structure

```text
SmartCar QR/
├── backend/
│   ├── controllers/     # Route logic (auth, registration, messages, QR, etc.)
│   ├── middleware/       # JWT authentication
│   ├── prisma/           # Database schema and migrations
│   ├── routes/            # API route definitions
│   ├── utils/              # Helpers (JWT, passwords, QR tokens, anonymous IDs)
│   ├── validators/       # Request validation
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── context/        # Auth and messaging state
│   │   ├── pages/           # Landing, auth, dashboard, and public QR pages
│   │   └── services/       # API client
│   └── vite.config.js
│
└── README.md
```

---

## 🔌 API Overview

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/signup` | POST | Public | Create an account |
| `/api/auth/login` | POST | Public | Log in |
| `/api/auth/me` | GET / PUT | Bearer | View or update your profile |
| `/api/auth/password` | PUT | Bearer | Change password |
| `/api/registration` | POST | Bearer | Complete registration and generate a QR code |
| `/api/services` | GET | Public | List vehicle services |
| `/api/qr/:token` | GET | Public | Look up a vehicle by its QR code |
| `/api/qr/:token/message` | POST | Optional | Send a message or emergency alert via a scanned QR code |
| `/api/messages` | GET | Bearer | List your conversation threads |
| `/api/messages/send` | POST | Bearer | Send a message in a thread |
| `/api/messages/read` | POST | Bearer | Mark a thread as read |

Full request/response details are documented in the codebase.

---

## 🌐 Deployment

- **Backend & Frontend** — deployed as separate projects on Vercel
- **Database** — Supabase PostgreSQL, migrated via `npx prisma migrate deploy`

Set the same environment variables from above in your Vercel project settings, using production database credentials.

---

**🚗 SmartCar QR** — *Scan it. Reach them. Keep moving.*