import React from 'react';
import type { Book } from '../types';
import { BookOpen, IndianRupee, ShoppingBag, Clock, ExternalLink } from 'lucide-react';

interface AuthorBooksProps {
  books: Book[];
  loading: boolean;
  onRaiseTicket: (bookId: string) => void;
}

export const AuthorBooks: React.FC<AuthorBooksProps> = ({ books, loading, onRaiseTicket }) => {
  const totalSold = books.reduce((acc, b) => acc + (b.copiesSold || 0), 0);
  const totalEarned = books.reduce((acc, b) => acc + (b.royaltyEarned || 0), 0);
  const totalPaid = books.reduce((acc, b) => acc + (b.royaltyPaid || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royaltyPending || 0), 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <div className="pulsing-dot" style={{ background: '#10b981', width: 14, height: 14, marginBottom: 12 }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading author library and royalty analytics...</div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        margin: '20px 0'
      }}>
        <BookOpen size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
        <h3 style={{ fontSize: 18, color: '#334155' }}>No Books Linked to this Author Profile</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          If you believe this is an error, please submit an account-level support ticket.
        </p>
      </div>
    );
  }

  const renderValueOrDash = (val: string | number | null | undefined, prefix: string = '') => {
    if (val === null || val === undefined || val === '') {
      return <span className="empty-dash">—</span>;
    }
    return `${prefix}${val}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="empty-dash">—</span>;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return <span className="empty-dash">—</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total Books</span>
            <BookOpen size={18} color="#0f3d2e" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {books.length}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {books.filter(b => b.status === 'Published & Live').length} Live · {books.filter(b => b.status !== 'Published & Live').length} In Production
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Copies Sold</span>
            <ShoppingBag size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {totalSold.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4 }}>
            Across all distribution channels
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total Royalty Earned</span>
            <IndianRupee size={18} color="#059669" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#059669', fontFamily: 'Outfit, sans-serif' }}>
            ₹{totalEarned.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Calculated per author agreement
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Pending Payout</span>
            <Clock size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: totalPending > 0 ? '#d97706' : '#64748b', fontFamily: 'Outfit, sans-serif' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Paid so far: ₹{totalPaid.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <h3 style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: 16
      }}>
        Your Published & In-Production Titles ({books.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {books.map((book) => {
          const isLive = book.status === 'Published & Live';
          return (
            <div
              key={book.bookId}
              id={`book-card-${book.bookId}`}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1.5px solid #e2e8f0',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#0f3d2e',
                      background: '#e6f4ef',
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      {book.bookId}
                    </span>
                    <h4 style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginTop: 4
                    }}>
                      {book.title}
                    </h4>
                  </div>

                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 9999,
                    whiteSpace: 'nowrap',
                    background: isLive ? '#ecfdf5' : '#fffbeb',
                    color: isLive ? '#047857' : '#b45309',
                    border: `1px solid ${isLive ? '#a7f3d0' : '#fde68a'}`
                  }}>
                    {book.status}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                  Genre: <strong>{renderValueOrDash(book.genre)}</strong>
                </div>

                <div style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: '14px',
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  fontSize: 12
                }}>
                  <div>
                    <div style={{ color: '#64748b' }}>ISBN</div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'JetBrains Mono, monospace' }}>
                      {renderValueOrDash(book.isbn)}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b' }}>Publication Date</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {formatDate(book.publicationDate)}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b' }}>Retail Price (MRP)</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {renderValueOrDash(book.mrp, '₹')}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b' }}>Author Royalty/Copy</div>
                    <div style={{ fontWeight: 600, color: '#059669' }}>
                      {renderValueOrDash(book.authorRoyaltyPerCopy, '₹')}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b' }}>Print Partner</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {renderValueOrDash(book.printPartner)}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b' }}>Last Royalty Payout</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {formatDate(book.lastPayoutDate)}
                    </div>
                  </div>
                </div>

                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                    Royalty Ledger
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Copies Sold:</span>
                    <strong style={{ color: '#0f172a' }}>{book.copiesSold.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Royalty Earned:</span>
                    <strong style={{ color: '#059669' }}>₹{book.royaltyEarned.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>Pending Payout:</span>
                    <strong style={{ color: book.royaltyPending > 0 ? '#d97706' : '#64748b' }}>
                      ₹{book.royaltyPending.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {book.availableOn && book.availableOn.length > 0 ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                      Available Distribution Channels
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {book.availableOn.map((plat) => (
                        <span key={plat} style={{
                          fontSize: 11,
                          fontWeight: 500,
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0'
                        }}>
                          {plat}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 }}>
                    Distribution setup pending completion
                  </div>
                )}
              </div>

              <button
                id={`raise-ticket-btn-${book.bookId}`}
                onClick={() => onRaiseTicket(book.bookId)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1.5px solid #0f3d2e',
                  background: '#ffffff',
                  color: '#0f3d2e',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0f3d2e';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = '#0f3d2e';
                }}
              >
                <span>Raise Ticket for this Book</span>
                <ExternalLink size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
