import type { User, Book, Ticket, TicketMessage, TicketDetailResponse } from '../types';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // include HttpOnly JWT cookie
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data;
}

export const api = {
  async login(email: string, password: string): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST'
    });
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  async getBooks(): Promise<Book[]> {
    return request<Book[]>('/books');
  },

  async getTickets(): Promise<Ticket[]> {
    return request<Ticket[]>('/tickets');
  },

  async createTicket(payload: { bookId?: string | null; subject: string; description: string }): Promise<{
    ticket: Ticket;
    aiSuggestionAvailable: boolean;
  }> {
    return request<{ ticket: Ticket; aiSuggestionAvailable: boolean }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getTicketDetail(ticketId: string): Promise<TicketDetailResponse> {
    return request<TicketDetailResponse>(`/tickets/${ticketId}`);
  },

  async sendAuthorMessage(ticketId: string, body: string): Promise<TicketMessage> {
    return request<TicketMessage>(`/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  },

  async getAdminTickets(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    sort?: string;
  }): Promise<Ticket[]> {
    const query = new URLSearchParams();
    if (filters?.status) query.set('status', filters.status);
    if (filters?.category) query.set('category', filters.category);
    if (filters?.priority) query.set('priority', filters.priority);
    if (filters?.sort) query.set('sort', filters.sort);

    const queryString = query.toString();
    return request<Ticket[]>(`/admin/tickets${queryString ? `?${queryString}` : ''}`);
  },

  async updateAdminTicket(
    ticketId: string,
    updates: {
      status?: string;
      category?: string;
      priority?: string;
      assignedAdminId?: string | null;
    }
  ): Promise<Ticket> {
    return request<Ticket>(`/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async addAdminNote(ticketId: string, body: string): Promise<TicketMessage> {
    return request<TicketMessage>(`/admin/tickets/${ticketId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  },

  async generateAIDraft(ticketId: string): Promise<{ draft: string }> {
    return request<{ draft: string }>(`/admin/tickets/${ticketId}/draft-response`, {
      method: 'POST'
    });
  },

  async sendAdminResponse(ticketId: string, body: string): Promise<TicketMessage> {
    return request<TicketMessage>(`/admin/tickets/${ticketId}/send-response`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  }
};
