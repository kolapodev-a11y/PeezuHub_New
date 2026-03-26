import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  Crown,
  LayoutGrid,
  LogOut,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import Loader from '../components/Loader';
import SafetyBanner from '../components/SafetyBanner';
import ManageListingCard from '../components/ManageListingCard';
import ListingEditorModal from '../components/ListingEditorModal';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

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

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const [editingListing, setEditingListing] = useState(null);
  const [actionLoadingKey, setActionLoadingKey] = useState('');

  const { data, loading, error, setData } = useFetch(async () => {
    const [listingsRes, inboxRes] = await Promise.all([
      client.get('/listings/mine'),
      client.get('/messages/inbox'),
    ]);
    return { listings: listingsRes.data, inbox: inboxRes.data };
  }, []);

  const upgradeRequested = params.get('upgrade') === '1';
  const premiumActive = isPremiumActive(user);
  const premiumPending = isPremiumPending(user);

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

  async function handleSavedListing(updatedListing) {
    replaceListing(updatedListing);
    await refreshUser();
    setEditingListing(null);
  }

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
          <button
            className="btn-primary w-full"
            onClick={handleUpgrade}
            disabled={actionLoadingKey === 'account:upgrade' || premiumActive || premiumPending}
          >
            <Sparkles size={18} />
            {premiumActive ? 'Premium Active' : premiumPending ? 'Upgrade Pending' : 'Upgrade Account'}
          </button>
          <button className="btn-secondary w-full" onClick={logout}>
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
            <div className="card space-y-4">
              <h2 className="inline-flex items-center gap-2 text-xl font-bold"><MessageSquareText size={20} /> Contact Requests</h2>
              <div className="space-y-3">
                {data?.inbox?.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-100 p-4 text-sm">
                    <p className="font-semibold text-slate-900">{item.senderName} {item.listing?.title ? `• ${item.listing.title}` : ''}</p>
                    <p className="mt-2 leading-6 text-slate-600">{item.message}</p>
                    <p className="mt-3 text-xs text-slate-500">Email: {item.senderEmail || '-'} · Phone: {item.senderPhone || '-'}</p>
                  </div>
                ))}
                {!data?.inbox?.length && <div className="rounded-3xl border border-slate-100 p-4 text-sm text-slate-500">No buyer enquiries yet.</div>}
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
    </div>
  );
}
