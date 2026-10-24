export interface User {
  id: string;
  name: string;
  email: string;
  role: 'author' | 'admin';
  authorId: string | null;
}

export interface Book {
  _id: string;
  bookId: string;
  authorId: string;
  title: string;
  isbn: string | null;
  genre: string | null;
  publicationDate: string | null;
  status: string;
  mrp: number | null;
  authorRoyaltyPerCopy: number | null;
  copiesSold: number;
  royaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastPayoutDate: string | null;
  printPartner: string | null;
  availableOn: string[];
}

export type TicketCategory =
  | 'Royalty & Payments'
  | 'ISBN & Metadata Issues'
  | 'Printing & Quality'
  | 'Distribution & Availability'
  | 'Book Status & Production Updates'
  | 'General Inquiry';

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TicketStatus = 'Open' | 'In Progress' | 'Waiting on Author' | 'Resolved' | 'Closed';

export interface Ticket {
  _id: string;
  authorId: string;
  bookId: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  categorySource: 'ai' | 'admin' | 'default';
  priority: TicketPriority;
  prioritySource: 'ai' | 'admin' | 'default';
  status: TicketStatus;
  assignedAdminId: string | null;
  aiSuggestionAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  _id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'author' | 'admin';
  body: string;
  visibility: 'public' | 'internal';
  createdAt: string;
}

export interface TicketDetailResponse {
  ticket: Ticket;
  messages: TicketMessage[];
}
