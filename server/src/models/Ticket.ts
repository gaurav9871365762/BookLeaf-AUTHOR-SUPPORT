import { Schema, model, type InferSchemaType } from "mongoose";

export const TICKET_CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry"
] as const;

export const TICKET_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export const TICKET_STATUSES = ["Open", "In Progress", "Waiting on Author", "Resolved", "Closed"] as const;

const ticketSchema = new Schema(
  {
    authorId: { type: String, required: true, index: true },
    bookId: { type: String, default: null, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    category: { type: String, enum: TICKET_CATEGORIES, default: "General Inquiry" },
    categorySource: { type: String, enum: ["ai", "admin", "default"], default: "default" },
    priority: { type: String, enum: TICKET_PRIORITIES, default: "Medium" },
    prioritySource: { type: String, enum: ["ai", "admin", "default"], default: "default" },
    status: { type: String, enum: TICKET_STATUSES, default: "Open", index: true },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    aiSuggestionAvailable: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1, priority: 1, createdAt: 1 });

export type TicketRecord = InferSchemaType<typeof ticketSchema>;
export const Ticket = model("Ticket", ticketSchema);
