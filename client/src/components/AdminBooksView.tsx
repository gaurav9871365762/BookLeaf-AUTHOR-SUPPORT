import React, { useState } from 'react';
import type { Book } from '../types';
import { BookOpen, Search, IndianRupee, ShoppingBag, ExternalLink } from 'lucide-react';

interface AdminBooksViewProps {
  books: Book[];
  loading: boolean;
}

export const AdminBooksView: React.FC<AdminBooksViewProps> = ({ books, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      !searchTerm ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.authorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !statusFilter || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCopies = books.reduce((acc, b) => acc + (b.copiesSold || 0), 0);
  const totalRoyalties = books.reduce((acc, b) => acc + (b.royaltyEarned || 0), 0);

  const renderValOrDash = (v: string | number | null | undefined, prefix: string = '') => {
    if (v === null || v === undefined || v === '') return <span className="empty-dash">—</span>;
    return `${prefix}${v}`;
  };

  return (
    <div className="animate-fade-in">
      {/* Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Catalog Titles</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {books.length} Books
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Live in Market</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#047857', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {books.filter(b => b.status === 'Published & Live').length}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>In Production Pipeline</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#b45309', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {books.filter(b => b.status !== 'Published & Live').length}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Total Royalty Tracked</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            ₹{totalRoyalties.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            id="admin-books-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, book ID, author ID, ISBN..."
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

        <select
          id="admin-books-status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <option value="Published & Live">Published & Live</option>
          <option value="In Production - Cover Design">In Production - Cover Design</option>
          <option value="In Production - Typesetting">In Production - Typesetting</option>
        </select>
      </div>

      {/* Books Table with null-safe handling */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Book ID</th>
                <th style={{ padding: '12px 16px' }}>Title & Genre</th>
                <th style={{ padding: '12px 16px' }}>Author ID</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>MRP</th>
                <th style={{ padding: '12px 16px' }}>Royalty/Copy</th>
                <th style={{ padding: '12px 16px' }}>Sold</th>
                <th style={{ padding: '12px 16px' }}>Earned</th>
                <th style={{ padding: '12px 16px' }}>Pending</th>
                <th style={{ padding: '12px 16px' }}>Print Partner</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((b) => (
                <tr key={b.bookId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#0f3d2e' }}>
                    {b.bookId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{renderValOrDash(b.genre)}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>
                    {b.authorId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 9999,
                      background: b.status === 'Published & Live' ? '#ecfdf5' : '#fffbeb',
                      color: b.status === 'Published & Live' ? '#047857' : '#b45309',
                      border: `1px solid ${b.status === 'Published & Live' ? '#a7f3d0' : '#fde68a'}`
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {renderValOrDash(b.mrp, '₹')}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 600 }}>
                    {renderValOrDash(b.authorRoyaltyPerCopy, '₹')}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {b.copiesSold.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>
                    ₹{b.royaltyEarned.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: b.royaltyPending > 0 ? '#d97706' : '#64748b' }}>
                    ₹{b.royaltyPending.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {renderValOrDash(b.printPartner)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
