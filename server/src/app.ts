import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import booksRoutes from "./routes/books.routes";
import ticketsRoutes from "./routes/tickets.routes";
import { AppError, errorHandler } from "./utils/errors";
import { sendSuccess } from "./utils/response";

const app = express();
const allowedOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  sendSuccess(response, { status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/admin", adminRoutes);
app.use((_request, _response, next) => next(new AppError(404, "NOT_FOUND", "Route not found.")));
app.use(errorHandler);

export default app;
