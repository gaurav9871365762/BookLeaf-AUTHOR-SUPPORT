import { Schema, model, type InferSchemaType } from "mongoose";

const aiMetaSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    task: { type: String, enum: ["classification", "draft"], required: true },
    model: { type: String, default: null },
    promptVersion: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: null },
    latencyMs: { type: Number, required: true },
    success: { type: Boolean, required: true },
    failureReason: { type: String, default: null }
  },
  { timestamps: true }
);

export type AIMetaRecord = InferSchemaType<typeof aiMetaSchema>;
export const AIMeta = model("AIMeta", aiMetaSchema);
