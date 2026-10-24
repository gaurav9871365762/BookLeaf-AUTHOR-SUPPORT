import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["author", "admin"], required: true },
    authorId: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export type UserRecord = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
