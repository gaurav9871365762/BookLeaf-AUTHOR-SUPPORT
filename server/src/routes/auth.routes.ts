import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import { getCurrentUser, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { AppError } from "../utils/errors";
import { sendSuccess } from "../utils/response";

const router = Router();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200)
});

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

router.post("/login", validateBody(loginSchema), async (request, response) => {
  const email = String(request.body.email).trim().toLowerCase();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.isActive || !(await bcrypt.compare(request.body.password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const token = jwt.sign(
    { role: user.role },
    jwtSecret(),
    { subject: String(user._id), expiresIn: "1d" }
  );
  response.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/"
  });

  sendSuccess(response, {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      authorId: user.authorId
    }
  });
});

router.post("/logout", (_request, response) => {
  response.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  sendSuccess(response, { message: "Signed out." });
});

router.get("/me", requireAuth, (request, response) => {
  sendSuccess(response, getCurrentUser(request));
});

export default router;
