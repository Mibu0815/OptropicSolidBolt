🧠 Optropic Platform

Secure Digital Identities for Physical Objects
Building the next-generation infrastructure for trusted, verifiable, and intelligent touchpoints.

🚀 Overview

The Optropic Platform enables enterprises to create, manage, and verify cryptographically secured optical codes (QR, NFC, RFID) for physical products, assets, and infrastructure.
It combines optical encryption, AI-driven configuration, and real-time analytics to ensure authenticity, traceability, and compliance.

Optropic Codes look like ordinary QR codes — but carry cryptographically verifiable signatures and role-based data.
Each scan establishes a trusted connection between the physical world and digital intelligence.

🏗️ System Architecture
optropic-platform/
│
├── apps/
│   ├── frontend/   →  Solid AI project (React 19, tRPC, Tailwind, Zustand)
│   └── backend/    →  BOLT / Cursor project (Node.js, tRPC, Prisma, PostgreSQL)
│
├── docker-compose.yml
├── .env.example
└── README.md

Frontend (apps/frontend)

Built with Solid AI

Provides the complete UI scaffolding

Authentication & Role Management

Project Management

Key Management (/keys)

Content Hub (/content)

Scan Simulator (/simulate-scan)

Analytics Dashboard (/dashboard)

Notifications & Role Manager

Frontend handles UX, orchestration, and mock data — all business logic is delegated to backend APIs.

Backend (apps/backend)

Developed via BOLT or Cursor

Provides secure, cryptographic, and data management logic:

ECC key generation & encryption (AES-256)

Optropic code signing & verification

File/content management via MinIO

Analytics aggregation & caching

Notification & event system

Audit logging & compliance tracking

🔐 Core Concept
Component	Purpose
Keys	Cryptographically generated, rotated, and revoked securely.
Codes	Encoded optical signatures binding physical objects to digital identities.
Content	Versioned assets and metadata linked to each code.
Scans	Logged verification events with geo and device metadata.
Notifications	System alerts for key rotation, verification anomalies, and security breaches.
🧩 Tech Stack
Layer	Technology
Frontend	React 19, TypeScript, tRPC, TanStack Router, Zustand, Tailwind, Recharts
Backend	Node.js, Prisma ORM, PostgreSQL, tRPC, MinIO SDK, JWT Auth, AES-GCM, ECC
Infrastructure	Docker Compose, GitHub Actions, AWS S3/KMS (optional), WebSocket
AI Tools	Solid AI (frontend), BOLT / Cursor (backend automation)
⚙️ Setup Instructions
1️⃣ Clone Repository
git clone https://github.com/<your-org>/optropic-platform.git
cd optropic-platform

2️⃣ Frontend Setup
cd apps/frontend
npm install
npm run dev


Environment variables (if applicable):

VITE_API_URL=http://localhost:3000
VITE_MINIO_ENDPOINT=http://localhost:9000

3️⃣ Backend Setup
cd ../backend
npm install
npx prisma migrate dev
npm run dev


Environment variables (.env):

DATABASE_URL=postgresql://user:pass@localhost:5432/optropic
JWT_SECRET=<secure-secret>
SECRET_KEY=<aes-key-for-private-encryption>
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123

4️⃣ Docker (optional)
docker-compose up --build


Runs PostgreSQL, MinIO, and the backend locally.

🧠 Development Workflow
Role	Tool	Responsibility
Frontend (Solid AI)	Solid Studio	UI, navigation, UX logic, tRPC client integration
Backend (BOLT / Cursor)	BOLT / Cursor	Cryptography, business logic, persistence, analytics
Repository	GitHub	Shared codebase and version control
Workflow Diagram
Solid AI (Frontend) ──→ Mock APIs ──→ BOLT / Cursor (Backend)
          ↑                                   ↓
     React + tRPC                     Node + Prisma + Crypto

🔄 Data Models (Prisma)

User → Roles, authentication, notification linkage

Project → Core entity linking codes, keys, and analytics

Key → ECC/AES keys with rotation & status management

Code → Cryptographically signed optical identifiers

Content → Linked files and metadata (MinIO storage)

ScanEvent → Verification logs and analytics source

Notification → Real-time system alerts

🧠 AI Collaboration Guide
Solid AI

Use the following prompts for frontend improvements:

“Enhance /keys UI to display active key stats and filters.”

“Add analytics chart for scan trends on /dashboard.”

“Create notification center with toast + archive view.”

BOLT / Cursor

Use the following prompts for backend logic:

“Implement /api/keys ECC keypair generation with AES-256 encryption.”

“Create /api/verify for code signature validation and event logging.”

“Build /api/content CRUD with MinIO presigned URLs.”

🧩 Security Principles

AES-256-GCM encryption for private key storage

ECC (P-256) signing for all optropic payloads

JWT-based session authentication

Full audit trail for all data mutations

GDPR & NIS2 compliance ready

🧪 Testing & Validation

Unit tests for crypto, API, and role validation (Jest)

Mock data parity with frontend (Prisma seeding)

CI pipeline (GitHub Actions) runs lint → test → build

🌐 Deployment Targets
Environment	Description
Dev	Docker Compose (local)
Staging	Vercel (frontend) + Railway / Render (backend)
Production	AWS ECS / GCP Cloud Run + managed PostgreSQL
📬 Contact & Contributions

Maintained by the AiO.digital | QRGuard team

For enterprise partnerships or integration inquiries, contact:
info@aio.digital
