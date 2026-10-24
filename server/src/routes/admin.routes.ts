import { Router } from "express";
import { isValidObjectId, Types } from "mongoose";
import { z } from "zod";
import { getCurrentUser, requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { AIMeta } from "../models/AIMeta";
import { Ticket, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "../models/Ticket";
import { TicketMessage } from "../models/TicketMessage";
import { User } from "../models/User";
import { draftReply } from "../services/ai.service";
import { AppError } from "../utils/errors";
import { sendSuccess } from "../utils/response";
import { emitTicketUpdated, emitMessageCreated } from "../sockets";

const router = Router();
const updateTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedAdminId: z.string().nullable().optional()
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
const noteSchema = z.object({ body: z.string().trim().min(1).max(10000) });
const sendReplySchema = z.object({ body: z.string().trim().min(1).max(10000) });

function getTicketIdParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

async function findTicket(ticketId: string) {
  if (!isValidObjectId(ticketId)) {
    throw new AppError(400, "INVALID_ID", "The provided ticket ID is invalid.");
  }
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found.");
  }
  return ticket;
}

router.use(requireAuth, requireRole("admin"));

router.get("/tickets", async (request, response) => {
  const { status, category, priority, sort = "urgent" } = request.query;
  const filter: Record<string, unknown> = {};
  if (typeof status === "string") filter.status = z.enum(TICKET_STATUSES).parse(status);
  if (typeof category === "string") filter.category = z.enum(TICKET_CATEGORIES).parse(category);
  if (typeof priority === "string") filter.priority = z.enum(TICKET_PRIORITIES).parse(priority);

  const tickets = await Ticket.find(filter).sort({ createdAt: 1 }).limit(200).lean();
  if (sort !== "oldest") {
    const priorityRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    tickets.sort((left, right) =>
      priorityRank[right.priority] - priorityRank[left.priority] ||
      left.createdAt.getTime() - right.createdAt.getTime()
    );
  }
  sendSuccess(response, tickets);
});

router.patch("/tickets/:ticketId", validateBody(updateTicketSchema), async (request, response) => {
  const ticket = await findTicket(getTicketIdParam(request.params.ticketId));
  const updates = request.body as z.infer<typeof updateTicketSchema>;

  if (updates.assignedAdminId !== undefined && updates.assignedAdminId !== null) {
    if (!isValidObjectId(updates.assignedAdminId)) {
      throw new AppError(400, "INVALID_ADMIN_ID", "The assigned admin ID is invalid.");
    }
    const admin = await User.exists({ _id: updates.assignedAdminId, role: "admin", isActive: true });
    if (!admin) {
      throw new AppError(400, "INVALID_ADMIN", "Choose an active admin account.");
    }
  }

  if (updates.status) ticket.status = updates.status;
  if (updates.category) {
    ticket.category = updates.category;
    ticket.categorySource = "admin";
  }
  if (updates.priority) {
    ticket.priority = updates.priority;
    ticket.prioritySource = "admin";
  }
  if (updates.assignedAdminId !== undefined) {
    ticket.assignedAdminId = updates.assignedAdminId ? new Types.ObjectId(updates.assignedAdminId) : null;
  }

  await ticket.save();
  emitTicketUpdated(ticket, ticket.authorId, String(ticket._id));
  sendSuccess(response, ticket);
});

router.post("/tickets/:ticketId/notes", validateBody(noteSchema), async (request, response) => {
  const ticket = await findTicket(getTicketIdParam(request.params.ticketId));
  const user = getCurrentUser(request);
  const { body } = request.body as z.infer<typeof noteSchema>;
  const message = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user.id,
    senderRole: "admin",
    body,
    visibility: "internal"
  });
  emitMessageCreated(String(ticket._id), ticket.authorId, message);
  sendSuccess(response, message, 201);
});

router.post("/tickets/:ticketId/draft-response", async (request, response) => {
  const ticket = await findTicket(getTicketIdParam(request.params.ticketId));
  const result = await draftReply(ticket.subject, ticket.description, ticket.category);
  await AIMeta.create({
    ticketId: ticket._id,
    task: "draft",
    model: result.model,
    promptVersion: result.promptVersion,
    latencyMs: result.latencyMs,
    success: result.success,
    failureReason: result.success ? null : result.failureReason
  });

  if (!result.success) {
    throw new AppError(503, "AI_DRAFT_UNAVAILABLE", "AI could not generate a draft. You can still write and send a reply manually.");
  }
  sendSuccess(response, { draft: result.draft });
});

router.post("/tickets/:ticketId/send-response", validateBody(sendReplySchema), async (request, response) => {
  const ticket = await findTicket(getTicketIdParam(request.params.ticketId));
  const user = getCurrentUser(request);
  const { body } = request.body as z.infer<typeof sendReplySchema>;
  const message = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user.id,
    senderRole: "admin",
    body,
    visibility: "public"
  });
  if (ticket.status === "Open") ticket.status = "In Progress";
  await ticket.save();
  emitMessageCreated(String(ticket._id), ticket.authorId, message);
  emitTicketUpdated(ticket, ticket.authorId, String(ticket._id));
  sendSuccess(response, message, 201);
});

export default router;
