import React, { useState, useEffect } from 'react';
import type { Ticket, TicketMessage, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { api } from '../services/api';
import { joinTicketRoom, leaveTicketRoom, getSocket } from '../services/socket';
import {
  ArrowLeft,
  Sparkles,
  Bot,
  Send,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  User,
  Save,
  MessageSquare,
  BookOpen
} from 'lucide-react';

interface AdminTicketDetailProps {
  ticketId: string;
  onBack: () => void;
  onRefreshQueue: () => void;
}

const CATEGORIES: TicketCategory[] = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

const PRIORITIES: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Waiting on Author', 'Resolved', 'Closed'];

export const AdminTicketDetail: React.FC<AdminTicketDetailProps> = ({
  ticketId,
  onBack,
  onRefreshQueue
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Triage state
  const [category, setCategory] = useState<TicketCategory>('General Inquiry');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [status, setStatus] = useState<TicketStatus>('Open');
  const [savingTriage, setSavingTriage] = useState(false);
  const [triageSuccess, setTriageSuccess] = useState(false);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Internal Note state
  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Load ticket details
  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTicketDetail(ticketId);
      setTicket(res.ticket);
      setMessages(res.messages);
      setCategory(res.ticket.category);
      setPriority(res.ticket.priority);
      setStatus(res.ticket.status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    joinTicketRoom(ticketId);
    fetchTicket();

    const socket = getSocket();
    const handleMessageCreated = (msg: TicketMessage) => {
      if (msg.ticketId === ticketId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      if (updatedTicket._id === ticketId) {
        setTicket(updatedTicket);
        setCategory(updatedTicket.category);
        setPriority(updatedTicket.priority);
        setStatus(updatedTicket.status);
      }
    };

    socket.on('message:created', handleMessageCreated);
    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      leaveTicketRoom(ticketId);
      socket.off('message:created', handleMessageCreated);
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [ticketId]);

  // Handle Triage Update
  const handleSaveTriage = async () => {
    try {
      setSavingTriage(true);
      setError(null);
      const updated = await api.updateAdminTicket(ticketId, {
        category,
        priority,
        status
      });
      setTicket(updated);
      setTriageSuccess(true);
      setTimeout(() => setTriageSuccess(false), 2500);
      onRefreshQueue();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket triage.');
    } finally {
      setSavingTriage(false);
    }
  };

  // Handle Generate AI Draft
  const handleGenerateAIDraft = async () => {
    try {
      setGeneratingDraft(true);
      setError(null);
      const res = await api.generateAIDraft(ticketId);
      setReplyBody(res.draft);
      setDraftGenerated(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not generate AI draft.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Handle Send Public Reply (Explicit admin send)
  const handleSendPublicReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    try {
      setSendingReply(true);
      setError(null);
      const newMsg = await api.sendAdminResponse(ticketId, replyBody.trim());
      setMessages((prev) => [...prev, newMsg]);
      setReplyBody('');
      setDraftGenerated(false);
      if (ticket && ticket.status === 'Open') {
        setStatus('In Progress');
      }
      onRefreshQueue();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle Add Internal Note
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;

    try {
      setSavingNote(true);
      setError(null);
      const newNote = await api.addAdminNote(ticketId, noteBody.trim());
      setMessages((prev) => [...prev, newNote]);
      setNoteBody('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save internal note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <div className="pulsing-dot" style={{ background: '#d97706', width: 14, height: 14, marginBottom: 12 }} />
        <div>Loading admin ticket workspace...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
        <h3>Ticket not found</h3>
        <button onClick={onBack} style={{ marginTop: 12, padding: '8px 16px', cursor: 'pointer' }}>
          Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Top back button */}
      <button
        id="admin-back-btn"
        onClick={onBack}
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
        <span>Back to Triage Queue</span>
      </button>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: 10,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Ticket Details (Left 7 cols) & Triage Control Panel (Right 5 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Ticket conversation & editor */}
        <div>
          {/* Ticket Header Box */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1.5px solid #e2e8f0',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
                #{ticket._id.slice(-6).toUpperCase()}
              </span>
              <span className="badge badge-med">{ticket.category}</span>
              <span className={`badge ${ticket.priority === 'Critical' ? 'badge-crit' : ticket.priority === 'High' ? 'badge-high' : 'badge-med'}`}>
                {ticket.priority} Priority
              </span>
              <span className={`badge ${
                ticket.status === 'Open' ? 'badge-status-open' :
                ticket.status === 'In Progress' ? 'badge-status-progress' :
                ticket.status === 'Waiting on Author' ? 'badge-status-waiting' :
                'badge-status-resolved'
              }`}>
                {ticket.status}
              </span>
            </div>

            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 8
            }}>
              {ticket.subject}
            </h2>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: '#64748b',
              paddingTop: 8,
              borderTop: '1px solid #f1f5f9'
            }}>
              <span>Author: <strong>{ticket.authorId}</strong></span>
              <span>•</span>
              <span>Book: <strong>{ticket.bookId || 'General / Account Level'}</strong></span>
              <span>•</span>
              <span>Received {new Date(ticket.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Conversation Stream (Both public messages & private internal notes) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {/* Original author ticket query */}
            <div style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1.5px solid #e2e8f0',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#e6f4ef',
                  color: '#0f3d2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 12
                }}>
                  {ticket.authorId.slice(0, 4)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    Author Initial Inquiry ({ticket.authorId})
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(ticket.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {ticket.description}
              </div>
            </div>

            {/* Subsequent messages */}
            {messages.map((msg) => {
              const isInternal = msg.visibility === 'internal';
              const isAdmin = msg.senderRole === 'admin';

              if (isInternal) {
                return (
                  <div
                    key={msg._id}
                    id={`internal-note-${msg._id}`}
                    style={{
                      background: '#fffdf5',
                      border: '1.5px dashed #f59e0b',
                      borderRadius: 12,
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b45309', fontWeight: 700, fontSize: 12 }}>
                        <Lock size={13} />
                        <span>PRIVATE INTERNAL NOTE (NOT VISIBLE TO AUTHOR)</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(msg.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {msg.body}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg._id}
                  style={{
                    background: isAdmin ? '#f0fdf4' : '#ffffff',
                    border: isAdmin ? '1.5px solid #bbf7d0' : '1.5px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '18px 20px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: isAdmin ? '#0f3d2e' : '#e6f4ef',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12
                    }}>
                      {isAdmin ? 'BL' : 'AU'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {isAdmin ? 'Public Reply from Staff' : `Author (${ticket.authorId})`}
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

          {/* AI Draft & Admin Reply Workspace */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1.5px solid #e2e8f0',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} color="#0f3d2e" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Compose Staff Response
                </h3>
              </div>

              {/* AI Draft Trigger Button */}
              <button
                id="generate-ai-draft-btn"
                type="button"
                onClick={handleGenerateAIDraft}
                disabled={generatingDraft}
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #ede9fe 100%)',
                  border: '1.5px solid #c7d2fe',
                  color: '#4338ca',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: generatingDraft ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 3px rgba(67, 56, 202, 0.1)'
                }}
              >
                <Sparkles size={14} color="#6366f1" />
                <span>{generatingDraft ? 'Generating Policy-Grounded Draft...' : 'Generate AI Draft Reply'}</span>
              </button>
            </div>

            {/* AI Policy Reminder Banner */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: '#64748b',
              marginBottom: 14
            }}>
              🛡️ <strong>Safety rule:</strong> AI only drafts based on BookLeaf Knowledge Base facts. You must review and edit the draft before clicking "Send Public Reply". Auto-send is strictly disabled.
            </div>

            {draftGenerated && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <CheckCircle size={14} color="#10b981" />
                <span>AI draft generated based on Knowledge Base facts. Review or edit below before sending.</span>
              </div>
            )}

            <form onSubmit={handleSendPublicReply}>
              <textarea
                id="admin-reply-textarea"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={6}
                placeholder="Draft or edit public response to author..."
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
                  id="send-admin-response-btn"
                  type="submit"
                  disabled={sendingReply || !replyBody.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #0f3d2e 0%, #165641 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 22px',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: sendingReply ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(15, 61, 46, 0.3)'
                  }}
                >
                  <Send size={14} />
                  <span>{sendingReply ? 'Sending Reply...' : 'Send Public Reply to Author'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Private Internal Note Form */}
          <div style={{
            background: '#fffdf5',
            borderRadius: 16,
            border: '1.5px dashed #f59e0b',
            padding: '22px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#b45309' }}>
              <Lock size={16} />
              <h4 style={{ fontSize: 15, fontWeight: 700 }}>Add Private Internal Note</h4>
            </div>
            <p style={{ fontSize: 12, color: '#92400e', marginBottom: 12 }}>
              Internal notes are only visible to BookLeaf team members and are never sent to the author or returned in author APIs.
            </p>

            <form onSubmit={handleAddInternalNote}>
              <textarea
                id="admin-internal-note-textarea"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                placeholder="Log internal investigation findings, print partner status, bank verification reference..."
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #fed7aa',
                  background: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: 12
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  id="save-internal-note-btn"
                  type="submit"
                  disabled={savingNote || !noteBody.trim()}
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: savingNote ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Lock size={13} />
                  <span>{savingNote ? 'Saving Note...' : 'Save Private Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Triage Control Panel */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1.5px solid #e2e8f0',
          padding: '24px',
          boxShadow: 'var(--shadow-md)',
          position: 'sticky',
          top: 90
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: 14,
            marginBottom: 20
          }}>
            <Shield size={18} color="#0f3d2e" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Triage Control Panel
            </h3>
          </div>

          {triageSuccess && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16
            }}>
              <CheckCircle size={14} color="#10b981" />
              <span>Triage updates saved and broadcast!</span>
            </div>
          )}

          {/* Category Dropdown */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                Category
              </label>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Source: <strong>{ticket.categorySource}</strong>
              </span>
            </div>
            <select
              id="triage-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
                fontSize: 13,
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                Priority Level
              </label>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Source: <strong>{ticket.prioritySource}</strong>
              </span>
            </div>
            <select
              id="triage-priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
                fontSize: 13,
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Ticket Status
            </label>
            <select
              id="triage-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
                fontSize: 13,
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Save Triage Button */}
          <button
            id="save-triage-btn"
            type="button"
            onClick={handleSaveTriage}
            disabled={savingTriage}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #0f3d2e 0%, #165641 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: savingTriage ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(15, 61, 46, 0.25)'
            }}
          >
            <Save size={15} />
            <span>{savingTriage ? 'Saving...' : 'Apply Triage Updates'}</span>
          </button>

          {/* Knowledge Base Reference Card */}
          <div style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
              Active Knowledge Policy
            </div>
            <div style={{
              background: '#f8fafc',
              borderRadius: 8,
              padding: '12px',
              fontSize: 12,
              color: '#475569',
              lineHeight: 1.5
            }}>
              <strong>{category}:</strong> Policies from BookLeaf Knowledge Base are automatically loaded when generating AI draft responses for this category.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
