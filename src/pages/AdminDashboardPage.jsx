import { useState } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import useFetch from '../hooks/useFetch';

export default function AdminDashboardPage() {
  const [reasons, setReasons] = useState({});
  const { data, loading, error, setData } = useFetch(async () => {
    const [dashboardRes, notificationsRes] = await Promise.all([
      client.get('/listings/admin/dashboard'),
      client.get('/notifications'),
    ]);
    return { ...dashboardRes.data, notifications: notificationsRes.data.notifications };
  }, []);

  async function moderate(id, action) {
    try {
      const { data: updated } = await client.patch(`/listings/${id}/status`, { action, reason: reasons[id] || '' });
      setData((prev) => ({
        ...prev,
        pendingListings: prev.pendingListings.filter((item) => item._id !== id),
      }));
      toast.success(`${updated.title} ${action}d`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Moderation failed');
    }
  }

  if (loading) return <Loader label="Loading admin dashboard..." />;
  if (error) return <div className="card text-rose-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="section-title">Private Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Visible only to admin – PeezuTech ({' '}<a className="font-semibold text-brand-700" href="mailto:peezutech@gmail.com">peezutech@gmail.com</a>{' '}·{' '}<a className="font-semibold text-brand-700" href="https://peezutech.name.ng" target="_blank" rel="noreferrer">peezutech.name.ng</a>)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge color="yellow">Pending {data?.pendingCount || 0}</Badge>
          <Badge color="blue">Reports {data?.reports?.length || 0}</Badge>
          <Badge color="green">Notifications {data?.unreadNotifications || 0}</Badge>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Pending Listings</h2>
        <div className="space-y-4">
          {data?.pendingListings?.map((listing) => (
            <div key={listing._id} className="card space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{listing.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{listing.category} · {listing.city}, {listing.state} · ₦{listing.startingPrice}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{listing.description}</p>
                  <p className="mt-3 text-xs text-slate-500">Submitter: {listing.user?.name} ({listing.user?.email})</p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:w-60">
                  {listing.photos?.slice(0, 2).map((photo, index) => <img key={index} src={photo} alt={listing.title} className="h-24 w-full rounded-2xl object-cover" />)}
                </div>
              </div>
              <textarea
                className="input min-h-[90px]"
                placeholder="Short rejection reason (required only when rejecting)"
                value={reasons[listing._id] || ''}
                onChange={(e) => setReasons((prev) => ({ ...prev, [listing._id]: e.target.value }))}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="btn-primary" onClick={() => moderate(listing._id, 'approve')}>Approve</button>
                <button className="btn-secondary border-rose-200 text-rose-700" onClick={() => moderate(listing._id, 'reject')}>Reject</button>
              </div>
            </div>
          ))}
          {!data?.pendingListings?.length && <div className="card text-sm text-slate-500">No pending listings right now.</div>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Reports</h2>
          <div className="space-y-3">
            {data?.reports?.map((report) => (
              <div key={report._id} className="card text-sm">
                <p className="font-semibold">{report.listing?.title}</p>
                <p className="mt-2 text-slate-600">{report.reason}</p>
                <p className="mt-3 text-xs text-slate-500">Reporter: {report.reporterName} · {report.reporterEmail || '-'}</p>
              </div>
            ))}
            {!data?.reports?.length && <div className="card text-sm text-slate-500">No open reports.</div>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Notifications</h2>
          <div className="space-y-3">
            {data?.notifications?.map((item) => (
              <div key={item._id} className="card text-sm">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!data?.notifications?.length && <div className="card text-sm text-slate-500">No notifications yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
