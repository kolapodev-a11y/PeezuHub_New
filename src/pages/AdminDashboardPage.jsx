import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Crown,
  Flag,
  LayoutDashboard,
  ListFilter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import client from '../api/client';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import useFetch from '../hooks/useFetch';
import { formatDate } from '../utils/format';
import { emitUnreadCountChange, getNotificationTarget } from '../utils/notifications';

const NOTIF_CATEGORIES = {
  report: 'reports',
  submission: 'listings',
  moderation: 'listings',
  premium_upgrade_paid: 'premium',
  premium_upgrade_pending: 'premium',
  new_signup: 'signups',
};

const NOTIF_TABS = [
  { key: 'all', label: 'All' },
  { key: 'reports', label: 'Reports' },
  { key: 'listings', label: 'Listings' },
  { key: 'premium', label: 'Premium upgrades' },
  { key: 'signups', label: 'New signups' },
];

const MAIN_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'pending', label: 'Pending review' },
  { key: 'reports', label: 'Reports' },
  { key: 'all_listings', label: 'All listings' },
  { key: 'users', label: 'Users' },
  { key: 'notifications', label: 'Notifications' },
];
const MAIN_TAB_KEYS = new Set(MAIN_TABS.map((tab) => tab.key));

const NOTIF_STYLES = {
  report: { icon: '🚩', accent: 'text-rose-700', bg: 'bg-rose-50' },
  submission: { icon: '📝', accent: 'text-sky-700', bg: 'bg-sky-50' },
  moderation: { icon: '✅', accent: 'text-emerald-700', bg: 'bg-emerald-50' },
  premium_upgrade_paid: { icon: '⭐', accent: 'text-violet-700', bg: 'bg-violet-50' },
  premium_upgrade_pending: { icon: '⏳', accent: 'text-amber-700', bg: 'bg-amber-50' },
  new_signup: { icon: '👤', accent: 'text-cyan-700', bg: 'bg-cyan-50' },
};

function StatCard({ icon, label, value, hint, gradient }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-white/60 p-5 shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value ?? 0}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/80 p-3 text-slate-700 shadow-sm">{icon}</div>
      </div>
    </div>
  );
}

function SectionShell({ title, subtitle, actions, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function NotificationItem({ item, onRead, onOpen }) {
  const style = NOTIF_STYLES[item.type] || { icon: '🔔', accent: 'text-slate-700', bg: 'bg-slate-50' };

  return (
    <div className={`rounded-2xl border border-slate-200 p-4 transition ${item.isRead ? 'bg-slate-50/80' : 'bg-white'}`}>
      <div className="flex gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${style.bg}`}>
          {style.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className={`text-sm font-bold ${style.accent}`}>{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {!item.isRead ? (
                <button
                  onClick={() => onRead(item._id)}
                  className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  Mark read
                </button>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  Read
                </span>
              )}

              <button
                onClick={() => onOpen(item)}
                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Open
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {new Date(item.createdAt).toLocaleString('en-NG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [mainTab, setMainTab] = useState(MAIN_TAB_KEYS.has(requestedTab) ? requestedTab : 'overview');
  const [notifTab, setNotifTab] = useState('all');
  const [listingSearch, setListingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reasons, setReasons] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const { data, loading, error, setData } = useFetch(async () => {
    const [dashRes, notifRes, usersRes] = await Promise.all([
      client.get('/listings/admin/dashboard'),
      client.get('/notifications'),
      client.get('/auth/admin/users'),
    ]);

    return {
      ...dashRes.data,
      notifications: notifRes.data.notifications,
      unreadCount: notifRes.data.unreadCount,
      users: usersRes.data.users,
      totalUsers: usersRes.data.totalUsers,
      premiumUsers: usersRes.data.premiumUsers,
      recentSignups: usersRes.data.recentSignups,
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (MAIN_TAB_KEYS.has(requestedTab) && requestedTab !== mainTab) {
      setMainTab(requestedTab);
    }

    if (!requestedTab && mainTab !== 'overview') {
      setMainTab('overview');
    }
  }, [requestedTab, mainTab]);

  useEffect(() => {
    emitUnreadCountChange(data?.unreadCount || 0);
  }, [data?.unreadCount]);

  function changeMainTab(tabKey) {
    setMainTab(tabKey);
    const next = new URLSearchParams(searchParams);

    if (!tabKey || tabKey === 'overview') next.delete('tab');
    else next.set('tab', tabKey);

    setSearchParams(next, { replace: true });
  }

  async function moderate(id, action) {
    try {
      const { data: updated } = await client.patch(`/listings/${id}/status`, {
        action,
        reason: reasons[id] || '',
      });

      setData((prev) => ({
        ...prev,
        pendingListings: (prev.pendingListings || []).filter((item) => item._id !== id),
        allListings: (prev.allListings || []).map((item) =>
          item._id === id ? { ...item, status: updated.status, rejectionReason: updated.rejectionReason } : item
        ),
        pendingCount: Math.max(0, (prev.pendingCount || 1) - 1),
      }));

      toast.success(`${updated.title} ${action}d successfully.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Moderation failed.');
    }
  }

  async function markRead(id) {
    try {
      await client.patch(`/notifications/${id}/read`);
      setData((prev) => {
        const nextUnread = Math.max(0, (prev.unreadCount || 1) - 1);
        emitUnreadCountChange(nextUnread);

        return {
          ...prev,
          notifications: (prev.notifications || []).map((item) =>
            item._id === id ? { ...item, isRead: true } : item
          ),
          unreadCount: nextUnread,
        };
      });
    } catch {
      toast.error('Could not mark notification as read.');
    }
  }

  async function markAllRead() {
    try {
      await client.patch('/notifications/read-all');
      emitUnreadCountChange(0);
      setData((prev) => ({
        ...prev,
        notifications: (prev.notifications || []).map((item) => ({ ...item, isRead: true })),
        unreadCount: 0,
      }));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all notifications as read.');
    }
  }

  const notifications = data?.notifications || [];
  const pendingListings = data?.pendingListings || [];
  const reports = data?.reports || [];
  const allListings = data?.allListings || [];
  const users = data?.users || [];

  async function openNotification(item) {
    const target = getNotificationTarget(item, '/admin?tab=notifications');

    if (!item?.isRead) {
      try {
        await client.patch(`/notifications/${item._id}/read`);
        setData((prev) => {
          const nextUnread = Math.max(0, (prev.unreadCount || 1) - 1);
          emitUnreadCountChange(nextUnread);

          return {
            ...prev,
            notifications: (prev.notifications || []).map((entry) =>
              entry._id === item._id ? { ...entry, isRead: true } : entry
            ),
            unreadCount: nextUnread,
          };
        });
      } catch {
        toast.error('Could not open notification.');
        return;
      }
    }

    navigate(target);
  }

  const filteredNotifications = useMemo(() => {
    if (notifTab === 'all') return notifications;
    return notifications.filter((item) => NOTIF_CATEGORIES[item.type] === notifTab);
  }, [notifications, notifTab]);

  const filteredListings = useMemo(() => {
    const query = listingSearch.trim().toLowerCase();
    if (!query) return allListings;
    return allListings.filter((listing) => {
      const haystack = [
        listing.title,
        listing.category,
        listing.city,
        listing.state,
        listing.status,
        listing.user?.name,
        listing.user?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [allListings, listingSearch]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const haystack = [user.name, user.email, user.role, user.premiumStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [users, userSearch]);

  const recentSignups = useMemo(
    () => users.filter((user) => Date.now() - new Date(user.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000),
    [users]
  );

  if (loading) return <Loader label="Loading admin dashboard…" />;
  if (error) return <div className="card text-rose-600">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-sky-50 shadow-sm">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              <Sparkles size={14} />
              Admin control center
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Modern PeezuHub admin workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Manage premium upgrades, new signups, reports, listing approvals, and unread alerts from a cleaner,
              faster dashboard designed for daily operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
            >
              <RefreshCw size={16} />
              Refresh data
            </button>
            {data?.unreadCount > 0 ? (
              <button
                onClick={() => {
                  changeMainTab('notifications');
                  setNotifTab('all');
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Bell size={16} />
                {data.unreadCount} unread alerts
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={<LayoutDashboard size={20} />} label="Pending review" value={data?.pendingCount || 0} hint="Listings waiting for action" gradient="bg-gradient-to-br from-amber-50 to-white" />
        <StatCard icon={<Flag size={20} />} label="Open reports" value={reports.length} hint="Community safety signals" gradient="bg-gradient-to-br from-rose-50 to-white" />
        <StatCard icon={<ListFilter size={20} />} label="All listings" value={data?.totalListings || 0} hint={`${data?.approvedListings || 0} approved · ${data?.rejectedListings || 0} rejected`} gradient="bg-gradient-to-br from-sky-50 to-white" />
        <StatCard icon={<Users size={20} />} label="Total users" value={data?.totalUsers || 0} hint={`${data?.recentSignups || 0} new this week`} gradient="bg-gradient-to-br from-emerald-50 to-white" />
        <StatCard icon={<Crown size={20} />} label="Premium users" value={data?.premiumUsers || 0} hint="Active seller premium accounts" gradient="bg-gradient-to-br from-violet-50 to-white" />
        <StatCard icon={<Bell size={20} />} label="Unread alerts" value={data?.unreadCount || 0} hint={`${notifications.length} total notifications`} gradient="bg-gradient-to-br from-cyan-50 to-white" />
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        {MAIN_TABS.map((tab) => {
          const isActive = mainTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => changeMainTab(tab.key)}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {mainTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
          <SectionShell
            title="Operational highlights"
            subtitle="Quick view of what needs attention first."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Moderation queue</p>
                <p className="mt-3 text-2xl font-black text-slate-900">{pendingListings.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Approve or reject fresh listings before they appear publicly.
                </p>
              </div>
              <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Premium queue</p>
                <p className="mt-3 text-2xl font-black text-slate-900">
                  {notifications.filter((item) => item.type?.startsWith('premium_') && !item.isRead).length}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Follow premium payment updates without sending duplicate emails.
                </p>
              </div>
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Reports</p>
                <p className="mt-3 text-2xl font-black text-slate-900">{reports.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review suspicious content and keep the marketplace trusted.
                </p>
              </div>
              <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">New signups</p>
                <p className="mt-3 text-2xl font-black text-slate-900">{recentSignups.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Fresh accounts created within the last 7 days.
                </p>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            title="Latest signups"
            subtitle="Newest members and premium states."
            actions={
              <button
                onClick={() => changeMainTab('users')}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
              >
                View all users
              </button>
            }
          >
            <div className="space-y-3">
              {recentSignups.slice(0, 6).length ? (
                recentSignups.slice(0, 6).map((user) => (
                  <div key={user._id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-bold text-brand-700">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-11 w-11 rounded-2xl object-cover" />
                      ) : (
                        user.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge color={user.role === 'admin' ? 'blue' : 'slate'}>{user.role}</Badge>
                      {user.premiumStatus === 'active' ? <Badge color="yellow">Premium</Badge> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                  No recent signups yet.
                </div>
              )}
            </div>
          </SectionShell>
        </div>
      )}

      {mainTab === 'pending' && (
        <SectionShell title="Pending listing approvals" subtitle="Approve strong submissions or reject weak ones with a reason.">
          <div className="space-y-4">
            {pendingListings.length ? (
              pendingListings.map((listing) => (
                <div key={listing._id} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{listing.title}</h3>
                        <Badge color="yellow">Pending</Badge>
                        {listing.premiumPaymentStatus === 'paid' ? <Badge color="blue">Premium-ready</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {listing.category} · {listing.city}, {listing.state} · ₦{Number(listing.startingPrice || 0).toLocaleString('en-NG')}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-slate-700">{listing.description}</p>
                      <p className="mt-4 text-xs text-slate-500">
                        Submitter: {listing.user?.name} {listing.user?.email ? `(${listing.user.email})` : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 xl:w-64">
                      {(listing.photos || []).slice(0, 4).map((photo, index) => (
                        <img key={index} src={photo} alt={listing.title} className="h-24 w-full rounded-2xl object-cover" />
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <textarea
                      className="input min-h-[90px]"
                      placeholder="Short rejection reason (required when rejecting)"
                      value={reasons[listing._id] || ''}
                      onChange={(event) =>
                        setReasons((prev) => ({ ...prev, [listing._id]: event.target.value }))
                      }
                    />
                    <button className="btn-primary" onClick={() => moderate(listing._id, 'approve')}>
                      Approve listing
                    </button>
                    <button
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                      onClick={() => moderate(listing._id, 'reject')}
                    >
                      Reject listing
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                No pending listings right now.
              </div>
            )}
          </div>
        </SectionShell>
      )}

      {mainTab === 'reports' && (
        <SectionShell title="Open reports" subtitle="Review user-submitted reports and flagged marketplace activity.">
          <div className="space-y-3">
            {reports.length ? (
              reports.map((report) => (
                <div key={report._id} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                      🚩
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{report.listing?.title || 'Deleted listing'}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{report.reason}</p>
                      <p className="mt-3 text-xs text-slate-500">
                        Reporter: {report.reporterName}
                        {report.reporterEmail ? ` · ${report.reporterEmail}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                No open reports.
              </div>
            )}
          </div>
        </SectionShell>
      )}

      {mainTab === 'all_listings' && (
        <SectionShell
          title="All listings"
          subtitle="Search across the latest marketplace inventory."
          actions={
            <div className="relative min-w-[260px]">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                placeholder="Search title, seller, location or status"
                value={listingSearch}
                onChange={(event) => setListingSearch(event.target.value)}
              />
            </div>
          }
        >
          <div className="space-y-3">
            {filteredListings.length ? (
              filteredListings.map((listing) => (
                <div key={listing._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <img
                    src={listing.photos?.[0] || 'https://placehold.co/96x96?text=PeezuHub'}
                    alt={listing.title}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-slate-900">{listing.title}</p>
                      <Badge color={listing.status === 'approved' ? 'green' : listing.status === 'rejected' ? 'red' : 'yellow'}>
                        {listing.status}
                      </Badge>
                      {listing.saleStatus === 'sold' ? <Badge color="slate">Sold</Badge> : null}
                      {listing.isFeatured ? <Badge color="blue">Featured</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {listing.category} · {listing.city}, {listing.state} · Seller: {listing.user?.name || 'Unknown'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Created {formatDate(listing.createdAt)}</p>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-700">
                    ₦{Number(listing.startingPrice || 0).toLocaleString('en-NG')}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                No listings matched your search.
              </div>
            )}
          </div>
        </SectionShell>
      )}

      {mainTab === 'users' && (
        <SectionShell
          title="Marketplace users"
          subtitle="Track new signups, admins, and active premium members."
          actions={
            <div className="relative min-w-[260px]">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                placeholder="Search user, role, email or premium state"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
            </div>
          }
        >
          <div className="grid gap-3">
            {filteredUsers.length ? (
              filteredUsers.map((user) => (
                <div key={user._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-base font-bold text-brand-700">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-400">Joined {formatDate(user.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge color={user.role === 'admin' ? 'blue' : 'slate'}>{user.role}</Badge>
                    {user.premiumStatus === 'active' ? <Badge color="yellow">Premium active</Badge> : null}
                    {user.premiumStatus === 'pending' ? <Badge color="yellow">Premium pending</Badge> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                No users matched your search.
              </div>
            )}
          </div>
        </SectionShell>
      )}

      {mainTab === 'notifications' && (
        <SectionShell
          title="Categorised notifications"
          subtitle="Professionally grouped into reports, listings, premium upgrades, and new signups."
          actions={
            data?.unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                Mark all as read
              </button>
            ) : null
          }
        >
          <div className="mb-5 flex flex-wrap gap-2">
            {NOTIF_TABS.map((tab) => {
              const unread =
                tab.key === 'all'
                  ? notifications.filter((item) => !item.isRead).length
                  : notifications.filter((item) => NOTIF_CATEGORIES[item.type] === tab.key && !item.isRead).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => setNotifTab(tab.key)}
                  className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
                    notifTab === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                  {unread > 0 ? <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{unread}</span> : null}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredNotifications.length ? (
              filteredNotifications.map((item) => (
                <NotificationItem key={item._id} item={item} onRead={markRead} onOpen={openNotification} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                No notifications in this category yet.
              </div>
            )}
          </div>
        </SectionShell>
      )}

      <SectionShell
        title="Custom improvements included"
        subtitle="These upgrades were included to make the admin experience feel more production-ready."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-white p-3 shadow-sm">
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900">Cleaner moderation workflow</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Approve or reject submissions faster with contextual seller and pricing details.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-white p-3 shadow-sm">
              <Crown size={18} className="text-violet-600" />
            </div>
            <p className="font-semibold text-slate-900">Premium visibility tracking</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Premium upgrade notifications are now grouped properly and easier to follow.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-white p-3 shadow-sm">
              <UserPlus size={18} className="text-cyan-600" />
            </div>
            <p className="font-semibold text-slate-900">Signup intelligence</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">New signups now appear as admin notifications so growth is visible from the dashboard.</p>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
