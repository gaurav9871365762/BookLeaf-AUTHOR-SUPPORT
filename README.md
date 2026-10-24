# BookLeaf Author Support Portal

A full-stack, role-based publishing support desk and royalty analytics system built with **Node.js, Express, TypeScript, MongoDB, React, Vite, Socket.IO, and AI Triage**.

---

## 🌟 Key Features

### 1. Author Portal
- **My Books & Royalty Analytics**:
  - Live ledger tracking copies sold, gross royalty earned, royalty paid, and pending payouts.
  - Multi-channel availability indicators (Amazon India, Flipkart, BookLeaf Store, Amazon US/UK).
  - **Null-Safe Resilience**: Pre-publication and in-production titles (`In Production - Cover Design`, `In Production - Typesetting`) display `—` for pending metadata and retail figures without page crashes.
- **AI-Triaged Ticket Submission**:
  - Book selector featuring all author titles plus a dedicated **"General / Account Level"** option.
  - Instant AI classification into one of 6 official BookLeaf categories and 4 priority levels.
  - **Security Guarantee**: Author ID is derived exclusively from the authenticated session, never trusted from client request bodies.
- **Conversation Thread**:
  - Public message thread between the author and support staff.
  - **Strict Server-Enforced Privacy**: Private internal staff notes are scrubbed at the database layer and are never transmitted to author browsers.

### 2. Admin Support Desk
- **Urgency-Ranked Triage Queue**:
  - Priority pulse indicators for `Critical` and `High` urgency tickets.
  - Real-time filters for Status, Category (6 categories), Priority (4 priorities), and Sorting (Urgency Ranked vs. FIFO Oldest).
  - Whole-catalog visibility across all 18 books and 10 authors.
- **Staff Triage Controls**:
  - Re-classify category, priority, status (`Open`, `In Progress`, `Waiting on Author`, `Resolved`, `Closed`), and assignee with real-time WebSocket broadcast.
- **AI Reply Drafting (Human-in-the-Loop)**:
  - Generates policy-grounded response drafts based on official BookLeaf Knowledge Base facts.
  - Drafts appear in an editable workspace for staff review. **Auto-send is structurally disabled**.
- **Private Internal Notes**:
  - Distinct amber callout box for internal team coordination, completely hidden from authors.

### 3. Real-Time Sync (Socket.IO)
- Instant synchronization across tabs for new tickets, triage changes, and replies.
- Role-gated socket rooms ensure internal notes are only broadcast to staff.

---

## 👥 Demo Accounts (1-Click Switcher Available in UI)

| Role | Account Name | Email | Password | Description |
|---|---|---|---|---|
| **Admin** | BookLeaf Support Admin | `admin@bookleaf.com` | `AdminPassword123!` | Full triage queue, AI draft generator, status & note controls |
| **Author** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | `AuthorPassword123!` | 2 published fiction & memoir titles |
| **Author** | Sneha Kulkarni (`AUTH007`) | `sneha.kulkarni@email.com` | `AuthorPassword123!` | 3 books: 2 published + 1 in production (`BK013`, tests null-safety) |
| **Author** | Rohit Kapoor (`AUTH002`) | `rohit.kapoor@email.com` | `AuthorPassword123!` | Top seller (2,000+ copies sold, ₹84k+ royalties) |
| **Author** | Kavita Deshmukh (`AUTH009`)| `kavita.deshmukh@email.com`| `AuthorPassword123!` | 2 books: 1 live + 1 in typesetting (`BK015`, null-safety) |

*All 10 authors from the sample dataset can be accessed with their respective emails and `AuthorPassword123!`.*

---

## 🚀 Quick Start Guide

### Option A: Docker Compose (Recommended - Zero Setup Required)

Everything is containerized into a production-grade multi-container topology (`MongoDB 7.0` + `Express Node 22 API` + `Nginx React Client`):

```bash
# 1. Start all services in background
docker compose up -d
# (or: npm run docker:up)

# 2. Seed database (10 authors, 18 books, 7 realistic tickets with conversations & AI metadata)
docker compose exec server npm run seed
# (or: npm run docker:seed)
```

- **Web App**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Live Logs**: `npm run docker:logs` or `docker compose logs -f`
- **Stop Containers**: `npm run docker:down` or `docker compose down`

---

### Option B: Local Node.js Development

#### Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **MongoDB** running locally on port `27017` (or MongoDB Atlas connection string)

#### 1. Database Seeding (Idempotent)
The seed script inserts the 10 authors, 18 books, 7 realistic tickets, and the admin profile into MongoDB:
```bash
cd server
npm install
npm run seed
```
*Re-running `npm run seed` is completely idempotent and will never duplicate records.*

#### 2. Start the Backend API
```bash
cd server
npm run dev
```
*API runs at `http://localhost:5000` with WebSocket support.*

#### 3. Start the Frontend Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
*Web application opens at `http://localhost:5173`.*

---

## 🧪 Automated Verification Suite

Run the full end-to-end boundary and security test suite:
```bash
cd server
npx tsx scripts/verify-all.ts
```

### Verified Checks:
- ✅ **API Health**: Returns status `ok`.
- ✅ **Boundary Isolation**: Author A (`AUTH001`) can only see Author A's books; Author B (`AUTH007`) can only see Author B's books.
- ✅ **Whole Catalog Access**: Admin sees all 18 books across all 10 authors.
- ✅ **Session Integrity**: `authorId` is derived exclusively from the authenticated JWT session.
- ✅ **AI Triage Validation**: Category and Priority strictly match Zod schema with fallback resilience.
- ✅ **Internal Note Redaction**: Internal notes are verified present in Admin view and **verified 100% absent** in Author view.
- ✅ **Staff Response Review**: Admin explicitly reviews and sends AI draft; author receives public response.

---

## 📁 Repository Structure

```
bookleaf-support/
├── client/                     # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Modular UI components (Navbar, Books, Queue, Triage)
│   │   ├── services/           # API fetch client & Socket.IO client
│   │   ├── types/              # TypeScript schemas (Book, Ticket, Message, User)
│   │   ├── App.tsx             # Main portal router
│   │   └── index.css           # Bespoke BookLeaf design system & tokens
│   ├── Dockerfile              # Multi-stage production build (Node builder -> Nginx runner)
│   ├── nginx.conf              # Nginx reverse proxy routing /api & /socket.io to backend
│   ├── .dockerignore           # Excludes local node_modules & dist
│   └── vite.config.ts          # Local dev server proxy configuration
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── data/
│   │   └── sample.json         # 10 authors & 18 books dataset
│   ├── scripts/
│   │   ├── seed.ts             # Idempotent seeder (authors, books, 7 rich tickets, notes, AI meta)
│   │   └── verify-all.ts       # Automated verification test suite
│   ├── src/
│   │   ├── config/             # MongoDB connection
│   │   ├── middleware/         # HttpOnly JWT auth & Zod body validation
│   │   ├── models/             # Mongoose schemas (Author, Book, User, Ticket, Message, AIMeta)
│   │   ├── routes/             # Role-isolated route handlers (auth, books, tickets, admin)
│   │   ├── services/           # AI triage & Knowledge Base policy engine
│   │   ├── sockets/            # Real-time WebSocket manager
│   │   └── server.ts           # HTTP server bootstrap
│   ├── Dockerfile              # Production Node.js 22 runtime container
│   ├── .dockerignore           # Excludes local node_modules, dist, & .env
│   └── .env.example            # Environment configuration template
├── docker-compose.yml          # Multi-container orchestration (Mongo 7 + Server + Client Nginx)
├── .env.docker.example         # Docker Compose environment template
├── .dockerignore               # Root build context exclusions
├── API_DOCUMENTATION.md        # Comprehensive endpoint reference
├── ONE_PAGE_WRITEUP.md         # Architecture, design decisions, and trade-offs
└── README.md                   # Complete project and deployment guide
```

---

## 📖 Further Documentation
- See [API_DOCUMENTATION.md](file:///c:/Users/gaura/OneDrive/Desktop/bookleaf-support/API_DOCUMENTATION.md) for request/response payloads.
- See [ONE_PAGE_WRITEUP.md](file:///c:/Users/gaura/OneDrive/Desktop/bookleaf-support/ONE_PAGE_WRITEUP.md) for architectural rationale and AI design decisions.
- See [BookLeaf_Support_Portal_Complete_Documentation.pdf](file:///c:/Users/gaura/OneDrive/Desktop/bookleaf-support/BookLeaf_Support_Portal_Complete_Documentation.pdf) for formal system documentation.