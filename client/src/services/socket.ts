import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('Real-time socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Real-time socket disconnected.');
    });
  }
  return socket;
}

export function joinTicketRoom(ticketId: string): void {
  const s = getSocket();
  s.emit('join:ticket', ticketId);
}

export function leaveTicketRoom(ticketId: string): void {
  const s = getSocket();
  s.emit('leave:ticket', ticketId);
}

export function joinAdminRoom(): void {
  const s = getSocket();
  s.emit('join:admin');
}

export function joinAuthorRoom(authorId: string): void {
  const s = getSocket();
  s.emit('join:author', authorId);
}
