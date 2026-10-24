import { Schema, model, type InferSchemaType } from "mongoose";

const ticketMessageSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["author", "admin"], required: true },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    visibility: { type: String, enum: ["public", "internal"], default: "public", index: true }
  },
  { timestamps: true }
);

export type TicketMessageRecord = InferSchemaType<typeof ticketMessageSchema>;
export const TicketMessage = model("TicketMessage", ticketMessageSchema);
