import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import client from '../api/client';
import { CATEGORIES, STATES } from '../constants/data';

export default function ListingEditorModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0]?.name || '',
    description: '',
    state: STATES[1] || 'Lagos',
    city: '',
    locationLabel: '',
    startingPrice: 0,
    priceLabel: 'Asking price',
    whatsapp: '',
    email: '',
    phone: '',
  });
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!listing) return;
    setForm({
      title: listing.title || '',
      category: listing.category || CATEGORIES[0]?.name || '',
      description: listing.description || '',
      state: listing.state || STATES[1] || 'Lagos',
      city: listing.city || '',
      locationLabel: listing.locationLabel || '',
      startingPrice: listing.startingPrice || 0,
      priceLabel: listing.priceLabel || 'Asking price',
      whatsapp: listing.contact?.whatsapp || '',
      email: listing.contact?.email || '',
      phone: listing.contact?.phone || '',
    });
    setExistingPhotos(listing.photos || []);
    setNewFiles([]);
  }, [listing]);

  const remainingSlots = useMemo(() => Math.max(0, 4 - existingPhotos.length), [existingPhotos.length]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function removeExistingPhoto(photo) {
    setExistingPhotos((current) => current.filter((item) => item !== photo));
  }

  function handleNewFiles(files) {
    const next = Array.from(files || []).slice(0, remainingSlots);
    setNewFiles(next);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!existingPhotos.length && !newFiles.length) {
      toast.error('Keep at least one photo or upload a new one.');
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append('keepPhotos', JSON.stringify(existingPhotos));
      payload.append('safetyAccepted', 'true');
      newFiles.forEach((file) => payload.append('photos', file));

      const { data } = await client.patch(`/listings/${listing._id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Listing updated and sent back for moderation review.');
      onSaved(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update listing.');
    } finally {
      setSaving(false);
    }
  }

  if (!listing) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
      <div className="mx-auto max-w-4xl rounded-[28px] bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Edit Listing</h3>
            <p className="mt-1 text-sm text-slate-500">After saving, the listing returns to moderation so the updated content can be reviewed.</p>
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-500" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="space-y-5 p-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Title</label>
              <input className="input" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Clean Toyota Corolla for sale" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <select className="input" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map((category) => <option key={category.name}>{category.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">State</label>
              <select className="input" value={form.state} onChange={(e) => updateField('state', e.target.value)}>
                {STATES.filter((item) => item !== 'All States').map((state) => <option key={state}>{state}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">City</label>
              <input className="input" value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Akure" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Location label</label>
              <input className="input" value={form.locationLabel} onChange={(e) => updateField('locationLabel', e.target.value)} placeholder="Main town, Akure" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Price</label>
              <input type="number" className="input" value={form.startingPrice} onChange={(e) => updateField('startingPrice', e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Price label</label>
              <input className="input" value={form.priceLabel} onChange={(e) => updateField('priceLabel', e.target.value)} placeholder="Asking price" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Description</label>
              <textarea className="input min-h-[140px]" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe what you are selling, condition, delivery options and why buyers should trust you." />
            </div>

            <div className="md:col-span-2 grid gap-3 rounded-3xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Current photos</p>
                <p className="mt-1 text-xs text-slate-500">Keep up to 4 photos. Remove any photo you no longer want buyers to see.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {existingPhotos.map((photo) => (
                  <div key={photo} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img src={photo} alt="Listing" className="h-28 w-full object-cover" />
                    <button type="button" className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-rose-600" onClick={() => removeExistingPhoto(photo)}>
                      Remove
                    </button>
                  </div>
                ))}
                {!existingPhotos.length && <p className="text-sm text-slate-500">No saved photos yet.</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Upload new photos</label>
                <input type="file" accept="image/*" multiple className="input" onChange={(e) => handleNewFiles(e.target.files)} disabled={remainingSlots === 0} />
                <p className="mt-2 text-xs text-slate-500">You can add {remainingSlots} more photo(s). New uploads are added beside the photos you keep.</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">WhatsApp number</label>
              <input className="input" value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} placeholder="2348012345678" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input className="input" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="08012345678" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
