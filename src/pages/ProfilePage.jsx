import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import Loader from '../components/Loader';
import SafetyBanner from '../components/SafetyBanner';
import ManageListingCard from '../components/ManageListingCard';
import ListingEditorModal from '../components/ListingEditorModal';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
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
  const activeListingsCount = useMemo(() => data?.listings?.filter((item) => item.saleStatus !== 'sold').length || 0, [data?.listings]);

  function replaceListing(updatedListing) {
    setData((current) => ({
      ...current,
      listings: current.listings.map((item) => item._id === updatedListing._id ? updatedListing : item),
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

  async function handleUpgrade(listing) {
    const loadingKey = `${listing._id}:upgrade`;

    try {
      setActionLoadingKey(loadingKey);
      const { data } = await client.post('/payments/paystack/initialize', { listingId: listing._id });
      window.location.href = data.authorizationUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to start premium upgrade.');
      setActionLoadingKey('');
    }
  }

  function handleSavedListing(updatedListing) {
    replaceListing(updatedListing);
    setEditingListing(null);
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome, {user?.name}. Manage your listings, premium upgrades and incoming buyer messages from here.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <div className="rounded-3xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <p className="font-semibold text-slate-900">Account</p>
            <p className="mt-1 break-all">{user?.email}</p>
            <p className="mt-1">Role: {user?.role}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Quick stats</p>
            <p className="mt-1">Listings: {data?.listings?.length || 0}</p>
            <p className="mt-1">Active/available: {activeListingsCount}</p>
            <button className="btn-secondary mt-4 w-full" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>

      {upgradeRequested && (
        <div className="rounded-3xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">
          Choose any eligible listing below and tap <strong>Upgrade</strong> to continue to Paystack. Premium listings get a verified badge, top homepage placement and stronger visibility.
        </div>
      )}

      {loading ? <Loader label="Loading your dashboard..." /> : error ? <div className="card text-rose-600">{error}</div> : (
        <div className="grid gap-6 lg:grid-cols-[1fr,0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">My Listings</h2>
              <span className="text-sm text-slate-500">Edit, mark sold, delete or upgrade from here.</span>
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
                  actionLoading={actionLoadingKey.startsWith(`${listing._id}:`)}
                />
              ))}
            </div>
            {!data?.listings?.length && <div className="card text-sm text-slate-500">You have not posted any listing yet.</div>}
          </div>

          <div className="space-y-4">
            <SafetyBanner />
            <div className="card space-y-4">
              <h2 className="text-xl font-bold">Contact Requests</h2>
              <div className="space-y-3">
                {data?.inbox?.map((item) => (
                  <div key={item._id} className="rounded-3xl border border-slate-100 p-4 text-sm">
                    <p className="font-semibold text-slate-900">{item.senderName} {item.listing?.title ? `• ${item.listing.title}` : ''}</p>
                    <p className="mt-2 leading-6 text-slate-600">{item.message}</p>
                    <p className="mt-3 text-xs text-slate-500">Email: {item.senderEmail || '-'} · Phone: {item.senderPhone || '-'}</p>
                  </div>
                ))}
                {!data?.inbox?.length && <div className="rounded-3xl border border-slate-100 p-4 text-sm text-slate-500">No enquiries yet.</div>}
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
