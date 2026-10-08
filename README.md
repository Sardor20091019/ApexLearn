# APEXLEARN — Elite Knowledge Marketplace

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10%2B-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Kysely](https://img.shields.io/badge/ORM-Kysely-brightgreen?style=for-the-badge)](https://kysely.dev/)
[![BullMQ](https://img.shields.io/badge/Queues-BullMQ-red?style=for-the-badge)](https://bullmq.io/)

<p align="center">
  <strong>The premium online course marketplace where independent creators stream raw intellect.</strong><br>
  Built with Awwwards-inspired scrollytelling mechanics, WebGL 3D rendering, and enterprise-grade NestJS backend infrastructure.
</p>

</div>

---

## ⚡ Highlights & Architecture

ApexLearn is designed as a high-performance monorepo uniting an editorial, scroll-driven Next.js frontend with a resilient NestJS micro-monolith backend.

- **🏎️ SOTD Kinetic Scrollytelling Experience**: Full-screen 3D Koenigsegg Agera model progression driven exclusively by scroll depth via `@react-three/fiber`, Three.js, and GSAP ScrollTrigger. Physics-smoothed scroll dynamics with Lenis.
- **🎨 Mechanical Brutalism & Dual Palette**: Obsidian Dark (`#070709`) and Ivory Light (`#F0EDE6`) colorways with Vermillion (`#E8400C`) mechanical accents, custom typography (`Barlow Condensed`, `Syne`, `DM Mono`), and magnetic cursor physics.
- **🎓 Comprehensive Learning Portal**: Video lesson player with timestamp tracking, auto-saving lesson progress, dynamic certificate generation (PDF + QR code validation), and verified certificate lookup route (`/verify/:certId`).
- **🛠️ Instructor & Course Creator Engine**: Multi-section curriculum builder, drag-and-drop video/asset uploading via UploadThing/S3, Stripe Connect checkout flows, and revenue management.
- **💬 Real-Time Live Support & Notifications**: Integrated dual WebSocket engine (Socket.IO + Pusher Channels) for instant student-to-support messaging and real-time activity updates.
- **🛡️ Enterprise Authentication & Security**: JWT access/refresh token rotation, Passport strategies, Google One-Tap authentication, Cloudflare Turnstile bot verification, and Redis rate limiting (`@nestjs/throttler`).
- **📬 Asynchronous Queue Engine**: Redis-backed BullMQ processing for background transcoding and transactional email delivery, featuring an integrated Bull Board monitoring dashboard at `/queues`.
- **🗄️ Database Architecture**: Fully type-safe PostgreSQL data layer powered by Kysely query builder and migration runner.

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS v4, CSS Variables theme engine |
| **3D & Canvas** | Three.js, `@react-three/fiber`, `@react-three/drei` (OBJ loading & studio lighting) |
| **Motion & Scroll** | GSAP 3 + ScrollTrigger, Lenis Smooth Scroll, Framer Motion |
| **Certificates & Export** | `jspdf`, `html2canvas`, `qrcode.react` |
| **Uploads** | `@uploadthing/react` |
| **Real-time** | `pusher-js`, `socket.io-client` |

### Backend (`/backend`)
| Layer | Technology |
|---|---|
| **Framework** | NestJS 10+ (TypeScript 5+) |
| **Database** | PostgreSQL 14+ via Kysely SQL query builder |
| **Caching & Queues** | Redis (ioredis / Upstash) + BullMQ |
| **Queue Dashboard** | `@bull-board/nestjs` (`/queues`) |
| **Authentication** | Passport.js, JWT (`@nestjs/jwt`), Bcrypt, Google Auth |
| **Payments** | Stripe API (`stripe`) |
| **Media & Transcoding** | Fluent-FFmpeg, FFmpeg-static, Multer, AWS S3 SDK |
| **Real-time** | Socket.IO (`@nestjs/websockets`), Pusher Server |
| **Email** | Nodemailer |

---

## 📂 Repository Structure

```text
courseapp/
├── frontend/                     # Next.js 16 Client Application
│   ├── app/
│   │   ├── page.tsx              # Scrollytelling 3D Koenigsegg Landing Page
│   │   ├── layout.tsx            # Global HTML & Body Shell
│   │   ├── globals.css           # Tailwind v4 theme definitions & tokens
│   │   ├── auth/                 # Authentication & Google Login
│   │   ├── dashboard/            # Student Portal & Course Catalog
│   │   ├── instructor/           # Creator Studio & Course Builder
│   │   ├── courses/[courseId]/   # Course overview & lesson player
│   │   └── verify/[certId]/      # Public Certificate Verification Engine
│   ├── components/
│   │   ├── apexlearn/            # 3D Koenigsegg Canvas, Lenis & Theme Providers
│   │   ├── Certificate.tsx       # PDF Certificate generator
│   │   └── SupportChat.tsx       # Live support chat widget
│   └── package.json
│
├── backend/                      # NestJS 10 REST & WebSocket API
│   ├── src/
│   │   ├── auth/                 # JWT Auth, Google, Password hashing
│   │   ├── courses/              # Course CRUD, filtering, categories
│   │   ├── sections/             # Section organization
│   │   ├── progress/             # Lesson tracking & certificate issue
│   │   ├── enrollments/          # Student course enrollment & access
│   │   ├── database/             # Kysely database client & migrations
│   │   ├── queues/               # BullMQ background workers (Mail, Audio)
│   │   ├── redis/                # Redis cache provider
│   │   ├── reviews/              # Course reviews & ratings
│   │   ├── stars/                # Course bookmarking
│   │   ├── support/              # WebSocket support conversation gateway
│   │   ├── notifications/        # User notification system
│   │   └── main.ts               # NestJS bootstrap & Bull Board mount
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10+`
- **PostgreSQL**: `v14+` running locally or cloud (e.g. Neon, Supabase)
- **Redis**: `v6+` running locally or Upstash Redis

---

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Sardor20091019/courseapp.git
cd courseapp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Environment Configuration

#### Backend Configuration (`backend/.env`)
Create `backend/.env` based on the following template:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001

# PostgreSQL Database
DATABASE_URL=postgres://postgres:password@localhost:5432/apexlearn

# JWT Authentication
JWT_SECRET=super_secret_access_jwt_key_32chars
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_32chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis / BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# UploadThing / S3 Storage
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pusher Channels (Optional Realtime)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=mt1

# Mailer (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Frontend Configuration (`frontend/.env`)
Create `frontend/.env` based on the following template:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

---

### 3. Database Migrations

Run database migrations using Kysely:

```bash
cd backend
npm run db:migrate
```

---

### 4. Running the Development Servers

Open two terminal tabs:

#### Terminal 1 — Backend API (Port 4000)
```bash
cd backend
npm run dev
```
- API Base: `http://localhost:4000/api/v1`
- Bull Board Queue Dashboard: `http://localhost:4000/queues`

#### Terminal 2 — Frontend Application (Port 3001)
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:3001`

---

## 📜 Key Endpoints (REST API `/api/v1`)

| Module | Method | Path | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | Register new student or instructor | Public |
| **Auth** | `POST` | `/auth/login` | Login and receive access/refresh tokens | Public |
| **Auth** | `POST` | `/auth/refresh` | Rotate access token using refresh token | Public |
| **Auth** | `GET` | `/auth/profile` | Retrieve authenticated user profile | Bearer JWT |
| **Courses** | `GET` | `/courses` | List catalog with search, category, pagination | Public |
| **Courses** | `GET` | `/courses/:id` | Get single course curriculum & details | Public |
| **Courses** | `POST` | `/courses` | Create new course draft | Instructor |
| **Enrollments**| `POST` | `/enrollments/:courseId` | Enroll in free or purchased course | Student |
| **Enrollments**| `GET` | `/enrollments/me` | List enrolled courses for user | Student |
| **Progress** | `POST` | `/progress/lesson/:id` | Mark lesson complete / update timestamp | Student |
| **Progress** | `GET` | `/progress/certificate/:courseId` | Issue completion certificate | Student |
| **Progress** | `GET` | `/progress/verify-certificate/:certId` | Verify authenticity of certificate | Public |
| **Support** | `POST` | `/support/conversations` | Initiate live chat thread | User / Admin |
| **Queues** | `GET` | `/queues` | BullMQ administrative dashboard | Admin |

---

## 🎨 Design Philosophy & 3D Mechanics

The landing page implements an Awwwards-inspired architectural layout:
1. **Camera Rigging**: An OBJ-loaded Koenigsegg Agera model positioned inside Three.js space.
2. **Scroll Interpolation**: Scroll progress (`0.0` to `1.0`) calculates exact rotation (`rotX`, `rotY`), lateral positioning (`posX`, `posY`, `posZ`), and perspective camera parameters (`camX`, `camY`, `camZ`, `fov`).
3. **Delta Lerp Damping**: Camera transitions use frame-independent exponential damping (`1 - Math.pow(0.028, delta * 60)`) to deliver butter-smooth momentum even during rapid mousewheel flicks.
4. **Light & Dark Adaptation**: The car adapts its PBR material properties (roughness, metalness, and body reflections) dynamically upon theme toggle without recreating geometries.

---

## 🛠️ Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

