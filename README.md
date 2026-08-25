# 🚗 SmartCar QR

**Scan it. Reach them. Keep moving.**

SmartCar QR is a QR-based vehicle communication system that makes it easy to contact a vehicle owner without needing their phone number. A person simply scans the QR code attached to a vehicle and can send a message, report an issue, or notify the owner about an emergency.

---

## ✨ Features

- 📱 Scan vehicle QR codes
- 💬 Send automated messages
- ✍️ Send custom messages
- 🚨 Send emergency notifications with GPS location
- 📩 Receive messages through an inbox
- 🕵️ Anonymous messaging with an `Unknown` identity
- 👤 User registration and authentication
- 🔄 Automatically link anonymous messages after account creation
- 🚘 Manage vehicle information
- 📲 Progressive Web App (PWA) support
- 🗺️ Google Maps location links for emergencies
- 🔐 JWT-based authentication
- 🗄️ PostgreSQL database with Prisma and Supabase

---

## 🔄 How It Works

### 1. Scan
Scan the QR code attached to a vehicle.

### 2. Choose an Action
The visitor can:
- Send an automated message
- Write a custom message
- Send an emergency notification

### 3. The Owner Receives It
The vehicle owner receives the message in their inbox. If the sender isn't logged in, they appear as **Unknown**.

### 4. Create an Account
If an anonymous sender later creates an account, their previous messages are automatically linked to their new account. The conversation updates from **Unknown → Username**, while keeping the original message history intact.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, React Router, Vite PWA, CSS |
| **Backend** | Node.js, Express, JWT, Prisma ORM |
| **Database** | PostgreSQL, Supabase |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```text
SmartCar QR/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── validators/
│   ├── prisma/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:
- Node.js
- npm
- A PostgreSQL / Supabase database

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "SmartCar QR"
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create your environment files locally.

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:3000/api
```

**Backend:** requires the database and authentication environment variables used by the application (e.g. database connection string, JWT secret).

> ⚠️ Never commit `.env` files or secret credentials to Git.

### 4. Start the Backend

```bash
cd backend
npm start
```

Runs on: `http://localhost:3000`

### 5. Start the Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Runs on: `http://localhost:5173`

---

## 🧪 Verification

**Frontend:**
```bash
npm run lint
npm run build
```

**Backend:**
```bash
npx prisma validate
npx prisma generate
```

---

## 🌐 Deployment

| Part | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Vercel |
| Database | Supabase |

For production, configure the frontend's `VITE_API_URL` to point to the deployed backend API.

---

## 🔐 Security

SmartCar QR uses:
- JWT authentication for registered users
- Protected messaging endpoints
- Server-side anonymous identity hashing
- Prisma ORM with PostgreSQL for data integrity
- Environment variables for sensitive configuration

> Anonymous identities are used only to associate messages with the same anonymous device. They do not grant access to authenticated user endpoints.

---

## 💡 Project Goal

SmartCar QR is designed to make vehicle-to-owner communication simple and immediate.

No phone number. No searching. No leaving a note on the windshield.

**Just: Scan → Message → Notify**

---

**🚗 SmartCar QR** — *Scan it. Reach them. Keep moving.*