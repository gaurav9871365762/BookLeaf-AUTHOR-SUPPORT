# BookLeaf Author Support Portal - Product Architecture & Design Write-Up

## Executive Summary
The BookLeaf Author Support Portal is a dual-portal application (`Author Portal` and `Admin Desk`) architected to solve the core communication bottleneck between indie publishing authors and publisher operations. Rather than treating AI as an autonomous customer-facing agent, the system employs **Human-in-the-Loop AI Assistance**: AI handles classification, triage prioritization, and policy-grounded draft preparation, but **every message sent to an author requires explicit human admin verification**.

---

## 1. Core Architecture & Boundary Isolation

### Multi-Tenant Isolation
- Authors are isolated by their authenticated session. Even if a malicious client alters the request payload, the backend ignores client-submitted IDs and derives the `authorId` exclusively from the signed HttpOnly JWT cookie.
- Boundary verification tests confirm that **Author A (`AUTH001`) cannot see Author B's (`AUTH007`) books**, while Administrators have whole-catalog visibility (18 books across 10 authors).

### Internal Note Security
- Collaboration between support agents requires private discussion (e.g. checking print defects, bank transaction logs, or author history).
- All internal notes are tagged `visibility: "internal"`. In `GET /api/tickets/:ticketId`, non-admin requests execute a database-level filter `{ visibility: "public" }`. The server never sends internal notes over the wire to author browsers, eliminating leakage risks.

---

## 2. AI Integration Strategy (25% Evaluation Weight)

### Two-Stage Decoupled Triage
1. **Resilient Persistence First**: When an author submits a ticket, the ticket is immediately written to MongoDB. If the AI provider experiences latency, rate limiting, or outage, the ticket creation **never fails**.
2. **Schema-Constrained Classification**: AI classification evaluates the untrusted ticket text and maps it into exactly **6 official BookLeaf categories** and **4 priority levels** (`Critical`, `High`, `Medium`, `Low`).
   - The output is validated through a strict **Zod schema**.
   - If AI returns invalid JSON or hallucinated categories, the schema validator intercepts it, falling back to a deterministic classifier.

### Grounded Knowledge Base Reply Drafting
- Hallucinations (e.g., promising a false payout date or inaccurate royalty percentages) severely damage author trust.
- The reply draft generator retrieves specific policy rules from `server/src/services/knowledgeBase.ts` (e.g. 80/20 profit split, quarterly payout within 45 days, ₹1,000 threshold, 5–7 day print turnaround).
- The drafted reply is loaded into an editable admin workspace. **The admin must review, customize, and press "Send Public Reply"**. Auto-send is structurally disabled.

---

## 3. Resilience & Edge Cases

### Null-Safety for Books in Production
- The dataset contains books at various stages: `Published & Live`, `In Production - Cover Design`, and `In Production - Typesetting`.
- In-production titles (such as `BK013` - *Midnight in Mysore* and `BK015` - *Raising Roots*) have `null` values for `publication_date`, `mrp`, `author_royalty_per_copy`, and `last_payout_date`.
- The frontend uses dedicated `renderValueOrDash` handlers that safely render `—` rather than crashing `TypeError: Cannot read properties of null`.

### Idempotent Database Seeding
- The seeding script (`npm run seed`) loads 10 authors and 18 books using MongoDB `updateOne(..., { $set }, { upsert: true })`.
- Running the seed script multiple times produces zero duplicate accounts or duplicate titles.

---

## 4. Real-Time Synchronization
- Implemented with **Socket.IO**:
  - `ticket:created`: Instantly alerts the admin triage queue when an author submits a ticket.
  - `ticket:updated`: Broadcasts category, priority, or status changes in real time.
  - `message:created`: Delivers staff replies directly into the author's open conversation view without requiring manual page reloads. Internal notes are routed exclusively to the admin room.
