# SmartCar QR

**SmartCar QR** is a full-stack vehicle identification and communication platform. Each registered vehicle gets a unique QR code so anyone can reach the owner privately — for blocked parking, lights left on, or emergencies — without exposing a personal phone number.

---

## Application Workflow

### 1. Owner onboarding

```text
Landing (/) → Sign Up (/signup) → Registration (/register) → Home (/home)
```

1. Open the landing page at `/`.
2. Create an account on `/signup` with a username and password.
3. After signup, you are signed in automatically and sent to `/register`.
4. Complete registration with:
   - Personal details (name, age, email, phone)
   - Emergency contact (relative name, phone, relationship)
   - Vehicle details (plate number, car name, year model)
5. On success, a unique vehicle QR token is created and you are redirected to `/home`.

### 2. Returning users

```text
Login (/login) → Home (/home)   OR   Login (/login) → Registration (/register)
```

- If registration is already complete, login goes straight to `/home`.
- If registration is incomplete, login sends you back to `/register` until vehicle details are saved.

Route guards enforce this:

- `ProtectedRoute` — requires auth **and** completed registration (dashboard pages).
- `RegisterRoute` — requires auth but blocks access once registration is complete.

### 3. Dashboard (authenticated)

| Route | Purpose |
|---|---|
| `/home` | Browse and search vehicle services (type, location, availability) |
| `/messages` | View conversation threads and reply to incoming QR messages |
| `/profile` | Edit account details, change password, preview/download QR code, appearance settings, logout |
| `/users` | Browse registered users and open or copy their public QR links |

The dashboard polls for unread messages and shows a toast notification when new messages arrive.

### 4. Public QR scan flow

```text
Scan QR sticker → /qr/:token → Message owner or notify emergency contact
```

When someone scans a vehicle QR code:

1. The public page at `/qr/:token` loads the vehicle info.
2. **Contact owner** — send an automated parking message or a custom message.
3. **Emergency assistance** — share GPS location and notify the registered emergency contact.

If the scanner is a logged-in SmartCar QR user messaging another user's vehicle, the message opens a conversation thread visible under `/messages` for both parties.

---

## Features

### Authentication & registration
- Signup with password rules (min 6 characters, uppercase, lowercase, number, symbol).
- JWT sessions with bcrypt password hashing.
- Multi-step registration that creates the vehicle record and QR token.

### Profile management
- View and edit personal, emergency contact, and vehicle details.
- Change password with current-password verification.
- QR preview and enlarged QR modal on the profile page.

### Vehicle services
- Loads services from PostgreSQL on page mount.
- Client-side search and filters (service type, location, availability).
- Service cards with availability badges.

### Messaging
- Thread-based inbox for owner ↔ scanner conversations.
- Unread counts, mark-as-read, and reply support.
- Legacy QR communications are also tracked in the database.

### Theme support
- Light and dark modes via CSS custom properties and the appearance picker.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, `qrcode.react`, Vanilla CSS |
| **Backend** | Node.js, Express 5, CORS, `dotenv`, `jsonwebtoken`, `bcrypt` |
| **Database & ORM** | Supabase PostgreSQL, Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`) |

---

## Project Structure

```text
SmartCar QR/
├── backend/
│   ├── controllers/       # auth, registration, messages, services, users
│   ├── middleware/        # JWT auth middleware
│   ├── prisma/            # schema + migrations
│   ├── routes/            # Express route modules
│   ├── scripts/           # seed-services.js, test helpers
│   ├── utils/             # jwt, password, qrToken, registrationStatus
│   ├── validators/        # request validation
│   ├── db.js
│   └── server.js
│
├── frontend/
│   ├── public/images/     # hero-car.png and other static assets
│   ├── src/
│   │   ├── components/    # DashboardLayout, ProtectedRoute, ServiceCard, etc.
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # landing, Home, Login, SignUp, Register, Profile, Messages, Users
│   │   ├── services/      # api.js
│   │   └── styles/        # auth.css, App.css, index.css
│   └── vite.config.js     # proxies /api → localhost:3000
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 24)
- npm 9+
- PostgreSQL database (e.g. Supabase)

### 1. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
DATABASE_URL="your-supabase-connection-pooler-url"
DIRECT_URL="your-supabase-direct-database-url"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN=24h
```

Apply the database schema and start the API:

```bash
npx prisma generate
npx prisma migrate deploy
node scripts/seed-services.js   # optional: load sample services
npm run dev
```

Backend runs at `http://localhost:3000`.

### 2. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Vite proxies `/api` requests to the backend on port 3000.

### 3. Quick smoke test

1. Visit `http://localhost:5173`.
2. Sign up, complete registration, and confirm you land on `/home`.
3. Open **Profile** and preview your QR code.
4. Open the QR link in a private/incognito window to test the public scan page.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | Server health check |
| `GET` | `/api/test-db` | Public | Database connectivity check |
| `POST` | `/api/auth/signup` | Public | Create account |
| `POST` | `/api/auth/login` | Public | Login and receive JWT |
| `GET` | `/api/auth/me` | Bearer | Get current user profile |
| `PUT` | `/api/auth/me` | Bearer | Update profile |
| `PUT` | `/api/auth/password` | Bearer | Change password |
| `POST` | `/api/registration` | Bearer | Complete registration and create vehicle + QR |
| `GET` | `/api/services` | Public | List vehicle services |
| `GET` | `/api/users` | Public | List users with QR tokens |
| `GET` | `/api/messages` | Bearer | List message threads |
| `POST` | `/api/messages/send` | Bearer | Send a message in a thread |
| `POST` | `/api/messages/reply` | Bearer | Reply in a thread |
| `POST` | `/api/messages/read` | Bearer | Mark a thread as read |
| `GET` | `/api/vehicles/me/qr` | Bearer | Get authenticated user's vehicle QR |
| `GET` | `/api/qr/:token` | Public | Lookup vehicle by QR token |
| `POST` | `/api/qr/:token/message` | Public | Send message or emergency alert via QR scan |
