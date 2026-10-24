import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/config/db";
import app from "../src/app";
import type { Server } from "node:http";

async function runTests() {
  await connectToDatabase();
  const server: Server = app.listen(5099);

  const BASE_URL = "http://127.0.0.1:5099/api";

  console.log("\n========================================================");
  console.log("   BOOKLEAF AUTHOR SUPPORT PORTAL - VERIFICATION SUITE   ");
  console.log("========================================================\n");

  try {
    // 1. Health Check
    console.log("1. Checking API Health...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    if (!healthJson.success || healthJson.data.status !== "ok") {
      throw new Error("Health check failed!");
    }
    console.log("   ✓ Health check passed: status ok");

    // Helper to log in and get cookie
    async function login(email: string, pass: string): Promise<string> {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      const cookie = res.headers.get("set-cookie");
      if (!res.ok || !cookie) {
        throw new Error(`Login failed for ${email}`);
      }
      return cookie.split(";")[0];
    }

    // 2. Auth & Login
    console.log("\n2. Testing Authentication & Session Cookie...");
    const authorACookie = await login("priya.sharma@email.com", "AuthorPassword123!");
    console.log("   ✓ Author A (Priya Sharma, AUTH001) logged in successfully.");

    const authorBCookie = await login("sneha.kulkarni@email.com", "AuthorPassword123!");
    console.log("   ✓ Author B (Sneha Kulkarni, AUTH007) logged in successfully.");

    const adminCookie = await login("admin@bookleaf.com", "AdminPassword123!");
    console.log("   ✓ Admin (admin@bookleaf.com) logged in successfully.");

    // 3. Role & Data Boundary Isolation Check
    console.log("\n3. Testing Role Boundaries (Author A cannot see Author B's books)...");
    const authorABooksRes = await fetch(`${BASE_URL}/books`, { headers: { Cookie: authorACookie } });
    const authorABooks = (await authorABooksRes.json()).data;
    console.log(`   ✓ Author A sees ${authorABooks.length} books: ${authorABooks.map((b: any) => b.bookId).join(", ")}`);

    if (authorABooks.some((b: any) => b.authorId !== "AUTH001")) {
      throw new Error("SECURITY VIOLATION: Author A saw books belonging to another author!");
    }

    const authorBBooksRes = await fetch(`${BASE_URL}/books`, { headers: { Cookie: authorBCookie } });
    const authorBBooks = (await authorBBooksRes.json()).data;
    console.log(`   ✓ Author B sees ${authorBBooks.length} books: ${authorBBooks.map((b: any) => b.bookId).join(", ")}`);

    if (authorBBooks.some((b: any) => b.authorId !== "AUTH007")) {
      throw new Error("SECURITY VIOLATION: Author B saw books belonging to another author!");
    }

    const adminBooksRes = await fetch(`${BASE_URL}/books`, { headers: { Cookie: adminCookie } });
    const adminBooks = (await adminBooksRes.json()).data;
    console.log(`   ✓ Admin sees complete catalog: ${adminBooks.length} books across all 10 authors.`);
    if (adminBooks.length !== 18) {
      throw new Error(`Expected 18 books in database, found ${adminBooks.length}`);
    }

    // 4. Ticket Creation with AI Triage
    console.log("\n4. Testing Ticket Creation with AI Classification & Priority...");
    const ticketCreateRes = await fetch(`${BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: authorACookie },
      body: JSON.stringify({
        bookId: "BK001",
        subject: "Delay in Q4 Royalty Payout for Whispers of the Ganges",
        description: "My royalty for Q4 seems pending even though sales are above ₹3,000 threshold. When will the payout be processed to my account?"
      })
    });

    const ticketCreateJson = await ticketCreateRes.json();
    if (!ticketCreateJson.success) {
      throw new Error(`Ticket creation failed: ${JSON.stringify(ticketCreateJson)}`);
    }

    const createdTicket = ticketCreateJson.data.ticket;
    console.log(`   ✓ Ticket created with ID: ${createdTicket._id}`);
    console.log(`   ✓ Author ID derived from session: ${createdTicket.authorId} (NOT from client request body!)`);
    console.log(`   ✓ AI Category Assigned: "${createdTicket.category}" (Source: ${createdTicket.categorySource})`);
    console.log(`   ✓ AI Priority Assigned: "${createdTicket.priority}" (Source: ${createdTicket.prioritySource})`);

    if (createdTicket.category !== "Royalty & Payments") {
      throw new Error(`Expected category "Royalty & Payments", got "${createdTicket.category}"`);
    }

    // 5. Internal Notes Boundary (Admin writes private note; Author CANNOT see it)
    console.log("\n5. Testing Security Boundary on Private Internal Notes...");
    const noteRes = await fetch(`${BASE_URL}/admin/tickets/${createdTicket._id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        body: "INTERNAL AUDIT NOTE: Finance team batch #902 processed yesterday. Roll-forward verification required."
      })
    });
    const noteJson = await noteRes.json();
    if (!noteJson.success || noteJson.data.visibility !== "internal") {
      throw new Error("Internal note creation failed!");
    }
    console.log("   ✓ Admin successfully saved private internal note.");

    // Admin inspects ticket detail
    const adminTicketDetailRes = await fetch(`${BASE_URL}/tickets/${createdTicket._id}`, { headers: { Cookie: adminCookie } });
    const adminTicketDetail = (await adminTicketDetailRes.json()).data;
    const adminSawInternal = adminTicketDetail.messages.some((m: any) => m.visibility === "internal");
    console.log(`   ✓ Admin view includes internal note: ${adminSawInternal}`);
    if (!adminSawInternal) {
      throw new Error("Admin should be able to view internal notes!");
    }

    // Author inspects ticket detail
    const authorTicketDetailRes = await fetch(`${BASE_URL}/tickets/${createdTicket._id}`, { headers: { Cookie: authorACookie } });
    const authorTicketDetail = (await authorTicketDetailRes.json()).data;
    const authorSawInternal = authorTicketDetail.messages.some((m: any) => m.visibility === "internal");
    console.log(`   ✓ Author view includes internal note: ${authorSawInternal} (MUST BE FALSE)`);
    if (authorSawInternal) {
      throw new Error("CRITICAL SECURITY VIOLATION: Internal note was exposed to the author!");
    }
    console.log("   ✓ Author view completely filtered on the server! Zero internal notes exposed.");

    // 6. AI Reply Drafting & Explicit Admin Send
    console.log("\n6. Testing AI Knowledge Base Reply Drafting & Explicit Admin Send...");
    const draftRes = await fetch(`${BASE_URL}/admin/tickets/${createdTicket._id}/draft-response`, {
      method: "POST",
      headers: { Cookie: adminCookie }
    });
    const draftJson = await draftRes.json();
    if (!draftJson.success || !draftJson.data.draft) {
      throw new Error("AI draft response failed!");
    }
    console.log("   ✓ AI generated policy-grounded draft reply (Snippet):");
    console.log(`     "${draftJson.data.draft.slice(0, 100).replace(/\n/g, ' ')}..."`);

    // Admin reviews and sends response
    const sendReplyRes = await fetch(`${BASE_URL}/admin/tickets/${createdTicket._id}/send-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        body: draftJson.data.draft
      })
    });
    const sendReplyJson = await sendReplyRes.json();
    if (!sendReplyJson.success) {
      throw new Error("Staff response failed to send!");
    }
    console.log("   ✓ Admin explicitly verified and sent the response.");

    // Author now sees the staff response
    const authorCheckRes = await fetch(`${BASE_URL}/tickets/${createdTicket._id}`, { headers: { Cookie: authorACookie } });
    const authorCheck = (await authorCheckRes.json()).data;
    const authorGotResponse = authorCheck.messages.some((m: any) => m.visibility === "public" && m.senderRole === "admin");
    console.log(`   ✓ Author received public staff response: ${authorGotResponse}`);
    if (!authorGotResponse) {
      throw new Error("Author should have received the public response!");
    }

    console.log("\n========================================================");
    console.log("   ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!    ");
    console.log("========================================================\n");
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("\n❌ Verification suite failed:", err);
  process.exit(1);
});
