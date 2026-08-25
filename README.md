# SmartCar QR

**SmartCar QR** is a full-stack vehicle identification and communication platform. Each registered vehicle gets a unique QR code so anyone can reach the owner privately — for blocked parking, lights left on, or emergencies — without exposing a personal phone number. Authenticated users get a persistent conversation inbox; anonymous scanners are tracked per-device and can be claimed on signup.

---

## Table of Contents

- [Application Workflow](#application-workflow)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Frontend Routing](#frontend-routing)
- [Polling, Theming & PWA](#polling-theming--pwa)
- [Quick Smoke Test](#quick-smoke-test)
- [Scripts](#scripts)

---

## Application Workflow

### 1. Landing & Auth Entry

```text
/  (Landing) ─┬─► /signup ─► /register ─► /home
              └─► /login ──┬─► /home      (if registration complete)
                           └─► /register  (if incomplete)
```

- **Landing (`/`)** — `frontend/src/pages/landing.jsx:51` checks `AuthContext` (`isAuthenticated`, `registrationComplete`). CTA resolves to `registrationComplete ? /home : /register` when authenticated, otherwise `/signup`. `BrandMark`, hero image (`/images/hero-landing.png`), and feature grid.
- **Sign Up (`/signup`)** — `frontend/src/pages/SignUp.jsx:22` collects `username`, `password`, `confirmPassword`. Client only attaches an existing `localStorage.smartcar_anonymous_id` (if present and ≥8 chars) as `anonymousId` to `POST /api/auth/signup` — it does **not** create a new id if none exists. Password hint is enforced server-side via `backend/utils/password.js:6` (≥6 chars, uppercase, lowercase, number, symbol). On `201` the app calls `login(token, user, false)` (`frontend/src/context/AuthContext.jsx:39`) which persists `smartcar_token`, `smartcar_user`, `smartcar_registration_complete=false` and redirects to `/register`.
- **Login (`/login`)** — `frontend/src/pages/Login.jsx:18` posts `{username, password}` to `POST /api/auth/login`. Backend `backend/controllers/auth.controller.js:121` verifies bcrypt and checks registration via `isRegistrationComplete(userId)` (`backend/utils/registrationStatus.js:3` — existence of `Vehicle` for user). Response includes `registrationComplete`. Frontend stores it and navigates to `/home` or `/register` accordingly.

**Auth storage:** `AuthContext` (`frontend/src/context/AuthContext.jsx:6`) uses `localStorage` keys `smartcar_token`, `smartcar_user`, `smartcar_registration_complete`. Anonymous device id is separate: `smartcar_anonymous_id` (`frontend/src/utils/anonymousId.js:1`).

### 2. Registration (authenticated, incomplete only)

```text
RegisterRoute (requires auth && !registrationComplete) → /register → completeRegistration() → /home
```

- Guard: `RegisterRoute` (`frontend/src/components/ProtectedRoute.jsx:18`) redirects unauthenticated → `/login`, completed → `/home`.
- Form: `frontend/src/pages/Register.jsx:7` — three fieldsets:
  - **Personal:** `fullName`, `age` (16–120), `email`, `phone`
  - **Emergency contact:** `relativeName`, `relativePhone`, `relationship` (**required**, ≤100 chars)
  - **Vehicle:** `plateNumber`, `carName`, `yearModel` (1980–`currentYear+1`)
- Validation: `backend/validators/registration.validator.js:11` (`NAME_PATTERN`, `PHONE_PATTERN`, `PLATE_PATTERN`, `EMAIL_PATTERN`). All fields required.
- Submit: `POST /api/registration` with `Bearer <JWT>` (`frontend/src/services/api.js:73`). Backend `backend/controllers/registration.controller.js:15` runs a `prisma.$transaction`: updates `User`, creates `EmergencyContact`, creates `Vehicle` with `generateQrToken()` (`backend/utils/qrToken.js`). If `Vehicle` already exists → `409 Registration is already complete`. Handles duplicate `email`/`plate` via `409`.
- On success frontend calls `completeRegistration()` (`frontend/src/context/AuthContext.jsx:51`) → sets `smartcar_registration_complete=true` and navigates to `/home`.

### 3. Dashboard (authenticated & registration-complete)

Guard: `ProtectedRoute` (`frontend/src/components/ProtectedRoute.jsx:4`) requires **both** `isAuthenticated` and `registrationComplete`, otherwise → `/login` or `/register`.

Provider: `MessagesPollProvider` wraps `DashboardLayout` (`frontend/src/App.jsx:322`) and polls `GET /api/messages` every **5s** via `useMessagesPolling` (`frontend/src/hooks/useMessagesPolling.js:46`) — visibility-aware, abortable, preserves threads on error.

| Route | Component | Purpose |
|---|---|---|
| `/home` | `frontend/src/pages/Home.jsx:55` | Welcome banner, highlights, vehicle services search. Fetches `GET /api/services` on mount, client-side filters by query (name/location), `service_type`, `location`, `availability`. Slices first 6 as Popular Services, `View all` toggle. Stats footer. |
| `/messages` | `frontend/src/pages/Messages.jsx:8` | Thread inbox. Merges **Conversation** threads (authenticated) + **anonymous Communication** threads grouped by `vehicle_id:anonHash`. See Messaging section below. |
| `/profile` | `frontend/src/pages/Profile.jsx:39` | Loads `GET /api/auth/me` + `GET /api/vehicles/me/qr`. Sidebar tabs: `account`, `personal`, `password`, `appearance`, `help`, `about`. Inline edit for account/personal → `PUT /api/auth/me`; password change → `PUT /api/auth/password`; QR modal (`QRModal.jsx`) with `buildQrUrl()` (`frontend/src/constants/appConfig.js:6` → `${origin}/qr/${token}`), canvas download & clipboard copy; theme picker; help bot; logout. |
| `/users` | `frontend/src/pages/Users.jsx:7` | Public user directory. Fetches `GET /api/users` (no auth required). Renders user cards with `QRCodeCanvas` (`qrcode.react`), `Open QR` link and `Copy` button for `${origin}/qr/${token}`. Shows `No Vehicle Linked` if no QR token. |

### 4. Public QR Scan Flow (no auth required)

```text
QR sticker → GET /qr/:token → [Send Message] ─┬─► authenticated sender (other owner) → Conversation + ConversationMessage → threadId returned
                                              └─► anonymous / self → Communication (source=anon:<hash>)
                   └─► [Emergency Assistance] → GPS + Google Maps link → same branching
```

**Page:** `ScannedQR` in `frontend/src/App.jsx:28` (`/qr/:token`).

1. **Load vehicle:** `fetchVehicleByQrToken(token)` → `GET /api/qr/:token` (`backend/controllers/qr.controller.js:7`). Shows loading/error/not-found states.
2. **Contact owner panel:**
   - Mode switch `Automated Message` (default text `Hello, you blocked my car in the parking please come and move it`) vs `Custom Message` (textarea, required when active).
   - `Send Message` calls `postQrMessage(token, payload, authToken)` (`frontend/src/services/api.js:129`). Payload is `{type:'MESSAGE', message}`. If **not** authenticated (`!authToken && !user?.username`), attaches `anonymousId` from `getAnonymousDeviceId()` (`frontend/src/utils/anonymousId.js:26` — generates UUID via `crypto.randomUUID()` or fallback, persists to `localStorage.smartcar_anonymous_id`, validated by `isValidStoredId`).
3. **Emergency assistance panel:**
   - `Notify Emergency Relative` acquires GPS via `navigator.geolocation.getCurrentPosition({enableHighAccuracy:true, timeout:10000})`.
   - Builds message `This vehicle got into an accident please head to this location asap <mapsLink> (reported at <ISO timestamp>)` where `mapsLink = https://maps.google.com/?q=lat,lng` (`frontend/src/constants/appConfig.js:11`). If GPS unavailable, appends `(reported at ... - location unavailable)`.
   - Payload `{type:'EMERGENCY', message, location?:{lat,lng}, timestamp}` (+ `anonymousId` if anonymous).

**Backend `POST /api/qr/:token/message`** (`backend/controllers/qr.controller.js:29`):

- Looks up `Vehicle` by `qr_token`. `404` if not found.
- Optionally parses `Authorization: Bearer <JWT>` (server verifies with `JWT_SECRET`; invalid token → treated as anonymous).
- If authenticated: resolves `sourceValue` as `vehicle:<vehicle_id>` or `user:<username>` or `userId:<id>`. `normalizedMessage` trimmed, `messageKind = EMERGENCY ? EMERGENCY : TEXT`.
- **Branch A — authenticated sender ≠ owner:** `getOrCreateConversation(sender, owner)` (`backend/controllers/messages.controller.js:19` — normalizes pair via `normalizeConversationPair`, unique on `[participant_a_id, participant_b_id]`), then `createConversationMessage` (also bumps `last_message_at`). Returns `{success:true, threadId}` — frontend shows *chat has been created in Messages*.
- **Branch B — authenticated sender === owner:** `400 You cannot send a message to your own vehicle`.
- **Branch C — anonymous (no valid JWT):** `resolveAnonymousSource(anonymousId)` (`backend/utils/anonymous.js:18` hashes valid id to `anon:<12_hex>` via `sha256`, or generates a random fallback hash), creates `Communication {communication_id: BigInt, vehicle_id, type, direction:RECEIVED, message, source}`. Legacy `source` column stores the `anon:` hash for grouping. Returns `{success:true, message:"Message recorded."}`.

> Note: `GET /api/qr/:token` and `POST /api/qr/:token/message` are **public**. Auth header is optional — when present it upgrades an anonymous scan into a persistent conversation.

### 5. Messaging & Anonymous Claim

**Inbox (`/messages`):** `frontend/src/pages/Messages.jsx:8` + `backend/controllers/messages.controller.js:103`.

- **Fetch:** `GET /api/messages` (Bearer required) loads `Conversation`s where user is `participant_a` or `participant_b`, ordered by `last_message_at desc`, plus unclaimed `Communication`s for owned vehicles (`claimed_by_user_id=null && conversation_id=null`), grouped by `buildAnonymousThreads`. Each anonymous group id is `anon-vehicle-{vehicleId}-{anonHash}`. Threads sorted by latest message time. Final shape: `{id, senderName, username, preview, time, unread, blocked, emergency, messages:[{id,sender,text,time,read,kind}], isAnonymous}`.
- **Selection & Read:** Selecting a thread optimistically clears `unread` locally; `useEffect` on `selectedThreadId` posts `POST /api/messages/read {threadId}`. Backend handles both `anon-vehicle-...` (updates `Communication.read=true` filtered by `source`) and `BigInt(conversationId)` (updates `ConversationMessage.read_at` where `recipient_id=userId`). Thread sync via `queryThread` URL param (`?thread=`).
- **Reply:** Only non-anonymous threads are replyable. Button `Ok! I'm coming!` calls `POST /api/messages/send {threadId, message:"Ok! I'm coming!", mode:'default'}` (alias `POST /api/messages/reply` same handler). Backend `sendMessage` (`backend/controllers/messages.controller.js:224`) rejects `anon-vehicle-` ids, validates `message` non-empty, resolves `recipientId` as the other participant, `kind = EMERGENCY` if mode/text indicates emergency else `TEXT`, creates `ConversationMessage` + updates `last_message_at`, returns `{message}`. Anonymous threads show *Anonymous messages cannot be replied to — no reply channel available*.
- **Polling:** `useMessagesPolling` interval 5s, pauses when `document.visibilityState !== visible`, aborts pending fetch on unmount.

**Anonymous Claim on Signup:** `backend/controllers/auth.controller.js:85` — if `signup` payload contains `anonymousId` (string, trimmed, validated via `isValidAnonymousId`), calls `claimAnonymousMessages(userId, anonymousId)` (`backend/utils/claimAnonymousMessages.js:12`). It hashes the id, finds all `Communication`s with `source=anon:<hash>` and `claimed_by_user_id=null`, groups by `vehicle_id`, skips vehicles owned by the new user (no self-conversation), finds/creates `Conversation` per `(newUser, owner)` pair, migrates each `Communication` into a `ConversationMessage {sender_id=newUser, recipient_id=owner, body=message, kind, created_at=original, read_at=read?now:null}` and marks `Communication {claimed_by_user_id, conversation_id, claimed_at}`. Non-fatal — signup still succeeds if claim fails. This lets an anonymous scanner later sign up and see their prior scans as real threads in the inbox.

---

## Features

### Authentication & Registration
- Signup with username pattern `^[a-zA-Z0-9_]+$` (3–50 chars) and password rules (min 6, uppercase, lowercase, number, symbol) — `backend/utils/password.js:6`, `backend/validators/auth.validator.js:5`.
- JWT sessions (`jsonwebtoken`) via `signToken({userId, username})` (`backend/utils/jwt.js:3`) — verifies in `authenticate` middleware (`backend/middleware/auth.middleware.js:3`). No expiry configured.
- `bcrypt` (10 rounds) password hashing.
- Registration transaction (`prisma.$transaction`) creating `User` update + `EmergencyContact` + `Vehicle` with unique `qr_token`. Duplicate `username`/`email`/`plate_number` → `409`.

### Profile Management
- `GET /api/auth/me` returns `{user, emergencyContact, vehicle}`; `PUT /api/auth/me` updates all three in a transaction (validates via `validateProfileUpdate` which reuses `validateRegistrationDetails` + username rules).
- `PUT /api/auth/password` with `currentPassword` verification and `validateChangePassword` (new ≠ current).
- QR preview via `qrcode.react` `QRCodeCanvas`, enlarged `QRModal`, download as `smartcar-qr-<username>.png` via `canvas.toDataURL`, and `buildQrUrl` copy (`/qr/:token`).
- AppearanceSection: light/dark via CSS custom properties + `utils/theme.js` (`applyTheme`, `resolveTheme`, `getStoredTheme`), persisted.

### Vehicle Services
- `Service` model with `ServiceType` enum (19 types: `TYRE_CHANGE` … `FUEL_DELIVERY` — `backend/prisma/schema.prisma:128`) + `location`, `availability`.
- Frontend `Home` loads `GET /api/services` on mount (`fetchServices` in `frontend/src/services/api.js:33`), client-side search on `service_name`/`location` + filters for type/location/availability, slices 6 for Popular Services.

### Messaging
- Dual storage: `Conversation`/`ConversationMessage` (authenticated) + `Communication` (anonymous/legacy, `type MESSAGE|CALL`, `direction`, `source`, `read`, `claimed_*`, `conversation_id`).
- `MessageKind TEXT|EMERGENCY`; `classifyMessageText` tags blocked/emergency for badges.
- Unread counts, mark-as-read, reply (canned `Ok! I'm coming!`), anonymous read-only threads.
- Polling provider shares single interval across dashboard.

### QR System
- `qr_token` (`String @unique @db.VarChar(100)`) generated via `generateQrToken()` (`backend/utils/qrToken.js`). Public lookup `GET /api/qr/:token` and message `POST /api/qr/:token/message`.
- `GET /api/vehicles/me/qr` and `GET /api/vehicles/:vehicleId/qr` (owner-only) for QR retrieval.

### Theme & PWA
- Light/dark via `AppearancePicker` / `AppearanceSection`, CSS variables.
- `vite-plugin-pwa` (`frontend/vite.config.js:7`) with `generateSW`, `autoUpdate`, manifest `name SmartCar QR`, icons `pwa-192x192.png` / `pwa-512x512.png`, `display standalone`.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19.2, React Router 7.18, Vite 8.2, `@vitejs/plugin-react` 6, `vite-plugin-pwa` 1.3, `qrcode.react` 4.2, Vanilla CSS (`App.css`, `index.css`, `styles/auth.css`) |
| **Backend** | Node.js, Express 5.2, CORS 2.8, `dotenv` 17.4, `jsonwebtoken` 9.0, `bcrypt` 6.0, `pg` 8.23 |
| **Database & ORM** | Supabase PostgreSQL, Prisma 7.9 (`@prisma/client` 7.9, `@prisma/adapter-pg` 7.9, `prisma` 7.9), `PrismaPg` adapter (`backend/db.js:6` with `DATABASE_URL`) |
| **Build / Deploy** | Vercel (`backend/vercel.json`, `frontend/vercel.json`, `backend/api/index.js` serverless entry), ESLint 10.8 |

---

## Project Structure

```text
SmartCar QR/
├── backend/
│   ├── api/
│   │   └── index.js                 # Vercel serverless entry (exports Express app)
│   ├── controllers/
│   │   ├── auth.controller.js       # signup, login, getMe, updateMe, changePassword (+ claim)
│   │   ├── registration.controller.js
│   │   ├── messages.controller.js   # getMessages, markThreadRead, sendMessage, helpers
│   │   ├── qr.controller.js         # getVehicleByQrToken, postQrMessage (anon vs conversation)
│   │   ├── serviceController.js
│   │   ├── users.controller.js
│   │   └── vehicles.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js       # Bearer JWT verification
│   ├── prisma/
│   │   ├── schema.prisma            # User, Vehicle, EmergencyContact, Service, Communication, Conversation, ConversationMessage
│   │   └── migrations/              # 20260812192041_init … 20260825151057_add_communication_claim_fields
│   ├── prisma.config.ts             # datasource url = env(DIRECT_URL)
│   ├── routes/
│   │   ├── auth.routes.js           # /api/auth
│   │   ├── registration.routes.js   # /api/registration
│   │   ├── messages.routes.js       # /api/messages (/, /send, /reply, /read)
│   │   ├── qr.routes.js             # /api/qr/:token , /:token/message
│   │   ├── serviceRoutes.js         # /api/services
│   │   ├── users.routes.js          # /api/users
│   │   └── vehicles.routes.js       # /api/vehicles/me/qr, /:vehicleId/qr
│   ├── scripts/
│   │   ├── seed-services.js         # idempotent seed (skips existing service_type)
│   │   ├── test-signup.js
│   │   └── test-messages-flow.js
│   ├── utils/
│   │   ├── jwt.js                   # signToken
│   │   ├── password.js              # validatePassword, hash/compare
│   │   ├── qrToken.js               # generateQrToken
│   │   ├── registrationStatus.js    # isRegistrationComplete (Vehicle exists?)
│   │   ├── anonymous.js             # isValidAnonymousId, hashAnonymousId, resolveAnonymousSource
│   │   ├── claimAnonymousMessages.js# migrate Communication → ConversationMessage on signup
│   │   ├── ids.js                   # createBigIntId, normalizeConversationPair
│   │   ├── messageClassify.js       # classifyMessageText, formatTime
│   │   └── userDefaults.js          # buildSignupPlaceholders
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── registration.validator.js
│   │   └── profile.validator.js
│   ├── db.js                        # PrismaClient + PrismaPg adapter
│   ├── server.js                    # Express app, mounts /api/*, GET / and /api/test-db
│   ├── vercel.json
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── images/hero-landing.png, hero-home.png, hero-profile.png
│   │   ├── brandmark.png
│   │   └── pwa-192x192.png, pwa-512x512.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── ProtectedRoute.jsx       # ProtectedRoute + RegisterRoute
│   │   │   ├── ServiceCard.jsx
│   │   │   ├── BrandMark.jsx, AppearancePicker.jsx, AboutAppExplainer.jsx, ErrorBoundary.jsx
│   │   │   └── profile/                 # ProfileHeader, ProfileSidebar, AccountSection, PersonalSection, PasswordSection, AppearanceSection, HelpSection, AboutSection, QRModal, EditField
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # token/user/registrationComplete + localStorage sync
│   │   │   └── MessagesPollContext.jsx  # provides threads via useMessagesPolling
│   │   ├── hooks/
│   │   │   └── useMessagesPolling.js    # 5s polling, visibility-aware, abortable
│   │   ├── pages/
│   │   │   ├── landing.jsx, Login.jsx, SignUp.jsx, Register.jsx
│   │   │   └── Home.jsx, Messages.jsx, Profile.jsx, Users.jsx
│   │   ├── services/
│   │   │   └── api.js                   # API_BASE, buildApiUrl, fetchServices, login, signup, submitRegistration, fetchMyProfile, updateMyProfile, changePassword, fetchMyVehicleQr, fetchVehicleByQrToken, postQrMessage, fetchMessages, sendMessage, markThreadRead
│   │   ├── constants/
│   │   │   ├── appConfig.js             # SUPPORT_EMAIL, buildQrUrl, buildGoogleMapsUrl
│   │   │   └── serviceTypes.js
│   │   ├── utils/
│   │   │   ├── anonymousId.js           # getAnonymousDeviceId (UUID, localStorage)
│   │   │   └── theme.js
│   │   ├── styles/
│   │   │   ├── auth.css, App.css, index.css
│   │   ├── App.jsx                      # Router + ScannedQR public page
│   │   └── main.jsx
│   ├── vite.config.js                   # /api proxy → http://localhost:3000, VitePWA manifest
│   ├── vercel.json
│   ├── index.html
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Data Model

Prisma schema `backend/prisma/schema.prisma:1`:

- **User** `user_id PK`, `username unique`, `email unique`, `name`, `age`, `phone`, `password_hash`, `created_at`, relations `vehicle 1-1`, `emergencyContacts 1-N`, `conversationsA/B`, `sent/receivedMessages`, `claimedCommunications`.
- **Vehicle** `vehicle_id PK`, `user_id unique FK→User cascade`, `plate_number unique`, `car_name`, `year_model`, `qr_token unique`, `communications 1-N`.
- **EmergencyContact** `contact_id PK`, `user_id FK`, `relative_name`, `relative_phone`, `relationship?`.
- **Service** `service_id PK`, `service_name`, `service_type enum ServiceType`, `location`, `availability`.
- **Communication** `communication_id BigInt PK`, `vehicle_id FK`, `type enum MESSAGE|CALL`, `direction enum SENT|RECEIVED`, `source?` (`anon:<hash>` or `vehicle:`/`user:`), `message?`, `read`, `claimed_by_user_id? FK→User`, `conversation_id? FK→Conversation`, `claimed_at?`, `created_at`.
- **Conversation** `conversation_id BigInt PK`, `participant_a_id`, `participant_b_id`, `last_message_at`, `updated_at`, unique `[participant_a_id, participant_b_id]`.
- **ConversationMessage** `message_id BigInt PK`, `conversation_id FK`, `sender_id FK`, `recipient_id FK`, `body Text`, `kind enum TEXT|EMERGENCY`, `read_at?`, `created_at`.
- **PasswordReset** `reset_id PK`, `user_id FK`, `token unique`, `expires_at`.

Enums: `ServiceType` (19 values), `CommunicationType`, `CommunicationDirection`, `MessageKind`.

---

## Environment Variables

### Backend `backend/.env`

Create from `backend/.env.example:1`:

```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-strong-random-secret-at-least-32-chars"
```

| Var | Required | Notes |
|---|---|---|
| `PORT` | No (default `3000`) | Express listen port; `server.js:17` |
| `DATABASE_URL` | Yes | Supabase **pooler** URL (PgBouncer). Used by `PrismaPg` adapter in `db.js:7`. |
| `DIRECT_URL` | Yes | Supabase **direct** URL. Used by `prisma.config.ts:12` for `prisma migrate deploy`/`db push`. |
| `JWT_SECRET` | Yes | HS256 secret for `signToken`/`verify`. No `JWT_EXPIRES_IN` — tokens have no expiry in current code. |

> `DATABASE_URL` and `DIRECT_URL` are distinct — do not reuse the same URL for both if using Supabase pooling. See Prisma docs for `driverAdapters`.

### Frontend `frontend/.env`

Create from `frontend/.env.example:1`:

```env
VITE_API_URL=http://localhost:3000/api
# or leave unset to use Vite proxy: "/api" → http://localhost:3000
```

| Var | Default | Notes |
|---|---|---|
| `VITE_API_URL` | `/api` | Base for `API_BASE` in `services/api.js:1` (`(VITE_API_URL || '/api').replace(/\/$/,'')`). When `/api`, Vite dev server proxies to `http://localhost:3000` (`vite.config.js:34`). For production set to full backend URL e.g. `https://your-backend.vercel.app/api`. |

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node 24)
- npm 9+
- PostgreSQL database (Supabase recommended — provides both pooler and direct URLs)
- Git

### 1. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` (see table above):

```env
PORT=3000
DATABASE_URL="your-supabase-connection-pooler-url"
DIRECT_URL="your-supabase-direct-database-url"
JWT_SECRET="your-jwt-secret"
```

Apply schema and start API:

```bash
npx prisma generate        # also runs automatically via postinstall
npx prisma migrate deploy  # uses DIRECT_URL via prisma.config.ts; for local dev: npx prisma migrate dev
node scripts/seed-services.js   # optional: idempotent seed of 16 sample services

npm run dev                # node server.js — also aliased as npm start
```

Backend runs at `http://localhost:3000`.

- Health: `GET http://localhost:3000/` → `{message:"SmartCar QR Backend is running!"}`
- DB check: `GET http://localhost:3000/api/test-db` → `SELECT 1`

### 2. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
# optional: create frontend/.env with VITE_API_URL if not using proxy
npm run dev
```

Frontend runs at `http://localhost:5173`. Vite proxies `/api` → `http://localhost:3000` (`vite.config.js:34`). If `VITE_API_URL` is set to an absolute URL, the proxy is bypassed.

Build for production:

```bash
npm run build   # vite build → dist/ + generateSW (PWA)
npm run preview # preview prod build
```

### 3. Database notes

- Migrations live in `backend/prisma/migrations/` with `migration_lock.toml`. Current chain: `20260812192041_init` → `20260825151057_add_communication_claim_fields`.
- `prisma.config.ts` explicitly sets `datasource.url = env("DIRECT_URL")` — ensure `DIRECT_URL` is set before running migrations.
- `seed-services.js` skips existing `service_type` values and reports `{created, skipped, totalServices}`.

---

## API Endpoints

Base: `http://localhost:3000` (dev) or `VITE_API_URL`. All JSON. Auth via `Authorization: Bearer <JWT>` where noted.

| Method | Endpoint | Auth | Body / Params | Description |
|---|---|---|---|---|
| `GET` | `/` | Public | — | Health check (`server.js:22`). |
| `GET` | `/api/test-db` | Public | — | DB connectivity (`SELECT 1`). |
| `POST` | `/api/auth/signup` | Public | `{username, password, confirmPassword, anonymousId?}` | Create account. Username `^[a-zA-Z0-9_]+$` 3–50; password ≥6 + upper/lower/number/symbol; `anonymousId` optional (hash → claim). Returns `{token, user:{user_id,username}, registrationComplete:false}`. `409` if username taken. |
| `POST` | `/api/auth/login` | Public | `{username, password}` | Login. Returns `{token, user, registrationComplete}` (vehicle existence check). `401` on bad creds. |
| `GET` | `/api/auth/me` | Bearer | — | Current user profile. Returns `{user, emergencyContact, vehicle}`. |
| `PUT` | `/api/auth/me` | Bearer | `{fullName, username, age, email, phone, relativeName, relativePhone, relationship, plateNumber, carName, yearModel}` | Update profile (all validated, transaction). Checks unique username/email/plate. Returns updated profile. |
| `PUT` | `/api/auth/password` | Bearer | `{currentPassword, newPassword, confirmPassword}` | Change password (current verified, new ≠ current, same complexity rules). |
| `POST` | `/api/registration` | Bearer | `{fullName, age, email, phone, relativeName, relativePhone, relationship, plateNumber, carName, yearModel}` | Complete registration (once). Creates `EmergencyContact` + `Vehicle` + `qr_token`. `409` if already complete or email/plate taken. |
| `GET` | `/api/services` | Public | — | List vehicle services `[{service_id, service_name, service_type, location, availability}]`. |
| `GET` | `/api/users` | Public | — | List users minimal `[{user_id, username, email, vehicle:{qr_token}}]` ordered by username. |
| `GET` | `/api/vehicles/me/qr` | Bearer | — | Auth user's vehicle QR `{vehicle}`. `404` if none. |
| `GET` | `/api/vehicles/:vehicleId/qr` | Bearer | `vehicleId:number` | Vehicle QR by id, owner-only. `400` invalid id, `404` not found/not owner. |
| `GET` | `/api/qr/:token` | Public | `token:string` | Lookup vehicle by `qr_token`. Returns `{vehicle:{vehicle_id,user_id,plate_number,car_name,year_model,user:{user_id,username,phone}}}`. `404` if invalid. |
| `POST` | `/api/qr/:token/message` | **Public (optional Bearer)** | `token` param + `{type?:'MESSAGE'|'EMERGENCY'|'CALL', message?:string, location?:{lat,lng}, timestamp?:string, anonymousId?:string}` | Scan message. If Bearer valid & sender≠owner → creates `Conversation`/`Message` (returns `threadId`). If sender=owner → `400`. Else → `Communication` with `anon:<hash>` source. `type` maps to `Communication.type` (`CALL` else `MESSAGE`) and `kind` (`EMERGENCY` vs `TEXT`). |
| `GET` | `/api/messages` | Bearer | — | List merged threads (conversations + anonymous `anon-vehicle-*`). Returns `{messages:[Thread]}` sorted by latest activity. |
| `POST` | `/api/messages/send` | Bearer | `{threadId:string, message:string, mode?:'default'|'emergency'}` | Send message in thread (also `POST /api/messages/reply` alias). Rejects `anon-vehicle-*`. Creates `ConversationMessage`, bumps `last_message_at`. `mode` influences `kind`. Returns `{message:{id,sender,text,time,read,kind}}`. |
| `POST` | `/api/messages/reply` | Bearer | same | Alias of `/send` (same handler). |
| `POST` | `/api/messages/read` | Bearer | `{threadId:string}` | Mark thread read. `anon-vehicle-{id}-{hash}` → `Communication.read=true` (filtered by `source`); else `ConversationMessage.read_at=now()` for `recipient_id=user`. Legacy `anon-vehicle-{id}` also supported. |

> `Authorization` header for `/api/qr/:token/message` is **optional** — omit for anonymous scans; include `Bearer <JWT>` when the scanner is a logged-in SmartCar QR user to create a persistent inbox thread.

---

## Frontend Routing

| Path | Guard | Component | Notes |
|---|---|---|---|
| `/` | Public | `Landing` | `landing.jsx` — auth-aware CTA |
| `/login` | Public | `Login` | `Login.jsx` |
| `/signup` | Public | `SignUp` | `SignUp.jsx` — attaches existing anon id if present |
| `/register` | `RegisterRoute` | `Register` | Requires auth + incomplete; `ProtectedRoute.jsx:18` |
| `/home` | `ProtectedRoute` + `MessagesPollProvider` | `Home` | `Home.jsx` |
| `/messages` | same | `Messages` | `Messages.jsx` — `?thread=` deep link |
| `/profile` | same | `Profile` | `Profile.jsx` — tabs + QR modal |
| `/users` | same | `Users` | `Users.jsx` |
| `/qr/:token` | Public | `ScannedQR` (`App.jsx:28`) | Automated/custom message + emergency GPS |
| `*` | — | `Navigate to /` | Catch-all (`App.jsx:339`) |

Lazy-loaded pages via `React.lazy` + `Suspense` (`App.jsx:13`).

---

## Polling, Theming & PWA

- **Messages polling:** `MessagesPollContext` (`context/MessagesPollContext.jsx:8`) wraps dashboard with `intervalMs=5000`. Hook `useMessagesPolling` (`hooks/useMessagesPolling.js:9`) fetches `fetchMessages(token)`, aborts prior request, skips when tab hidden, preserves threads on error.
- **Theming:** `utils/theme.js` (`applyTheme`, `resolveTheme`, `getStoredTheme`) + `AppearanceSection`. Persisted choice, CSS custom properties.
- **PWA:** `vite.config.js:7` `VitePWA({registerType:'autoUpdate', strategies:'generateSW', manifest:{name:'SmartCar QR', short_name:'SmartCar', ...}})`. Icons in `public/`. Dev: `npm run dev` serves without SW; prod `npm run build` generates `dist/sw.js` + `manifest.webmanifest`.

---

## Quick Smoke Test

1. Start backend (`cd backend; npm run dev`) and frontend (`cd frontend; npm run dev`).
2. Visit `http://localhost:5173` → *Get Started* → sign up (username e.g. `demo_user`, password `Demo123!`).
3. Complete registration (personal + emergency + vehicle) → confirm redirect to `/home` and services load.
4. Open **Profile** → preview QR modal → verify `buildQrUrl` link.
5. Open QR link in private/incognito window (no auth) → test **Automated Message** and **Emergency** (allow GPS when prompted). Check that owner sees a new thread in `/messages` after refresh or within 5s polling (anonymous thread shows as *Unknown*, unread).
6. Log in as a second user (different username) on another browser, scan first user's QR via `/qr/<token>` while authenticated → verify a real conversation thread (`threadId` returned) appears for both users in `/messages`, and reply with `Ok! I'm coming!` works.
7. As anonymous scanner, sign up with the same browser (preserving `smartcar_anonymous_id`) → verify prior anonymous communications are claimed into conversations.

---

## Scripts

| Location | Command | Description |
|---|---|---|
| `backend` | `npm run dev` / `npm start` | `node server.js` |
| `backend` | `npm run postinstall` | `prisma generate` |
| `backend` | `node scripts/seed-services.js` | Seed services (idempotent by `service_type`) |
| `backend` | `node scripts/test-signup.js` | Manual signup test |
| `backend` | `node scripts/test-messages-flow.js` | Manual messages flow test |
| `frontend` | `npm run dev` | Vite dev server (`5173`, proxies `/api`) |
| `frontend` | `npm run build` | Vite build + PWA SW |
| `frontend` | `npm run preview` | Preview prod build |
| `frontend` | `npm run lint` | ESLint |

---

## Deployment

- **Backend:** Vercel serverless — `backend/api/index.js` exports `app`, `backend/vercel.json` rewrites. Set `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` in Vercel env.
- **Frontend:** Vercel static — `frontend/vercel.json` handles SPA fallback. Set `VITE_API_URL` to backend `/api` URL (e.g. `https://<backend>.vercel.app/api`).
- **Database:** Supabase PostgreSQL. Apply migrations via `npx prisma migrate deploy` (requires `DIRECT_URL`).

