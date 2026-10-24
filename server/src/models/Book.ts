import { Schema, model, type InferSchemaType } from "mongoose";

const bookSchema = new Schema(
  {
    bookId: { type: String, required: true, unique: true, index: true },
    authorId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    isbn: { type: String, default: null },
    genre: { type: String, default: null },
    publicationDate: { type: Date, default: null },
    status: { type: String, required: true },
    mrp: { type: Number, default: null },
    authorRoyaltyPerCopy: { type: Number, default: null },
    copiesSold: { type: Number, default: 0 },
    royaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    lastPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] }
  },
  { timestamps: true }
);

bookSchema.index({ authorId: 1, bookId: 1 });

export type BookRecord = InferSchemaType<typeof bookSchema>;
export const Book = model("Book", bookSchema);
