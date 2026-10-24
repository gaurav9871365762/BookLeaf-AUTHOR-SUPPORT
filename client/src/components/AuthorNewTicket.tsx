import React, { useState, useEffect } from 'react';
import type { Book, Ticket } from '../types';
import { api } from '../services/api';
import { Send, Sparkles, CheckCircle2, AlertCircle, HelpCircle, BookOpen } from 'lucide-react';

interface AuthorNewTicketProps {
  books: Book[];
  initialBookId?: string | null;
  onTicketCreated: (ticket: Ticket) => void;
  onCancel: () => void;
}

export const AuthorNewTicket: React.FC<AuthorNewTicketProps> = ({
  books,
  initialBookId,
  onTicketCreated,
  onCancel
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ ticket: Ticket; aiSuggestionAvailable: boolean } | null>(null);

  useEffect(() => {
    if (initialBookId !== undefined) {
      setSelectedBookId(initialBookId || '');
    }
  }, [initialBookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject and a detailed description.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      // Notice: authorId is NEVER sent in the request body! The backend extracts it from the logged-in JWT session!
      const result = await api.createTicket({
        bookId: selectedBookId ? selectedBookId : null,
        subject: subject.trim(),
        description: description.trim()
      });

      setCreatedResult(result);

      // Auto redirect to ticket detail after brief moment to celebrate AI triage
      setTimeout(() => {
        onTicketCreated(result.ticket);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not submit ticket.');
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid #e2e8f0',
        padding: '32px',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 20, marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#e6f4ef',
            color: '#0f3d2e',
            fontSize: 12,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 6,
            marginBottom: 8
          }}>
            <Sparkles size={14} color="#10b981" />
            AI-Assisted Ticket Routing
          </div>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 24,
            fontWeight: 700,
            color: '#0f172a'
          }}>
            Submit Author Support Ticket
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Our support desk is integrated with real-time AI triage. Your ticket will be automatically classified into one of 6 core categories and routed to the appropriate publishing specialist.
          </p>
        </div>

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
            marginBottom: 20
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {createdResult ? (
          <div style={{
            background: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            borderRadius: 12,
            padding: '24px',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
              Ticket Created & AI-Triaged Successfully!
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '14px 0' }}>
              <span className="badge badge-med">
                Category: {createdResult.ticket.category}
              </span>
              <span className={`badge ${createdResult.ticket.priority === 'Critical' ? 'badge-crit' : createdResult.ticket.priority === 'High' ? 'badge-high' : 'badge-med'}`}>
                Priority: {createdResult.ticket.priority}
              </span>
              <span className="badge badge-ai">
                Auto-Triage Active
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#15803d' }}>
              Redirecting you to the ticket conversation thread...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Book Selector (Book dropdown with General / Account Level option) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Related Book (or Account Level)
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="ticket-book-select"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 14,
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">General / Account Level (No specific book attached)</option>
                  {books.map((b) => (
                    <option key={b.bookId} value={b.bookId}>
                      [{b.bookId}] {b.title} ({b.status})
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Choose a specific book from your author library, or leave as General / Account Level for payout, profile, or agreement inquiries.
              </p>
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  Subject
                </label>
                <span style={{ fontSize: 11, color: subject.length > 150 ? '#ef4444' : '#94a3b8' }}>
                  {subject.length}/160 characters
                </span>
              </div>
              <input
                id="ticket-subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary (e.g. Q4 Royalty Payout Delay, Print Quality Issue in Order #941)"
                maxLength={160}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  Detailed Description
                </label>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  Minimum 5 characters
                </span>
              </div>
              <textarea
                id="ticket-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Explain the issue thoroughly. Mention any relevant dates, order numbers, ISBNs, or questions..."
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              <div style={{
                marginTop: 8,
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                color: '#64748b'
              }}>
                💡 <strong>Tip for faster resolution:</strong> Include specific numbers (e.g. sales discrepancy, transaction IDs) or attach details. Our AI will draft a contextual reply for admin verification based on official BookLeaf policy.
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                id="submit-ticket-btn"
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #0f3d2e 0%, #165641 100%)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 61, 46, 0.3)'
                }}
              >
                <Send size={15} />
                <span>{submitting ? 'Submitting & Triaging with AI...' : 'Submit Support Ticket'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
