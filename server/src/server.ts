import "dotenv/config";
import http from "node:http";
import app from "./app";
import { connectToDatabase } from "./config/db";
import { initSocketServer } from "./sockets";

async function startServer(): Promise<void> {
  const port = Number(process.env.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }

  await connectToDatabase();
  const httpServer = http.createServer(app);
  const allowedOrigin = process.env.FRONTEND_URL ?? "http://localhost:5173";
  initSocketServer(httpServer, allowedOrigin);

  httpServer.listen(port, () => {
    console.info(`BookLeaf API listening on port ${port}.`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Could not start the BookLeaf API:", error);
  process.exitCode = 1;
});
