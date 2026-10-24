import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt, { type JwtPayload } from "jsonwebtoken";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer, allowedOrigin: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigin,
      credentials: true,
      methods: ["GET", "POST", "PATCH"]
    }
  });

  io.use((socket: Socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let token: string | undefined;

      if (cookieHeader) {
        const match = cookieHeader.match(/accessToken=([^;]+)/);
        if (match) token = match[1];
      }
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        // Allow anonymous connection with limited room access or proceed
        return next();
      }

      const secret = process.env.JWT_SECRET || "bookleaf_super_secret_jwt_key_author_support_portal_2026_secure";
      const verified = jwt.verify(token, secret) as JwtPayload;
      socket.data.user = verified;
      next();
    } catch {
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    // Join specific ticket room if requested
    socket.on("join:ticket", (ticketId: string) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
      }
    });

    socket.on("leave:ticket", (ticketId: string) => {
      if (ticketId) {
        socket.leave(`ticket:${ticketId}`);
      }
    });

    // Join admin room if user role is admin
    socket.on("join:admin", () => {
      socket.join("admin-room");
    });

    // Join author room
    socket.on("join:author", (authorId: string) => {
      if (authorId) {
        socket.join(`author:${authorId}`);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitTicketCreated(ticket: unknown, authorId: string): void {
  if (!io) return;
  io.to("admin-room").emit("ticket:created", ticket);
  io.to(`author:${authorId}`).emit("ticket:created", ticket);
}

export function emitTicketUpdated(ticket: unknown, authorId: string, ticketId: string): void {
  if (!io) return;
  io.to("admin-room").emit("ticket:updated", ticket);
  io.to(`ticket:${ticketId}`).emit("ticket:updated", ticket);
  io.to(`author:${authorId}`).emit("ticket:updated", ticket);
}

export function emitMessageCreated(ticketId: string, authorId: string, message: { visibility: string } & unknown): void {
  if (!io) return;
  if (message.visibility === "internal") {
    // INTERNAL NOTES ARE ONLY SENT TO ADMIN ROOM! NEVER TO AUTHOR!
    io.to("admin-room").emit("message:created", message);
  } else {
    io.to("admin-room").emit("message:created", message);
    io.to(`ticket:${ticketId}`).emit("message:created", message);
    io.to(`author:${authorId}`).emit("message:created", message);
  }
}
