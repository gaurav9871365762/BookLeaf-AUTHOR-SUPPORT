import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/config/db";
import { Author } from "../src/models/Author";
import { Book } from "../src/models/Book";
import { User } from "../src/models/User";
import { z } from "zod";

const nullableText = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();
const nullableDate = z.string().nullable().optional();

const sampleSchema = z.object({
  authors: z.array(z.object({
    author_id: z.string().min(1),
    name: z.string().min(1),
    email: z.email(),
    phone: nullableText,
    city: nullableText,
    joined_date: nullableDate,
    books: z.array(z.object({
      book_id: z.string().min(1),
      title: z.string().min(1),
      isbn: nullableText,
      genre: nullableText,
      publication_date: nullableDate,
      status: z.string().min(1),
      mrp: nullableNumber,
      author_royalty_per_copy: nullableNumber,
      copies_sold: z.number().nonnegative().optional(),
      total_copies_sold: z.number().nonnegative().optional(),
      royalty_earned: z.number().nonnegative().optional(),
      total_royalty_earned: z.number().nonnegative().optional(),
      royalty_paid: z.number().nonnegative().optional(),
      royalty_pending: z.number().nonnegative().optional(),
      last_payout_date: nullableDate,
      last_royalty_payout_date: nullableDate,
      print_partner: nullableText,
      available_on: z.array(z.string()).optional()
    }))
  }))
});

function dateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date in sample.json: ${value}`);
  }
  return parsed;
}

async function seed(): Promise<void> {
  const samplePath = resolve(__dirname, "../data/sample.json");
  const source = JSON.parse(await readFile(samplePath, "utf8")) as unknown;
  const parsed = sampleSchema.parse(source);
  if (parsed.authors.length === 0) {
    throw new Error("No authors found in server/data/sample.json. Add the supplied sample dataset before running the seed script.");
  }

  const adminName = process.env.ADMIN_NAME?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authorPassword = process.env.DEMO_AUTHOR_PASSWORD;
  if (!adminName || !adminEmail || !adminPassword || !authorPassword) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, and DEMO_AUTHOR_PASSWORD before seeding.");
  }
  if (adminPassword.length < 12 || authorPassword.length < 12) {
    throw new Error("Seed passwords must be at least 12 characters long.");
  }

  await connectToDatabase();
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await User.updateOne(
    { email: adminEmail },
    { $set: { name: adminName, email: adminEmail, passwordHash: adminHash, role: "admin", authorId: null, isActive: true } },
    { upsert: true }
  );

  const authorHash = await bcrypt.hash(authorPassword, 12);
  let bookCount = 0;
  for (const input of parsed.authors) {
    const authorId = input.author_id.trim();
    const email = input.email.trim().toLowerCase();

    await Author.updateOne(
      { authorId },
      {
        $set: {
          authorId,
          name: input.name.trim(),
          email,
          phone: input.phone ?? null,
          city: input.city ?? null,
          joinedDate: dateOrNull(input.joined_date)
        }
      },
      { upsert: true }
    );
    await User.updateOne(
      { email },
      {
        $set: {
          name: input.name.trim(),
          email,
          passwordHash: authorHash,
          role: "author",
          authorId,
          isActive: true
        }
      },
      { upsert: true }
    );

    for (const book of input.books) {
      await Book.updateOne(
        { bookId: book.book_id },
        {
          $set: {
            bookId: book.book_id,
            authorId,
            title: book.title.trim(),
            isbn: book.isbn ?? null,
            genre: book.genre ?? null,
            publicationDate: dateOrNull(book.publication_date),
            status: book.status,
            mrp: book.mrp ?? null,
            authorRoyaltyPerCopy: book.author_royalty_per_copy ?? null,
            copiesSold: book.total_copies_sold ?? book.copies_sold ?? 0,
            royaltyEarned: book.total_royalty_earned ?? book.royalty_earned ?? 0,
            royaltyPaid: book.royalty_paid ?? 0,
            royaltyPending: book.royalty_pending ?? 0,
            lastPayoutDate: dateOrNull(book.last_royalty_payout_date ?? book.last_payout_date),
            printPartner: book.print_partner ?? null,
            availableOn: book.available_on ?? []
          }
        },
        { upsert: true }
      );
      bookCount += 1;
    }
  }

  console.info(`Seed complete: ${parsed.authors.length} authors, ${bookCount} books, and 1 admin account.`);
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
