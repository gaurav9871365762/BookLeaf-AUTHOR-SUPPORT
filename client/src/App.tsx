import React, { useState, useEffect, useCallback } from 'react';
import type { User, Book, Ticket } from './types';
import { api } from './services/api';
import { getSocket, joinAdminRoom, joinAuthorRoom } from './services/socket';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { AuthorBooks } from './components/AuthorBooks';
import { AuthorNewTicket } from './components/AuthorNewTicket';
import { AuthorTickets } from './components/AuthorTickets';
import { AdminQueue } from './components/AdminQueue';
import { AdminTicketDetail } from './components/AdminTicketDetail';
import { AdminBooksView } from './components/AdminBooksView';
import { BookOpen, PlusCircle, MessageSquare, Shield } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const [authorTab, setAuthorTab] = useState<'books' | 'new-ticket' | 'tickets'>('books');
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [authorTickets, setAuthorTickets] = useState<Ticket[]>([]);
  const [loadingAuthorData, setLoadingAuthorData] = useState(false);
  const [selectedTicketIdForAuthor, setSelectedTicketIdForAuthor] = useState<string | null>(null);
  const [preselectedBookId, setPreselectedBookId] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<'queue' | 'detail' | 'all-books'>('queue');
  const [adminTickets, setAdminTickets] = useState<Ticket[]>([]);
  const [allCatalogBooks, setAllCatalogBooks] = useState<Book[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [selectedTicketIdForAdmin, setSelectedTicketIdForAdmin] = useState<string | null>(null);

  const [adminFilters, setAdminFilters] = useState({
    status: '',
    category: '',
    priority: '',
    sort: 'urgent'
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
        setLoginModalOpen(true);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) setSocketConnected(true);

    if (currentUser) {
      if (currentUser.role === 'admin') {
        joinAdminRoom();
      } else if (currentUser.authorId) {
        joinAuthorRoom(currentUser.authorId);
      }
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [currentUser]);

  const fetchAuthorData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'author') return;
    try {
      setLoadingAuthorData(true);
      const [books, tickets] = await Promise.all([api.getBooks(), api.getTickets()]);
      setAuthorBooks(books);
      setAuthorTickets(tickets);
    } catch (err) {
      console.error('Failed to load author data:', err);
    } finally {
      setLoadingAuthorData(false);
    }
  }, [currentUser]);

  const fetchAdminData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      setLoadingAdminData(true);
      const [tickets, books] = await Promise.all([
        api.getAdminTickets(adminFilters),
        api.getBooks()
      ]);
      setAdminTickets(tickets);
      setAllCatalogBooks(books);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingAdminData(false);
    }
  }, [currentUser, adminFilters]);

  useEffect(() => {
    if (currentUser?.role === 'author') {
      fetchAuthorData();
    } else if (currentUser?.role === 'admin') {
      fetchAdminData();
    }
  }, [currentUser, fetchAuthorData, fetchAdminData]);

  useEffect(() => {
    const socket = getSocket();

    const onTicketCreated = () => {
      if (currentUser?.role === 'admin') fetchAdminData();
      if (currentUser?.role === 'author') fetchAuthorData();
    };

    const onTicketUpdated = () => {
      if (currentUser?.role === 'admin') fetchAdminData();
      if (currentUser?.role === 'author') fetchAuthorData();
    };

    socket.on('ticket:created', onTicketCreated);
    socket.on('ticket:updated', onTicketUpdated);

    return () => {
      socket.off('ticket:created', onTicketCreated);
      socket.off('ticket:updated', onTicketUpdated);
    };
  }, [currentUser, fetchAdminData, fetchAuthorData]);

  const handleLogin = async (email: string, pass: string) => {
    try {
      setLoginLoading(true);
      setLoginError(null);
      const res = await api.login(email, pass);
      setCurrentUser(res.user);
      setLoginModalOpen(false);
      setSelectedTicketIdForAuthor(null);
      setSelectedTicketIdForAdmin(null);
      setAuthorTab('books');
      setAdminTab('queue');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {} finally {
      setCurrentUser(null);
      setAuthorBooks([]);
      setAuthorTickets([]);
      setAdminTickets([]);
      setLoginModalOpen(true);
    }
  };

  const handleRaiseTicketForBook = (bookId: string) => {
    setPreselectedBookId(bookId);
    setAuthorTab('new-ticket');
  };

  const handleTicketCreated = (createdTicket: Ticket) => {
    fetchAuthorData();
    setSelectedTicketIdForAuthor(createdTicket._id);
    setAuthorTab('tickets');
  };

  if (authChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        flexDirection: 'column',
        gap: 12
      }}>
        <div className="pulsing-dot" style={{ background: '#0f3d2e', width: 16, height: 16 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f3d2e' }}>
          Initializing BookLeaf Author Support Portal...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenDemoSwitcher={() => setLoginModalOpen(true)}
        socketConnected={socketConnected}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={currentUser ? () => setLoginModalOpen(false) : undefined}
        onLogin={handleLogin}
        loading={loginLoading}
        error={loginError}
      />

      {currentUser && (
        <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '24px' }}>
          {currentUser.role === 'author' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: 2,
                marginBottom: 24
              }}>
                <button
                  id="tab-author-books"
                  onClick={() => {
                    setAuthorTab('books');
                    setSelectedTicketIdForAuthor(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: authorTab === 'books' ? '3px solid #0f3d2e' : '3px solid transparent',
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: authorTab === 'books' ? '#0f3d2e' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: -2
                  }}
                >
                  <BookOpen size={16} />
                  <span>My Books & Royalties</span>
                  <span style={{
                    background: authorTab === 'books' ? '#e6f4ef' : '#f1f5f9',
                    color: authorTab === 'books' ? '#0f3d2e' : '#64748b',
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 9999
                  }}>
                    {authorBooks.length}
                  </span>
                </button>

                <button
                  id="tab-author-tickets"
                  onClick={() => {
                    setAuthorTab('tickets');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: authorTab === 'tickets' ? '3px solid #0f3d2e' : '3px solid transparent',
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: authorTab === 'tickets' ? '#0f3d2e' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: -2
                  }}
                >
                  <MessageSquare size={16} />
                  <span>My Support Tickets</span>
                  <span style={{
                    background: authorTab === 'tickets' ? '#e6f4ef' : '#f1f5f9',
                    color: authorTab === 'tickets' ? '#0f3d2e' : '#64748b',
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 9999
                  }}>
                    {authorTickets.length}
                  </span>
                </button>

                <button
                  id="tab-author-new-ticket"
                  onClick={() => {
                    setAuthorTab('new-ticket');
                    setPreselectedBookId(null);
                  }}
                  style={{
                    background: authorTab === 'new-ticket' ? '#0f3d2e' : '#f1f5f9',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: authorTab === 'new-ticket' ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginLeft: 'auto'
                  }}
                >
                  <PlusCircle size={15} />
                  <span>Submit New Ticket</span>
                </button>
              </div>

              {authorTab === 'books' && (
                <AuthorBooks
                  books={authorBooks}
                  loading={loadingAuthorData}
                  onRaiseTicket={handleRaiseTicketForBook}
                />
              )}

              {authorTab === 'new-ticket' && (
                <AuthorNewTicket
                  books={authorBooks}
                  initialBookId={preselectedBookId}
                  onTicketCreated={handleTicketCreated}
                  onCancel={() => setAuthorTab('books')}
                />
              )}

              {authorTab === 'tickets' && (
                <AuthorTickets
                  tickets={authorTickets}
                  books={authorBooks}
                  selectedTicketId={selectedTicketIdForAuthor}
                  onSelectTicket={setSelectedTicketIdForAuthor}
                  onRefresh={fetchAuthorData}
                  loading={loadingAuthorData}
                />
              )}
            </div>
          )}

          {currentUser.role === 'admin' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: 2,
                marginBottom: 24
              }}>
                <button
                  id="tab-admin-queue"
                  onClick={() => {
                    setAdminTab('queue');
                    setSelectedTicketIdForAdmin(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: adminTab === 'queue' ? '3px solid #0f3d2e' : '3px solid transparent',
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: adminTab === 'queue' ? '#0f3d2e' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: -2
                  }}
                >
                  <Shield size={16} />
                  <span>Triage Queue</span>
                  <span style={{
                    background: adminTab === 'queue' ? '#e6f4ef' : '#f1f5f9',
                    color: adminTab === 'queue' ? '#0f3d2e' : '#64748b',
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 9999
                  }}>
                    {adminTickets.length}
                  </span>
                </button>

                <button
                  id="tab-admin-all-books"
                  onClick={() => {
                    setAdminTab('all-books');
                    setSelectedTicketIdForAdmin(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: adminTab === 'all-books' ? '3px solid #0f3d2e' : '3px solid transparent',
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: adminTab === 'all-books' ? '#0f3d2e' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: -2
                  }}
                >
                  <BookOpen size={16} />
                  <span>Catalog Database</span>
                  <span style={{
                    background: adminTab === 'all-books' ? '#e6f4ef' : '#f1f5f9',
                    color: adminTab === 'all-books' ? '#0f3d2e' : '#64748b',
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 9999
                  }}>
                    {allCatalogBooks.length} Titles
                  </span>
                </button>
              </div>

              {adminTab === 'queue' && (
                <AdminQueue
                  tickets={adminTickets}
                  loading={loadingAdminData}
                  onSelectTicket={(ticketId) => {
                    setSelectedTicketIdForAdmin(ticketId);
                    setAdminTab('detail');
                  }}
                  onRefresh={fetchAdminData}
                  filters={adminFilters}
                  onFilterChange={(key, val) => setAdminFilters((prev) => ({ ...prev, [key]: val }))}
                />
              )}

              {adminTab === 'detail' && selectedTicketIdForAdmin && (
                <AdminTicketDetail
                  ticketId={selectedTicketIdForAdmin}
                  onBack={() => {
                    setAdminTab('queue');
                    setSelectedTicketIdForAdmin(null);
                  }}
                  onRefreshQueue={fetchAdminData}
                />
              )}

              {adminTab === 'all-books' && (
                <AdminBooksView
                  books={allCatalogBooks}
                  loading={loadingAdminData}
                />
              )}
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
