/**
 * AdminDashboardPage.jsx — PeezuHub
 *
 * IMPROVEMENTS:
 *  1. Stats-card row (Pending Review, Open Reports, Total Listings,
 *     Total Users, Premium Users, Unread Alerts)
 *  2. Main tab bar: Pending | Reports | All Listings | Users | Notifications
 *  3. Notifications sub-tabs: All | Reports | Listings | Premium | New Signups
 *  4. Mark-all-read button on Notifications tab
 *  5. Refresh button reloads all data
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import useFetch from '../hooks/useFetch';

/* ─── Notification type → category mapping ─────────────────────────────── */
const NOTIF_CATEGORIES = {
  report: 'reports',
  submission: 'listings',
  moderation: 'listings',
  premium_upgrade_paid: 'premium',
  premium_upgrade_pending: 'premium',
  new_signup: 'signups',
};

const NOTIF_TABS = [
  { key: 'all',     label: 'All' },
  { key: 'reports', label: 'Reports' },
  { key: 'listings',label: 'Listings' },
  { key: 'premium', label: 'Premium' },
  { key: 'signups', label: 'New Signups' },
];

const MAIN_TABS = [
  { key: 'pending',       label: 'Pending' },
  { key: 'reports',       label: 'Reports' },
  { key: 'all_listings',  label: 'All Listings' },
  { key: 'users',         label: 'Users' },
  { key: 'notifications', label: 'Notifications' },
];

/* ─── Colour helpers ──────────────────────────────────────────────────────── */
const NOTIF_ICON = {
  report:                   { icon: '🚩', color: '#dc2626', bg: '#fef2f2' },
  submission:               { icon: '📋', color: '#2563eb', bg: '#eff6ff' },
  moderation:               { icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
  premium_upgrade_paid:     { icon: '⭐', color: '#7c3aed', bg: '#f5f3ff' },
  premium_upgrade_pending:  { icon: '⏳', color: '#d97706', bg: '#fffbeb' },
  new_signup:               { icon: '👤', color: '#0891b2', bg: '#ecfeff' },
};

function notifStyle(type) {
  return NOTIF_ICON[type] || { icon: '🔔', color: '#64748b', bg: '#f8fafc' };
}

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, iconBg }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ─── Notification item ─────────────────────────────────────────────────── */
function NotifItem({ item, onRead }) {
  const { icon, color, bg } = notifStyle(item.type);
  return (
    <div
      className={`card flex items-start gap-3 p-4 transition-opacity ${item.isRead ? 'opacity-60' : ''}`}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color }}>
          {item.title}
        </p>
        <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">{item.message}</p>
        <p className="mt-1 text-xs text-slate-400">
          {new Date(item.createdAt).toLocaleString('en-NG', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      </div>
      {!item.isRead && (
        <button
          onClick={() => onRead(item._id)}
          className="shrink-0 text-xs text-brand-600 hover:text-brand-800 font-medium"
        >
          Mark read
        </button>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const [mainTab,   setMainTab]   = useState('pending');
  const [notifTab,  setNotifTab]  = useState('all');
  const [reasons,   setReasons]   = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, setData } = useFetch(async () => {
    const [dashRes, notifRes, usersRes] = await Promise.all([
      client.get('/listings/admin/dashboard'),
      client.get('/notifications'),
      client.get('/auth/admin/users'),
    ]);
    return {
      ...dashRes.data,
      notifications: notifRes.data.notifications,
      unreadCount:   notifRes.data.unreadCount,
      users:         usersRes.data.users,
    };
  }, [refreshKey]);

  /* ── Refresh ── */
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  /* ── Moderation ── */
  async function moderate(id, action) {
    try {
      const { data: updated } = await client.patch(`/listings/${id}/status`, {
        action,
        reason: reasons[id] || '',
      });
      setData((prev) => ({
        ...prev,
        pendingListings: prev.pendingListings.filter((item) => item._id !== id),
        pendingCount: Math.max(0, (prev.pendingCount || 1) - 1),
      }));
      toast.success(`${updated.title} ${action}d`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Moderation failed');
    }
  }

  /* ── Mark single notification read ── */
  async function markRead(id) {
    try {
      await client.patch(`/notifications/${id}/read`);
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, (prev.unreadCount || 1) - 1),
      }));
    } catch {
      toast.error('Could not mark as read');
    }
  }

  /* ── Mark all read ── */
  async function markAllRead() {
    try {
      await client.patch('/notifications/read-all');
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  if (loading) return <Loader label="Loading admin dashboard…" />;
  if (error)   return <div className="card text-rose-600">{error}</div>;

  /* ── Filtered notifications ── */
  const allNotifs = data?.notifications || [];
  const filteredNotifs =
    notifTab === 'all'
      ? allNotifs
      : allNotifs.filter((n) => NOTIF_CATEGORIES[n.type] === notifTab);

  const unreadInTab = filteredNotifs.filter((n) => !n.isRead).length;

  /* ── All listings (approved + pending + rejected) ── */
  const allListings = [
    ...(data?.pendingListings || []),
  ];

  /* ─────────────────────────────────────────────────── RENDER ─────── */
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            PeezuTech —{' '}
            <a className="font-semibold text-brand-700" href="mailto:peezutech@gmail.com">
              peezutech@gmail.com
            </a>
          </p>
        </div>
        <button
          onClick={refresh}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon="🔔" label="Pending Review"   value={data?.pendingCount || 0}      iconBg="#fff7ed" />
        <StatCard icon="🚩" label="Open Reports"     value={data?.reports?.length || 0}   iconBg="#fef2f2" />
        <StatCard icon="📋" label="Total Listings"   value={data?.totalListings ?? 0}     iconBg="#eff6ff" />
        <StatCard icon="👥" label="Total Users"      value={data?.totalUsers ?? 0}        iconBg="#f0fdf4" />
        <StatCard icon="⭐" label="Premium Users"    value={data?.premiumUsers ?? 0}      iconBg="#f5f3ff" />
        <StatCard icon="📬" label="Unread Alerts"    value={data?.unreadCount ?? 0}       iconBg="#ecfeff" />
      </div>

      {/* ── Main tab bar ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-0">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`rounded-t-xl px-4 py-2 text-sm font-semibold transition-colors ${
              mainTab === tab.key
                ? 'border-b-2 border-brand-600 text-brand-700 bg-brand-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && (data?.pendingCount || 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {data.pendingCount}
              </span>
            )}
            {tab.key === 'reports' && (data?.reports?.length || 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {data.reports.length}
              </span>
            )}
            {tab.key === 'notifications' && (data?.unreadCount || 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {data.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB PANELS ══════════════ */}

      {/* ── Pending Listings ── */}
      {mainTab === 'pending' && (
        <section className="space-y-4">
          {data?.pendingListings?.length ? (
            data.pendingListings.map((listing) => (
              <div key={listing._id} className="card space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{listing.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {listing.category} · {listing.city}, {listing.state} · ₦
                      {Number(listing.startingPrice).toLocaleString('en-NG')}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{listing.description}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      Submitter: {listing.user?.name} ({listing.user?.email})
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:w-60">
                    {listing.photos?.slice(0, 2).map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={listing.title}
                        className="h-24 w-full rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                </div>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Short rejection reason (required only when rejecting)"
                  value={reasons[listing._id] || ''}
                  onChange={(e) =>
                    setReasons((prev) => ({ ...prev, [listing._id]: e.target.value }))
                  }
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="btn-primary" onClick={() => moderate(listing._id, 'approve')}>
                    ✅ Approve
                  </button>
                  <button
                    className="btn-secondary border-rose-200 text-rose-700"
                    onClick={() => moderate(listing._id, 'reject')}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-sm text-slate-500">No pending listings right now. 🎉</div>
          )}
        </section>
      )}

      {/* ── Reports ── */}
      {mainTab === 'reports' && (
        <section className="space-y-3">
          {data?.reports?.length ? (
            data.reports.map((report) => (
              <div key={report._id} className="card text-sm space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 text-base">🚩</span>
                  <div>
                    <p className="font-semibold text-slate-900">{report.listing?.title}</p>
                    <p className="mt-1 text-slate-600">{report.reason}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Reporter: {report.reporterName}
                      {report.reporterEmail ? ` · ${report.reporterEmail}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-sm text-slate-500">No open reports. ✅</div>
          )}
        </section>
      )}

      {/* ── All Listings ── */}
      {mainTab === 'all_listings' && (
        <section className="space-y-3">
          {allListings.length ? (
            allListings.map((listing) => (
              <div key={listing._id} className="card flex items-center gap-4 p-4">
                {listing.photos?.[0] && (
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="h-14 w-14 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">{listing.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {listing.category} · {listing.city}, {listing.state}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    listing.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : listing.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {listing.status}
                </span>
              </div>
            ))
          ) : (
            <div className="card text-sm text-slate-500">
              No listings loaded. Pending listings show here — full listing search coming soon.
            </div>
          )}
          <p className="text-xs text-slate-400 pl-1">
            Showing pending listings · Total in DB: {data?.totalListings ?? '—'}
          </p>
        </section>
      )}

      {/* ── Users ── */}
      {mainTab === 'users' && (
        <section className="space-y-3">
          {data?.users?.length ? (
            data.users.map((user) => (
              <div key={user._id} className="card flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 break-all">{user.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.role}
                  </span>
                  {user.premiumStatus === 'active' && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      ⭐ Premium
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-sm text-slate-500">No users found.</div>
          )}
        </section>
      )}

      {/* ── Notifications ── */}
      {mainTab === 'notifications' && (
        <section className="space-y-4">
          {/* Sub-tab bar + mark all read */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap gap-2">
              {NOTIF_TABS.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? allNotifs.filter((n) => !n.isRead).length
                    : allNotifs.filter(
                        (n) => NOTIF_CATEGORIES[n.type] === tab.key && !n.isRead,
                      ).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setNotifTab(tab.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      notifTab === tab.key
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-1.5 rounded-full bg-white/30 px-1.5 text-[10px]">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {(data?.unreadCount || 0) > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="space-y-3">
            {filteredNotifs.length ? (
              filteredNotifs.map((item) => (
                <NotifItem key={item._id} item={item} onRead={markRead} />
              ))
            ) : (
              <div className="card text-sm text-slate-500">
                No {notifTab === 'all' ? '' : notifTab + ' '}notifications yet.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
