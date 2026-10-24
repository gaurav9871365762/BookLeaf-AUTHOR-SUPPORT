import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { User } from "../models/User";

export type AppRole = "author" | "admin";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  authorId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = request.cookies?.accessToken ??
    (request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.slice("Bearer ".length)
      : undefined);

  if (!token) {
    response.status(401).json({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." }
    });
    return;
  }

  let payload: JwtPayload;
  try {
    const verified = jwt.verify(token, getJwtSecret());
    if (typeof verified === "string" || !verified.sub) {
      response.status(401).json({
        success: false,
        error: { code: "INVALID_SESSION", message: "Your session is invalid. Please sign in again." }
      });
      return;
    }
    payload = verified;
  } catch {
    response.status(401).json({
      success: false,
      error: { code: "INVALID_SESSION", message: "Your session is invalid or expired. Please sign in again." }
    });
    return;
  }

  const user = await User.findById(payload.sub).select("name email role authorId isActive");
  if (!user || !user.isActive) {
    response.status(401).json({
      success: false,
      error: { code: "INVALID_SESSION", message: "Your account is unavailable. Please sign in again." }
    });
    return;
  }

  request.user = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as AppRole,
    authorId: user.authorId ?? null
  };
  next();
};

export function requireRole(...roles: AppRole[]): RequestHandler {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      response.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." }
      });
      return;
    }
    next();
  };
}

export function getCurrentUser(request: Express.Request): AuthenticatedUser {
  if (!request.user) {
    throw new Error("Authenticated user context is missing.");
  }
  return request.user;
}
