import client from '../api/client';
import ListingCard from '../components/ListingCard';
import Loader from '../components/Loader';
import SafetyBanner from '../components/SafetyBanner';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch(async () => {
    const [listingsRes, inboxRes] = await Promise.all([
      client.get('/listings/mine'),
      client.get('/messages/inbox'),
    ]);
    return { listings: listingsRes.data, inbox: inboxRes.data };
  }, []);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome, {user?.name}. Manage your listings and review incoming contact requests.</p>
        </div>
        <div className="rounded-3xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {user?.email}<br />Role: {user?.role}
        </div>
      </div>

      <SafetyBanner />

      {loading ? <Loader label="Loading your dashboard..." /> : error ? <div className="card text-rose-600">{error}</div> : (
        <div className="grid gap-6 lg:grid-cols-[1fr,0.8fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">My Listings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data?.listings?.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
            </div>
            {!data?.listings?.length && <div className="card text-sm text-slate-500">You have not posted any listing yet.</div>}
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Contact Requests</h2>
            <div className="space-y-3">
              {data?.inbox?.map((item) => (
                <div key={item._id} className="card text-sm">
                  <p className="font-semibold text-slate-900">{item.senderName} • {item.listing?.title}</p>
                  <p className="mt-2 text-slate-600">{item.message}</p>
                  <p className="mt-3 text-xs text-slate-500">Email: {item.senderEmail || '-'} · Phone: {item.senderPhone || '-'}</p>
                </div>
              ))}
              {!data?.inbox?.length && <div className="card text-sm text-slate-500">No enquiries yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
