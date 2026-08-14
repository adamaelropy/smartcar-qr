# 🚗 SmartCar QR

**SmartCar QR** is a full-stack vehicle identification and communication platform. It pairs vehicles with unique QR codes to facilitate seamless, secure communication between vehicle owners, emergency contacts, and drivers in parking or emergency situations.

---

## 📌 Features

### 🔐 1. Authentication & Registration
- **User Signup**: Account creation with strong password requirements (min 6 characters, uppercase, lowercase, number, symbol).
- **Multi-Step Registration**: Profile setup capturing personal details (name, age, phone, email), emergency contact details (relative name, phone, relationship), and vehicle information (plate number, car name, year model).
- **Secure Authentication**: JWT-based session tokens with password encryption via `bcrypt`.
- **Role & Status Guards**: `ProtectedRoute` and `RegisterRoute` ensuring users are routed correctly based on authentication and registration completion.

### 👤 2. Profile Management
- View complete personal details, emergency contact, and vehicle info.
- **Edit Profile**: In-place profile updating with backend validation and database transactions.
- **Change Password**: Validates current password against hash and securely applies updates.
- **QR Preview**: Embedded QR code displaying the vehicle's unique token.
- **Logout**: Clears session and cached tokens.

### 🛠️ 3. Vehicle Services
- **Full Catalog**: Loads all 20 vehicle services from Supabase PostgreSQL on initial page mount.
- **Instant Client-Side Search**: Single search input that filters across service name, location, raw service type, and friendly service type label (case-insensitive) without making network requests per keystroke.
- **Service Cards**: Clear presentation showing service name, friendly type, location, and availability badge (`Available` / `Unavailable`).
- **Empty State Handling**: "No services found." state when no matching services exist.

### 📱 4. QR Code System
- **Owner QR Page (`/qr`)**: Authenticated view rendering the owner's vehicle QR code with download/share capabilities.
- **Public Scanned QR Page (`/qr/:token`)**: Public endpoint displayed when anyone scans the vehicle QR code, providing direct actions to:
  - 🚗 **Contact Owner**: Message or call the vehicle owner.
  - 🚨 **Emergency Contact**: Message or call the registered emergency relative.

### 🎨 5. Theme Support
- Clean modern UI with automated Light Mode and Dark Mode support via CSS custom properties.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, `qrcode.react`, Vanilla CSS (Design Tokens) |
| **Backend** | Node.js, Express 5, CORS, `dotenv`, `jsonwebtoken`, `bcrypt` |
| **Database & ORM** | Supabase PostgreSQL, Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`) |
| **Development** | PowerShell, npm |

---

## 📁 Project Structure

```text
SmartCar QR/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── registration.controller.js
│   │   └── serviceController.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── registration.routes.js
│   │   └── serviceRoutes.js
│   ├── scripts/
│   │   ├── seed-services.js
│   │   └── test-signup.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── qrToken.js
│   │   ├── registrationStatus.js
│   │   └── userDefaults.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── profile.validator.js
│   │   └── registration.validator.js
│   ├── db.js
│   ├── server.js
│   ├── prisma.config.ts
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ServiceCard.jsx
│   │   ├── constants/
│   │   │   └── serviceTypes.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── QR.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Services.jsx
│   │   │   └── SignUp.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── auth.css
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+
- **PostgreSQL Database** (e.g. Supabase)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables by creating `.env` from `.env.example`:
   ```env
   PORT=3000
   DATABASE_URL="your-supabase-connection-pooler-url"
   DIRECT_URL="your-supabase-direct-database-url"
   JWT_SECRET="your-jwt-secret"
   JWT_EXPIRES_IN=24h
   ```
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
5. *(Optional)* Seed initial vehicle services into the database:
   ```bash
   node scripts/seed-services.js
   ```
6. Start the backend server:
   ```bash
   npm run dev
   ```
   Backend runs at: `http://localhost:3000`

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Frontend runs at: `http://localhost:5173` (with `/api` automatically proxied to port 3000).

---

## 🛣️ API Endpoints Summary

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/` | Public | Server health status |
| `GET` | `/api/test-db` | Public | Supabase PostgreSQL connectivity check |
| `POST` | `/api/auth/signup` | Public | User account creation |
| `POST` | `/api/auth/login` | Public | User authentication and JWT issuance |
| `GET` | `/api/auth/me` | Bearer Auth | Fetch authenticated user profile, contact & vehicle |
| `PUT` | `/api/auth/me` | Bearer Auth | Update authenticated user profile |
| `PUT` | `/api/auth/password` | Bearer Auth | Update account password |
| `POST` | `/api/registration` | Bearer Auth | Complete multi-step registration |
| `GET` | `/api/services` | Public | List all 20 vehicle services |
| `GET` | `/api/vehicles/me/qr` | Bearer Auth | Get authenticated user vehicle QR token |
| `GET` | `/api/qr/:token` | Public | Public scanned QR lookup |
