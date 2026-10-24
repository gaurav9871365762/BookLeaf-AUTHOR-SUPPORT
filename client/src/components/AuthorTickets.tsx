import React, { useState, useEffect } from 'react';
import type { Ticket, TicketMessage, Book } from '../types';
import { api } from '../services/api';
import { joinTicketRoom, leaveTicketRoom, getSocket } from '../services/socket';
import {
  MessageSquare,
  Clock,
  Send,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Bot,
  User as UserIcon,
  BookOpen
} from 'lucide-react';

interface AuthorTicketsProps {
  tickets: Ticket[];
  books: Book[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string | null) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const AuthorTickets: React.FC<AuthorTicketsProps> = ({
  tickets,
  books,
  selectedTicketId,
  onSelectTicket,
  onRefresh,
  loading
}) => {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load ticket details when selectedTicketId changes
  useEffect(() => {
    if (!selectedTicketId) {
      setActiveTicket(null);
      setMessages([]);
      return;
    }

    const loadDetail = async () => {
      try {
        setLoadingDetail(true);
        setError(null);
        joinTicketRoom(selectedTicketId);
        const res = await api.getTicketDetail(selectedTicketId);
        setActiveTicket(res.ticket);
        setMessages(res.messages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not load ticket conversation.');
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();

    return () => {
      leaveTicketRoom(selectedTicketId);
    };
  }, [selectedTicketId]);

  // Listen for real-time messages & ticket updates via socket
  useEffect(() => {
    const socket = getSocket();

    const handleMessageCreated = (newMsg: TicketMessage) => {
      if (selectedTicketId && newMsg.ticketId === selectedTicketId) {
        // Authors only receive public messages anyway, but verify visibility
        if (newMsg.visibility === 'public') {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
        }
      }
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      if (selectedTicketId && updatedTicket._id === selectedTicketId) {
        setActiveTicket(updatedTicket);
      }
      onRefresh();
    };

    socket.on('message:created', handleMessageCreated);
    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      socket.off('message:created', handleMessageCreated);
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [selectedTicketId, onRefresh]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      setSendingReply(true);
      setError(null);
      const newMsg = await api.sendAuthorMessage(selectedTicketId, replyText.trim());
      setMessages((prev) => [...prev, newMsg]);
      setReplyText('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSendingReply(false);
    }
  };

  const getBookTitle = (bookId: string | null) => {
    if (!bookId) return 'General / Account Query';
    const b = books.find((x) => x.bookId === bookId);
    return b ? `[${b.bookId}] ${b.title}` : `Book ID: ${bookId}`;
  };

  // If viewing a single ticket conversation
  if (selectedTicketId && activeTicket) {
    const isClosed = activeTicket.status === 'Closed' || activeTicket.status === 'Resolved';
    return (
      <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Back navigation */}
        <button
          id="back-to-tickets-btn"
          onClick={() => onSelectTicket(null)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#0f3d2e',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Tickets</span>
        </button>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        {/* Ticket Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
                  #{activeTicket._id.slice(-6).toUpperCase()}
                </span>
                <span className={`badge ${
                  activeTicket.status === 'Open' ? 'badge-status-open' :
                  activeTicket.status === 'In Progress' ? 'badge-status-progress' :
                  activeTicket.status === 'Waiting on Author' ? 'badge-status-waiting' :
                  'badge-status-resolved'
                }`}>
                  {activeTicket.status}
                </span>
                <span className="badge badge-med">
                  {activeTicket.category}
                </span>
                <span className={`badge ${
                  activeTicket.priority === 'Critical' ? 'badge-crit' :
                  activeTicket.priority === 'High' ? 'badge-high' :
                  'badge-med'
                }`}>
                  {activeTicket.priority} Priority
                </span>
              </div>

              <h2 style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 22,
                fontWeight: 700,
                color: '#0f172a'
              }}>
                {activeTicket.subject}
              </h2>

              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} />
                <span>{getBookTitle(activeTicket.bookId)}</span>
                <span>•</span>
                <span>Created {new Date(activeTicket.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {/* Initial Ticket Submission Message */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1.5px solid #e2e8f0',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#e6f4ef',
                color: '#0f3d2e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12
              }}>
                You
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Original Ticket Description</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(activeTicket.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {activeTicket.description}
            </div>
          </div>

          {/* Subsequent Messages */}
          {messages.map((msg) => {
            const isAdmin = msg.senderRole === 'admin';
            return (
              <div
                key={msg._id}
                style={{
                  background: isAdmin ? '#f0fdf4' : '#ffffff',
                  borderRadius: 14,
                  border: isAdmin ? '1.5px solid #bbf7d0' : '1.5px solid #e2e8f0',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isAdmin ? '#0f3d2e' : '#e6f4ef',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12
                  }}>
                    {isAdmin ? 'BL' : 'You'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{isAdmin ? 'BookLeaf Author Support' : 'You'}</span>
                      {isAdmin && (
                        <span style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          Verified Staff
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(msg.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.body}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Box */}
        {!isClosed ? (
          <form onSubmit={handleSendReply} style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              Send Follow-up Message
            </h4>
            <textarea
              id="author-reply-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Provide requested info, clarify your question, or confirm resolution..."
              rows={4}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                marginBottom: 14
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="send-author-reply-btn"
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #0f3d2e 0%, #165641 100%)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: sendingReply ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={14} />
                <span>{sendingReply ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: 12,
            padding: '16px',
            textAlign: 'center',
            fontSize: 13,
            color: '#64748b'
          }}>
            This ticket has been marked as <strong>{activeTicket.status}</strong>. If you still have questions, please submit a new ticket.
          </div>
        )}
      </div>
    );
  }

  // Tickets List View
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: '#0f172a'
          }}>
            My Support Tickets ({tickets.length})
          </h3>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Real-time status of all inquiries submitted under your author account.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div className="pulsing-dot" style={{ background: '#10b981', width: 14, height: 14, marginBottom: 12 }} />
          <div>Loading your tickets...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0'
        }}>
          <MessageSquare size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
          <h4 style={{ fontSize: 16, color: '#334155' }}>No Support Tickets Found</h4>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            You haven't submitted any tickets yet. Need help with royalties, printing, or ISBN?
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              id={`ticket-row-${ticket._id}`}
              onClick={() => onSelectTicket(ticket._id)}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1.5px solid #e2e8f0',
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
                    #{ticket._id.slice(-6).toUpperCase()}
                  </span>
                  <span className="badge badge-med">{ticket.category}</span>
                  <span className={`badge ${ticket.priority === 'Critical' ? 'badge-crit' : ticket.priority === 'High' ? 'badge-high' : 'badge-med'}`}>
                    {ticket.priority}
                  </span>
                </div>

                <h4 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: 4
                }}>
                  {ticket.subject}
                </h4>

                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{getBookTitle(ticket.bookId)}</span>
                  <span>•</span>
                  <span>Updated {new Date(ticket.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`badge ${
                  ticket.status === 'Open' ? 'badge-status-open' :
                  ticket.status === 'In Progress' ? 'badge-status-progress' :
                  ticket.status === 'Waiting on Author' ? 'badge-status-waiting' :
                  'badge-status-resolved'
                }`}>
                  {ticket.status}
                </span>

                <button
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f3d2e',
                    cursor: 'pointer'
                  }}
                >
                  View Conversation →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
