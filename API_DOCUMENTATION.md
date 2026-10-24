# BookLeaf Author Support Portal - API Documentation

The BookLeaf Support Portal API is built with Node.js, Express, TypeScript, and MongoDB. It implements strict role-based access control (`author` vs. `admin`) via HttpOnly JWT cookies.

---

## Base URL
- Development: `http://localhost:5000/api` (proxied by client dev server at `/api`)

---

## Authentication Endpoints

### 1. Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "priya.sharma@email.com",
  "password": "AuthorPassword123!"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "67b93100...",
      "name": "Priya Sharma",
      "email": "priya.sharma@email.com",
      "role": "author",
      "authorId": "AUTH001"
    }
  }
}
```
- Sets `accessToken` HttpOnly cookie valid for 24 hours.

### 2. Current Session
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (`author` or `admin`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "67b93100...",
    "name": "Priya Sharma",
    "email": "priya.sharma@email.com",
    "role": "author",
    "authorId": "AUTH001"
  }
}
```

### 3. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Public
- **Response (200 OK)**: Clears `accessToken` cookie.

---

## Books & Royalty Endpoints

### 4. Get Books
- **Endpoint**: `GET /api/books`
- **Access**: Authenticated
  - **Author**: Automatically filtered to only books matching `user.authorId` (Author A cannot see Author B's books).
  - **Admin**: Returns all books across the catalog (all 18 books).
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b93101...",
      "bookId": "BK001",
      "authorId": "AUTH001",
      "title": "Whispers of the Ganges",
      "isbn": "978-93-5XXXX-01-1",
      "genre": "Literary Fiction",
      "publicationDate": "2023-06-20T00:00:00.000Z",
      "status": "Published & Live",
      "mrp": 399,
      "authorRoyaltyPerCopy": 35,
      "copiesSold": 342,
      "royaltyEarned": 11970,
      "royaltyPaid": 8400,
      "royaltyPending": 3570,
      "lastPayoutDate": "2025-10-15T00:00:00.000Z",
      "printPartner": "In-House",
      "availableOn": ["Amazon India", "Flipkart", "BookLeaf Store"]
    }
  ]
}
```
*Note on Production Books:* For books currently in production stages (e.g. `BK013`), fields such as `publicationDate`, `mrp`, `authorRoyaltyPerCopy`, and `lastPayoutDate` are returned as `null` and displayed gracefully as `—` on the frontend.

---

## Author Ticket Endpoints

### 5. List Author Tickets
- **Endpoint**: `GET /api/tickets`
- **Access**: Authenticated
  - Authors only receive tickets matching their logged-in `authorId`.
- **Response (200 OK)**: Array of ticket summary objects.

### 6. Create Support Ticket (with AI Triage)
- **Endpoint**: `POST /api/tickets`
- **Access**: Author role only
- **Important**: `authorId` is **NEVER** accepted from the client request body. The server derives it directly from the validated session.
- **Request Body**:
```json
{
  "bookId": "BK001",
  "subject": "Delay in Q4 Royalty Payout",
  "description": "My sales exceed ₹3,000 threshold but Q4 payout has not reflected in my bank account."
}
```
- **Processing Flow**:
  1. Validates input schema using Zod.
  2. Saves ticket to MongoDB (guaranteeing ticket is created even if downstream AI fails).
  3. Executes AI classification (Zod-validated to one of 6 categories and 4 priorities).
  4. Updates ticket with AI metadata.
  5. Broadcasts real-time `ticket:created` event via Socket.IO.
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "ticket": {
      "_id": "67b93105...",
      "authorId": "AUTH001",
      "bookId": "BK001",
      "subject": "Delay in Q4 Royalty Payout",
      "description": "...",
      "category": "Royalty & Payments",
      "categorySource": "ai",
      "priority": "Medium",
      "prioritySource": "ai",
      "status": "Open",
      "aiSuggestionAvailable": true
    },
    "aiSuggestionAvailable": true
  }
}
```

### 7. Get Ticket Detail & Conversation
- **Endpoint**: `GET /api/tickets/:ticketId`
- **Access**: Ticket author or Admin
- **Security Guarantee**: For author requests, the database query strictly enforces `visibility: "public"`. Internal notes (`visibility: "internal"`) are **filtered out at the database layer** and never transmitted to authors.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "ticket": { ... },
    "messages": [
      {
        "_id": "...",
        "ticketId": "...",
        "senderRole": "admin",
        "body": "Dear Author, we have reviewed your Q4 sales...",
        "visibility": "public",
        "createdAt": "..."
      }
    ]
  }
}
```

### 8. Send Author Message
- **Endpoint**: `POST /api/tickets/:ticketId/messages`
- **Access**: Ticket author
- **Request Body**:
```json
{
  "body": "Thank you, here is the screenshot of my passbook."
}
```
- **Response (201 Created)**: Created public message object.

---

## Admin Support Desk Endpoints

### 9. Admin Ticket Queue
- **Endpoint**: `GET /api/admin/tickets`
- **Access**: Admin role only (`requireRole('admin')`)
- **Query Parameters**:
  - `status`: Filter by status (`Open`, `In Progress`, `Waiting on Author`, `Resolved`, `Closed`)
  - `category`: Filter by category (6 allowed categories)
  - `priority`: Filter by priority (`Critical`, `High`, `Medium`, `Low`)
  - `sort`: `urgent` (Critical & High first) or `oldest` (FIFO)
- **Response (200 OK)**: Array of matching tickets.

### 10. Update Ticket Triage (Category, Priority, Status, Assignee)
- **Endpoint**: `PATCH /api/admin/tickets/:ticketId`
- **Access**: Admin role only
- **Request Body**:
```json
{
  "category": "Royalty & Payments",
  "priority": "High",
  "status": "In Progress"
}
```
- **Response (200 OK)**: Updated ticket object. Emits real-time `ticket:updated` event.

### 11. Add Private Internal Note
- **Endpoint**: `POST /api/admin/tickets/:ticketId/notes`
- **Access**: Admin role only
- **Request Body**:
```json
{
  "body": "Finance team batch #902 processed yesterday. Awaiting bank clearance."
}
```
- **Response (201 Created)**: Created note with `visibility: "internal"`. Only broadcast to `admin-room` via Socket.IO.

### 12. Generate AI Reply Draft
- **Endpoint**: `POST /api/admin/tickets/:ticketId/draft-response`
- **Access**: Admin role only
- **Behavior**: Retrieves factual policy guidelines from the BookLeaf Knowledge Base for the ticket's category and drafts an empathetic response.
- **Important**: Returns the draft for human admin inspection. **DOES NOT SEND OR AUTO-SEND ANY MESSAGE.**
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "draft": "Dear Author,\n\nThank you for reaching out..."
  }
}
```

### 13. Send Public Staff Response
- **Endpoint**: `POST /api/admin/tickets/:ticketId/send-response`
- **Access**: Admin role only
- **Request Body**:
```json
{
  "body": "Dear Author, we have reviewed your Q4 payout. Batch #902 has been released..."
}
```
- **Behavior**: Posts public response, updates ticket status from `Open` to `In Progress`, and notifies author in real time.
- **Response (201 Created)**: Created public message object.
