import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { getCurrentUser, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { AIMeta } from "../models/AIMeta";
import { Book } from "../models/Book";
import { Ticket, TICKET_STATUSES } from "../models/Ticket";
import { TicketMessage } from "../models/TicketMessage";
import { classifyTicket } from "../services/ai.service";
import { AppError } from "../utils/errors";
import { sendSuccess } from "../utils/response";
import { emitTicketCreated, emitMessageCreated, emitTicketUpdated } from "../sockets";

const router = Router();
const createTicketSchema = z.object({
  bookId: z.string().trim().nullable().optional(),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(10000)
});
const createMessageSchema = z.object({ body: z.string().trim().min(1).max(10000) });

function getTicketIdParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

async function findAccessibleTicket(ticketId: string, authorId: string | null, isAdmin: boolean) {
  if (!isValidObjectId(ticketId)) {
    throw new AppError(400, "INVALID_ID", "The provided ticket ID is invalid.");
  }
  const ticket = await Ticket.findById(ticketId);
  if (!ticket || (!isAdmin && ticket.authorId !== authorId)) {
    throw new AppError(404, "TICKET_NOT_FOUND", "Ticket not found.");
  }
  return ticket;
}

router.use(requireAuth);

router.get("/", async (request, response) => {
  const user = getCurrentUser(request);
  const tickets = await Ticket.find(user.role === "admin" ? {} : { authorId: user.authorId })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();
  sendSuccess(response, tickets);
});

router.post("/", validateBody(createTicketSchema), async (request, response) => {
  const user = getCurrentUser(request);
  if (user.role !== "author" || !user.authorId) {
    throw new AppError(403, "AUTHOR_ONLY", "Only an author account can submit a ticket.");
  }

  const { bookId = null, subject, description } = request.body as z.infer<typeof createTicketSchema>;
  if (bookId) {
    const book = await Book.exists({ bookId, authorId: user.authorId });
    if (!book) {
      throw new AppError(400, "INVALID_BOOK", "Choose one of your books or submit this as a general account-level query.");
    }
  }

  const ticket = await Ticket.create({ authorId: user.authorId, bookId, subject, description });
  const classification = await classifyTicket(subject, description);

  if (classification.success) {
    ticket.category = classification.category as typeof ticket.category;
    ticket.categorySource = "ai";
    ticket.priority = classification.priority as typeof ticket.priority;
    ticket.prioritySource = "ai";
    ticket.aiSuggestionAvailable = true;
    await ticket.save();
  }

  await AIMeta.create({
    ticketId: ticket._id,
    task: "classification",
    model: classification.model,
    promptVersion: classification.promptVersion,
    confidence: classification.success ? classification.confidence : null,
    latencyMs: classification.latencyMs,
    success: classification.success,
    failureReason: classification.success ? null : classification.failureReason
  });

  emitTicketCreated(ticket, user.authorId);

  sendSuccess(response, {
    ticket,
    aiSuggestionAvailable: classification.success
  }, 201);
});

router.get("/:ticketId", async (request, response) => {
  const user = getCurrentUser(request);
  const ticket = await findAccessibleTicket(getTicketIdParam(request.params.ticketId), user.authorId, user.role === "admin");
  const messages = await TicketMessage.find({
    ticketId: ticket._id,
    ...(user.role === "admin" ? {} : { visibility: "public" })
  }).sort({ createdAt: 1 }).lean();
  sendSuccess(response, { ticket, messages });
});

router.post("/:ticketId/messages", validateBody(createMessageSchema), async (request, response) => {
  const user = getCurrentUser(request);
  const ticket = await findAccessibleTicket(getTicketIdParam(request.params.ticketId), user.authorId, user.role === "admin");
  const { body } = request.body as z.infer<typeof createMessageSchema>;
  const message = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user.id,
    senderRole: user.role,
    body,
    visibility: "public"
  });

  if (user.role === "admin" && ticket.status === "Open") {
    ticket.status = TICKET_STATUSES[1];
    await ticket.save();
    emitTicketUpdated(ticket, ticket.authorId, String(ticket._id));
  }
  emitMessageCreated(String(ticket._id), ticket.authorId, message);
  sendSuccess(response, message, 201);
});

export default router;
