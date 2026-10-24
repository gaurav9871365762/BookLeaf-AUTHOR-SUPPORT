import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { Book } from "../models/Book";
import { getCurrentUser } from "../middleware/auth";
import { AppError } from "../utils/errors";
import { sendSuccess } from "../utils/response";

const router = Router();

router.get("/", requireAuth, async (request, response) => {
  const user = getCurrentUser(request);
  if (user.role === "author" && !user.authorId) {
    throw new AppError(403, "AUTHOR_PROFILE_MISSING", "This account is not linked to an author profile.");
  }

  const filter = user.role === "admin" ? {} : { authorId: user.authorId };
  const books = await Book.find(filter).sort({ title: 1 }).lean();
  sendSuccess(response, books);
});

export default router;
