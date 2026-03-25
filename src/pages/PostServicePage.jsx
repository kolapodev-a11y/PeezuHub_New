import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import client from '../api/client';
import { CATEGORIES, STATES } from '../constants/data';
import SafetyBanner from '../components/SafetyBanner';

const schema = z.object({
  title: z.string().min(5),
  category: z.string().min(2),
  description: z.string().min(20),
  state: z.string().min(2),
  city: z.string().min(2),
  locationLabel: z.string().optional(),
  startingPrice: z.coerce.number().min(0),
  priceLabel: z.string().min(2),
  whatsapp: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  premiumRequested: z.boolean().default(false),
  safetyAccepted: z.literal(true),
});

export default function PostServicePage() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdListing, setCreatedListing] = useState(null);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: CATEGORIES[0].name,
      description: '',
      state: 'Lagos',
      city: '',
      locationLabel: '',
      startingPrice: 0,
      priceLabel: 'Starting from',
      whatsapp: '',
      email: '',
      phone: '',
      premiumRequested: false,
      safetyAccepted: false,
    },
  });

  const values = form.watch();
  const stepReady = useMemo(() => ({
    1: values.title && values.description && values.city && files.length > 0,
    2: values.whatsapp,
    3: values.safetyAccepted,
  }), [values, files]);

  async function submit(values) {
    if (!files.length) {
      toast.error('At least one photo is required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = new FormData();
      Object.entries(values).forEach(([key, value]) => payload.append(key, value));
      files.forEach((file) => payload.append('photos', file));
      const { data } = await client.post('/listings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCreatedListing(data.listing);
      toast.success(data.listing.status === 'rejected' ? 'Listing auto-rejected by safety filter' : 'Listing submitted for moderation');

      if (data.paymentNeeded) {
        const paymentRes = await client.post('/payments/paystack/initialize', { listingId: data.listing._id });
        window.location.href = paymentRes.data.authorizationUrl;
        return;
      }
      form.reset();
      setFiles([]);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit listing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,0.36fr]">
      <div className="card space-y-6">
        <div>
          <h1 className="section-title">Post New Service</h1>
          <p className="mt-1 text-sm text-slate-500">Submit your business or freelance service in three quick steps. All listings are moderated before going live.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${step === item ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}>
              Step {item}
            </div>
          ))}
        </div>

        <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Title</label>
                <input className="input" placeholder="Professional website design for SMEs" {...form.register('title')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Category</label>
                <select className="input" {...form.register('category')}>
                  {CATEGORIES.map((category) => <option key={category.name}>{category.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">State</label>
                <select className="input" {...form.register('state')}>
                  {STATES.filter((item) => item !== 'All States').map((state) => <option key={state}>{state}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">City</label>
                <input className="input" placeholder="Ikeja" {...form.register('city')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Location label</label>
                <input className="input" placeholder="Allen Avenue, Ikeja" {...form.register('locationLabel')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Starting price</label>
                <input type="number" className="input" {...form.register('startingPrice')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Price label</label>
                <input className="input" placeholder="Starting from" {...form.register('priceLabel')} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Description</label>
                <textarea className="input min-h-[140px]" placeholder="Describe your service, turnaround time, target clients and what makes you trustworthy." {...form.register('description')} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Required photo upload</label>
                <input type="file" accept="image/*" multiple className="input" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 4))} />
                <p className="mt-2 text-xs text-slate-500">Upload 1 to 4 photos. Images are stored directly for easy MVP deployment.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">WhatsApp number (mandatory)</label>
                <input className="input" placeholder="2348012345678" {...form.register('whatsapp')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Optional email</label>
                <input className="input" placeholder="you@example.com" {...form.register('email')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Optional phone</label>
                <input className="input" placeholder="08012345678" {...form.register('phone')} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input type="checkbox" className="mt-1" {...form.register('premiumRequested')} />
                <span>
                  <span className="block font-semibold">Feature my listing for ₦5,000/month</span>
                  <span className="mt-1 block text-sm text-slate-500">Top carousel placement + VERIFIED badge after successful Paystack payment.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <input type="checkbox" className="mt-1" {...form.register('safetyAccepted')} />
                <span className="text-sm font-medium leading-6">I confirm I will not request advance payments outside trusted methods and accept full responsibility.</span>
              </label>
              <SafetyBanner compact />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" className="btn-secondary" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>
            {step < 3 ? (
              <button type="button" className="btn-primary" disabled={!stepReady[step]} onClick={() => setStep((current) => current + 1)}>Continue</button>
            ) : (
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit listing'}</button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <SafetyBanner />
        <div className="card space-y-3">
          <h3 className="text-lg font-bold">Moderation flow</h3>
          <p className="text-sm text-slate-600">All new listings start as <strong>Pending</strong>. PeezuTech reviews submissions, rejects scammy content, and can send a reason for rejected entries.</p>
          {createdListing && (
            <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-700">
              Last submission: <strong>{createdListing.title}</strong><br />Status: {createdListing.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
