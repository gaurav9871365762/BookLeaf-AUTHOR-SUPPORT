import React, { useState } from 'react';
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import {
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  Sparkles,
  Bot,
  User,
  CheckCircle,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';

interface AdminQueueProps {
  tickets: Ticket[];
  loading: boolean;
  onSelectTicket: (ticketId: string) => void;
  onRefresh: () => void;
  filters: {
    status: string;
    category: string;
    priority: string;
    sort: string;
  };
  onFilterChange: (key: string, value: string) => void;
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

export const AdminQueue: React.FC<AdminQueueProps> = ({
  tickets,
  loading,
  onSelectTicket,
  onRefresh,
  filters,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Quick stats
  const totalCount = tickets.length;
  const criticalCount = tickets.filter((t) => t.priority === 'Critical').length;
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const aiClassifiedCount = tickets.filter((t) => t.categorySource === 'ai').length;

  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.subject.toLowerCase().includes(term) ||
      t.authorId.toLowerCase().includes(term) ||
      (t.bookId && t.bookId.toLowerCase().includes(term)) ||
      t.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="animate-fade-in">
      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Total in Queue</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {totalCount}
          </div>
        </div>

        <div style={{
          background: '#fef2f2',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1.5px solid #fecaca',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulsing-dot" style={{ background: '#ef4444' }} />
            Critical Urgency
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#991b1b', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {criticalCount}
          </div>
        </div>

        <div style={{
          background: '#ecfdf5',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #a7f3d0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#047857' }}>Open & Unresolved</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#065f46', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {openCount}
          </div>
        </div>

        <div style={{
          background: '#eff6ff',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #bfdbfe',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={13} color="#2563eb" />
            AI-Categorized
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1e3a8a', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {aiClassifiedCount}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        padding: '18px 20px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 240, flex: 1 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            id="admin-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by author ID, subject, book..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              outline: 'none'
            }}
          />
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            id="filter-category-select"
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="">All Categories (6)</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            id="filter-priority-select"
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            id="filter-sort-select"
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="urgent">Urgency Ranked (Critical First)</option>
            <option value="oldest">Oldest First (FIFO)</option>
          </select>

          {/* Refresh button */}
          <button
            id="refresh-queue-btn"
            onClick={onRefresh}
            title="Refresh queue"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#475569'
            }}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div className="pulsing-dot" style={{ background: '#d97706', width: 14, height: 14, marginBottom: 12 }} />
          <div>Refreshing triage queue...</div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0'
        }}>
          <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: 16, color: '#0f172a' }}>No Tickets Match the Selected Criteria</h4>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            All author tickets in this view have been triaged or cleared.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredTickets.map((ticket) => {
            const isCritical = ticket.priority === 'Critical';
            const isHigh = ticket.priority === 'High';

            return (
              <div
                key={ticket._id}
                id={`admin-ticket-row-${ticket._id}`}
                onClick={() => onSelectTicket(ticket._id)}
                style={{
                  background: isCritical ? '#fffdfd' : '#ffffff',
                  borderRadius: 14,
                  border: isCritical ? '2px solid #ef4444' : isHigh ? '1.5px solid #f97316' : '1.5px solid #e2e8f0',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  cursor: 'pointer',
                  boxShadow: isCritical ? '0 4px 12px rgba(239, 68, 68, 0.12)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = isCritical ? '0 4px 12px rgba(239, 68, 68, 0.12)' : 'var(--shadow-sm)';
                }}
              >
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    {/* Urgency indicator */}
                    {isCritical && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: '0.04em'
                      }}>
                        <span className="pulsing-dot" style={{ background: '#ffffff', width: 6, height: 6 }} />
                        URGENT
                      </span>
                    )}

                    <span style={{
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      background: '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: 4,
                      color: '#475569'
                    }}>
                      {ticket.authorId}
                    </span>

                    <span className="badge badge-med">
                      {ticket.category}
                    </span>

                    {/* AI vs Admin Source badge */}
                    {ticket.categorySource === 'ai' ? (
                      <span className="badge badge-ai" title="AI classified based on author description">
                        <Sparkles size={11} />
                        AI Classified
                      </span>
                    ) : (
                      <span className="badge badge-low" title="Manually classified by staff">
                        <User size={11} />
                        Manual
                      </span>
                    )}

                    <span className={`badge ${
                      ticket.priority === 'Critical' ? 'badge-crit' :
                      ticket.priority === 'High' ? 'badge-high' :
                      ticket.priority === 'Medium' ? 'badge-med' : 'badge-low'
                    }`}>
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

                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Book: <strong>{ticket.bookId || 'General / Account Level'}</strong></span>
                    <span>•</span>
                    <span>Created {new Date(ticket.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
                    id={`open-triage-btn-${ticket._id}`}
                    style={{
                      background: 'linear-gradient(135deg, #0f3d2e 0%, #165641 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(15, 61, 46, 0.25)'
                    }}
                  >
                    Triage & Respond →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
