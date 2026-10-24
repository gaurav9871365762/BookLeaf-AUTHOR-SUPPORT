import { Schema, model, type InferSchemaType } from "mongoose";

const authorSchema = new Schema(
  {
    authorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: null },
    city: { type: String, default: null },
    joinedDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export type AuthorRecord = InferSchemaType<typeof authorSchema>;
export const Author = model("Author", authorSchema);
