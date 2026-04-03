import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Crown,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Loader from '../components/Loader';
import SafetyBanner from '../components/SafetyBanner';
import ManageListingCard from '../components/ManageListingCard';
import ListingEditorModal from '../components/ListingEditorModal';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { formatDate, whatsappLink } from '../utils/format';
import { emitUnreadCountChange, getNotificationTarget } from '../utils/notifications';

function isPremiumActive(user) {
  return Boolean(
    user?.premiumStatus === 'active' &&
    user?.premiumExpiresAt &&
    new Date(user.premiumExpiresAt) > new Date()
  );
}

function isPremiumPending(user) {
  return user?.premiumStatus === 'pending';
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function ProfilePage() {
  const { user, logoutWithConfirmation, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const [editingListing, setEditingListing] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  const { data, loading, error, setData } = useFetch(async () => {
    const [listingsRes, inboxRes, notificationsRes] = await Promise.all([
      client.get('/listings/mine'),
      client.get('/messages/inbox'),
      client.get('/notifications'),
    ]);

    return {
      listings: listingsRes.data,
      inbox: inboxRes.data,
      notifications: notificationsRes.data.notifications || [],
      unreadCount: notificationsRes.data.unreadCount || 0,
    };
  }, []);

  const upgradeRequested = params.get('upgrade') === '1';
  const focusNotifications = params.get('tab') === 'notifications';
  const premiumActive = isPremiumActive(user);
  const premiumPending = isPremiumPending(user);

  useEffect(() => {
    if (focusNotifications && notificationsRef.current) {
      notificationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusNotifications, data?.notifications?.length]);

  useEffect(() => {
    emitUnreadCountChange(data?.unreadCount || 0);
  }, [data?.unreadCount]);

  const stats = useMemo(() => {
    const listings = data?.listings || [];
    return {
      total: listings.length,
      active: listings.filter((item) => item.saleStatus !== 'sold').length,
      sold: listings.filter((item) => item.saleStatus === 'sold').length,
      approved: listings.filter((item) => item.status === 'approved').length,
    };
  }, [data?.listings]);

  function replaceListing(updatedListing) {
    setData((current) => ({
      ...current,
      listings: current.listings.map((item) => (item._id === updatedListing._id ? updatedListing : item)),
    }));
  }

  async function handleToggleSaleStatus(listing) {
    const nextSaleStatus = listing.saleStatus === 'sold' ? 'available' : 'sold';
    const loadingKey = `${listing._id}:sale`;

    try {
      setActionLoadingKey(loadingKey);
      const { data: updated } = await client.patch(`/listings/${listing._id}/sale-status`, { saleStatus: nextSaleStatus });
      replaceListing(updated);
      toast.success(nextSaleStatus === 'sold' ? 'Listing marked as sold.' : 'Listing marked as available.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update listing status.');
    } finally {
      setActionLoadingKey('');
    }
  }

  async function handleDelete(listing) {
    const shouldDelete = window.confirm(`Delete "${listing.title}" permanently?`);
    if (!shouldDelete) return;

    const loadingKey = `${listing._id}:delete`;

    try {
      setActionLoadingKey(loadingKey);
      await client.delete(`/listings/${listing._id}`);
      setData((current) => ({
        ...current,
        listings: current.listings.filter((item) => item._id !== listing._id),
        inbox: current.inbox.filter((item) => item.listing?._id !== listing._id),
      }));
      toast.success('Listing deleted successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to delete listing.');
    } finally {
      setActionLoadingKey('');
    }
  }

  async function handleUpgrade() {
    if (premiumActive) {
      toast.success('Your seller premium is already active.');
      return;
    }

    try {
      setActionLoadingKey('account:upgrade');
      const { data } = await client.post('/payments/paystack/initialize');
      window.location.href = data.authorizationUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to start premium upgrade.');
      setActionLoadingKey('');
    }
  }

  function handleLogout() {
    const didLogout = logoutWithConfirmation();
    if (didLogout) {
      navigate('/');
    }
  }

  async function handleSavedListing(updatedListing) {
    replaceListing(updatedListing);
    await refreshUser();
    setEditingListing(null);
  }

  async function markNotificationRead(id) {
    try {
      await client.patch(`/notifications/${id}/read`);
      setData((current) => {
        const nextUnread = Math.max(0, (current.unreadCount || 0) - 1);
        emitUnreadCountChange(nextUnread);

        return {
          ...current,
          notifications: (current.notifications || []).map((item) =>
            item._id === id ? { ...item, isRead: true } : item
          ),
          unreadCount: nextUnread,
        };
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark notification as read.');
    }
  }

  async function markAllNotificationsRead() {
    try {
      await client.patch('/notifications/read-all');
      emitUnreadCountChange(0);
      setData((current) => ({
        ...current,
        notifications: (current.notifications || []).map((item) => ({ ...item, isRead: true })),
        unreadCount: 0,
      }));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark all notifications as read.');
    }
  }

  async function openNotification(item) {
    const target = getNotificationTarget(item, '/profile?tab=notifications');

    if (!item?.isRead) {
      try {
        await client.patch(`/notifications/${item._id}/read`);
        setData((current) => {
          const nextUnread = Math.max(0, (current.unreadCount || 0) - 1);
          emitUnreadCountChange(nextUnread);

          return {
            ...current,
            notifications: (current.notifications || []).map((entry) =>
              entry._id === item._id ? { ...entry, isRead: true } : entry
            ),
            unreadCount: nextUnread,
          };
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not open notification.');
        return;
      }
    }

    navigate(target);
  }

  const notifications = data?.notifications || [];
  const inbox = data?.inbox || [];

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="section-title">My Profile</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome, {user?.name}. Manage your listings, watch buyer enquiries and control your account from one professional dashboard.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl bg-brand-50 p-4 text-sm text-brand-700">
              <p className="inline-flex items-center gap-2 font-semibold text-slate-900"><Mail size={16} /> Account details</p>
              <p className="mt-3 break-all font-medium">{user?.email}</p>
              <p className="mt-2 text-slate-600">Role: {user?.role}</p>
              <p className="mt-2 text-slate-600">Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 p-4 text-sm text-slate-600">
              <p className="inline-flex items-center gap-2 font-semibold text-slate-900"><LayoutGrid size={16} /> Listing summary</p>
              <p className="mt-3">Total listings: {stats.total}</p>
              <p className="mt-2">Approved: {stats.approved}</p>
              <p className="mt-2">Available: {stats.active}</p>
              <p className="mt-2">Sold: {stats.sold}</p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="inline-flex items-center gap-2 font-semibold text-slate-900"><Crown size={16} /> Seller premium</p>
              <p className="mt-3 font-medium">
                {premiumActive ? 'Active' : premiumPending ? 'Pending payment verification' : 'Inactive'}
              </p>
              <p className="mt-2 leading-6 text-slate-700">
                {premiumActive
                  ? 'All your current and future listings are covered for premium visibility while active.'
                  : 'Upgrade once and your current and future listings can receive premium coverage automatically.'}
              </p>
              {user?.premiumExpiresAt && premiumActive && (
                <p className="mt-2 inline-flex items-center gap-2 text-slate-600"><CalendarDays size={14} /> Expires: {new Date(user.premiumExpiresAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:w-[300px]">
          {!premiumActive && !premiumPending && (
            <button
              className="btn-primary w-full"
              onClick={handleUpgrade}
              disabled={actionLoadingKey === 'account:upgrade'}
            >
              <Sparkles size={18} />
              Upgrade Account
            </button>
          )}
          {premiumPending && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Your premium payment is pending verification. The upgrade button will reappear only if this payment does not complete.
            </div>
          )}
          <button className="btn-secondary w-full" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2 font-semibold text-slate-900"><TrendingUp size={16} /> Pro seller note</p>
            <p className="mt-2 leading-6">Keep listings updated, mark sold items quickly and reply to buyers fast to build trust and get better conversion.</p>
          </div>
        </div>
      </div>

      {upgradeRequested && (
        <div className="rounded-3xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">
          Seller premium now works at the <strong>account level</strong>. One successful Paystack payment can cover your current listings and future listings automatically.
        </div>
      )}

      {loading ? <Loader label="Loading your dashboard..." /> : error ? <div className="card text-rose-600">{error}</div> : (
        <div className="grid gap-6 lg:grid-cols-[1fr,0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">My Listings</h2>
                <p className="mt-1 text-sm text-slate-500">Edit, mark sold, delete or manage premium-ready listings from here.</p>
              </div>
              {premiumActive && (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <ShieldCheck size={14} /> Seller premium active
                </span>
              )}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {data?.listings?.map((listing) => (
                <ManageListingCard
                  key={listing._id}
                  listing={listing}
                  onEdit={setEditingListing}
                  onToggleSaleStatus={handleToggleSaleStatus}
                  onDelete={handleDelete}
                  onUpgrade={handleUpgrade}
                  actionLoading={actionLoadingKey.startsWith(`${listing._id}:`) || actionLoadingKey === 'account:upgrade'}
                  accountPremiumActive={premiumActive}
                  accountPremiumPending={premiumPending}
                />
              ))}
            </div>
            {!data?.listings?.length && <div className="card text-sm text-slate-500">You have not posted any listing yet.</div>}
          </div>

          <div className="space-y-4">
            <SafetyBanner />

            <div ref={notificationsRef} className={`card space-y-4 ${focusNotifications ? 'ring-2 ring-brand-200 ring-offset-2' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="inline-flex items-center gap-2 text-xl font-bold"><Bell size={20} /> Notifications</h2>
                  <p className="mt-1 text-sm text-slate-500">Your latest buyer activity and account alerts appear here.</p>
                </div>
                {!!data?.unreadCount && (
                  <button type="button" onClick={markAllNotificationsRead} className="btn-secondary">
                    <CheckCheck size={16} /> Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.map((item) => (
                  <div key={item._id} className={`rounded-3xl border p-4 text-sm transition ${item.isRead ? 'border-slate-100 bg-white' : 'border-brand-100 bg-brand-50/40 shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!item.isRead && <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />}
                          <p className="font-semibold text-slate-900">{item.title}</p>
                        </div>
                        <p className="mt-2 leading-6 text-slate-600">{item.message}</p>
                        <p className="mt-3 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        {!item.isRead && (
                          <button type="button" onClick={() => markNotificationRead(item._id)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openNotification(item)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Open <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!notifications.length && <div className="rounded-3xl border border-slate-100 p-4 text-sm text-slate-500">No notifications yet.</div>}
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="inline-flex items-center gap-2 text-xl font-bold"><MessageSquareText size={20} /> Contact Requests</h2>
                  <p className="mt-1 text-sm text-slate-500">Click a buyer profile to open a cleaner view and contact them quickly.</p>
                </div>
              </div>
              <div className="space-y-3">
                {inbox.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-100 p-4 text-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(item)}
                          className="text-left font-semibold text-slate-900 transition hover:text-brand-700"
                        >
                          {item.senderName} {item.listing?.title ? `• ${item.listing.title}` : ''}
                        </button>
                        <p className="mt-2 leading-6 text-slate-600">{item.message}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          Email: {item.senderEmail || 'Not provided'} · Phone: {item.senderPhone || 'Not provided'} · Sent: {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <button type="button" onClick={() => setSelectedInquiry(item)} className="btn-secondary whitespace-nowrap">
                        <UserRound size={16} /> Buyer profile
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.senderPhone && (
                        <a
                          className="btn-primary"
                          href={whatsappLink(item.senderPhone, `Hello ${item.senderName}, I received your PeezuHub contact request about \"${item.listing?.title || 'my listing'}\".`)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle size={16} /> WhatsApp buyer
                        </a>
                      )}
                      {item.senderPhone && (
                        <a className="btn-secondary" href={`tel:${item.senderPhone}`}>
                          <Phone size={16} /> Call buyer
                        </a>
                      )}
                      {item.senderEmail && (
                        <a className="btn-secondary" href={`mailto:${item.senderEmail}?subject=${encodeURIComponent(`PeezuHub enquiry: ${item.listing?.title || 'your request'}`)}`}>
                          <Mail size={16} /> Email buyer
                        </a>
                      )}
                      {item.listing?._id && (
                        <Link className="btn-secondary" to={`/listings/${item.listing._id}`}>
                          <ExternalLink size={16} /> View listing
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {!inbox.length && <div className="rounded-3xl border border-slate-100 p-4 text-sm text-slate-500">No buyer enquiries yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingListing && (
        <ListingEditorModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSaved={handleSavedListing}
        />
      )}

      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 p-5 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Buyer profile</p>
                <h3 className="mt-2 text-xl font-bold">{selectedInquiry.senderName}</h3>
                <p className="mt-1 text-sm text-blue-50/90">For listing: {selectedInquiry.listing?.title || 'PeezuHub enquiry'}</p>
              </div>
              <button type="button" onClick={() => setSelectedInquiry(null)} className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Buyer details</p>
                  <p className="mt-3">Name: {selectedInquiry.senderName}</p>
                  <p className="mt-2 break-all">Email: {selectedInquiry.senderEmail || 'Not provided'}</p>
                  <p className="mt-2">Phone: {selectedInquiry.senderPhone || 'Not provided'}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Account snapshot</p>
                  <p className="mt-3">Signed in user: {selectedInquiry.fromUser ? 'Yes' : 'Guest enquiry'}</p>
                  <p className="mt-2">Role: {selectedInquiry.fromUser?.role || 'Buyer'}</p>
                  <p className="mt-2">Joined: {selectedInquiry.fromUser?.createdAt ? formatDate(selectedInquiry.fromUser.createdAt) : 'Not available'}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-900">Buyer message</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{selectedInquiry.message}</p>
                <p className="mt-3 text-xs text-slate-500">Sent {formatDateTime(selectedInquiry.createdAt)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedInquiry.senderPhone && (
                  <a
                    className="btn-primary"
                    href={whatsappLink(selectedInquiry.senderPhone, `Hello ${selectedInquiry.senderName}, I received your PeezuHub contact request about \"${selectedInquiry.listing?.title || 'my listing'}\".`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={16} /> WhatsApp buyer
                  </a>
                )}
                {selectedInquiry.senderPhone && (
                  <a className="btn-secondary" href={`tel:${selectedInquiry.senderPhone}`}>
                    <Phone size={16} /> Call buyer
                  </a>
                )}
                {selectedInquiry.senderEmail && (
                  <a className="btn-secondary" href={`mailto:${selectedInquiry.senderEmail}?subject=${encodeURIComponent(`PeezuHub enquiry: ${selectedInquiry.listing?.title || 'your request'}`)}`}>
                    <Mail size={16} /> Email buyer
                  </a>
                )}
                {selectedInquiry.listing?._id && (
                  <Link className="btn-secondary" to={`/listings/${selectedInquiry.listing._id}`} onClick={() => setSelectedInquiry(null)}>
                    <ExternalLink size={16} /> Open listing
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
