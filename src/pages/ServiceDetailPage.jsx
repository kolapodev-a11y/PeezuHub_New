import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import client from '../api/client';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import RatingStars from '../components/RatingStars';
import SafetyBanner from '../components/SafetyBanner';
import useFetch from '../hooks/useFetch';
import { money, whatsappLink } from '../utils/format';
import { MapPin, MessageCircleWarning, Send, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(5, 'Please add a short review'),
});

const reportSchema = z.object({
  reporterName: z.string().trim().min(2, 'Enter your name'),
  reporterEmail: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  reason: z.string().trim().min(5, 'Explain why you are reporting this listing'),
});

const contactSchema = z.object({
  senderName: z.string().trim().min(2, 'Enter your name'),
  senderEmail: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  senderPhone: z.string().optional(),
  message: z.string().trim().min(5, 'Enter a message before sending'),
});

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-sm text-rose-600">{message}</p>;
}

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(0);
  const { data: listing, loading, error, setData } = useFetch(async () => {
    const { data } = await client.get(`/listings/${id}`);
    return data;
  }, [id]);

  const reviewForm = useForm({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 5, comment: '' } });
  const reportForm = useForm({ resolver: zodResolver(reportSchema), defaultValues: { reporterName: user?.name || '', reporterEmail: user?.email || '', reason: '' } });
  const contactForm = useForm({ resolver: zodResolver(contactSchema), defaultValues: { senderName: user?.name || '', senderEmail: user?.email || '', senderPhone: '', message: '' } });

  if (loading) return <Loader label="Loading listing details..." />;
  if (error) return <div className="card text-rose-600">{error}</div>;
  if (!listing) return null;

  const currentUserId = user?._id || user?.id;
  const ownerId = listing.user?._id || listing.user?.id;
  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);
  const isSold = listing.saleStatus === 'sold';
  const disableBuyerActions = isSold && !isOwner;
  const canContactSeller = !disableBuyerActions && !isOwner;
  const contactSubmitting = contactForm.formState.isSubmitting;
  const reportSubmitting = reportForm.formState.isSubmitting;
  const reviewSubmitting = reviewForm.formState.isSubmitting;

  async function submitReview(values) {
    try {
      const { data } = await client.post(`/listings/${id}/reviews`, values);
      setData(data);
      toast.success('Review posted');
      reviewForm.reset({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to post review');
    }
  }

  async function submitReport(values) {
    try {
      await client.post(`/listings/${id}/report`, values);
      toast.success('Report sent to admin');
      reportForm.reset({ reporterName: user?.name || '', reporterEmail: user?.email || '', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to report listing');
    }
  }

  async function submitContact(values) {
    try {
      await client.post(`/messages/contact/${id}`, values);
      toast.success('Message sent');
      contactForm.reset({ senderName: user?.name || '', senderEmail: user?.email || '', senderPhone: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send message');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
      <div className="space-y-6">
        <div className="card space-y-4 overflow-hidden p-0">
          <img src={listing.photos?.[activePhoto]} alt={listing.title} className="h-[320px] w-full object-cover md:h-[420px]" />
          <div className="grid grid-cols-4 gap-3 p-4">
            {listing.photos?.map((photo, index) => (
              <button key={index} className={`overflow-hidden rounded-2xl border ${activePhoto === index ? 'border-brand-600' : 'border-slate-100'}`} onClick={() => setActivePhoto(index)}>
                <img src={photo} alt={`${listing.title}-${index}`} className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex flex-wrap gap-2">
            {listing.isFeatured && <Badge color="yellow">Premium</Badge>}
            {listing.isVerified && <Badge color="green">Verified</Badge>}
            {isSold && <Badge color="yellow">Sold</Badge>}
            <Badge color="blue">{listing.category}</Badge>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">{listing.title}</h1>
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1"><MapPin size={16} /> {listing.city}, {listing.state}</span>
                <span>{listing.locationLabel}</span>
              </div>
            </div>
            <div className="rounded-3xl bg-brand-50 px-5 py-4 text-right text-brand-700">
              <p className="text-xs uppercase tracking-wide">Price</p>
              <p className="text-2xl font-bold">{money(listing.startingPrice)}</p>
              <p className="text-xs text-slate-500">{listing.priceLabel}</p>
            </div>
          </div>
          <p className="leading-8 text-slate-700">{listing.description}</p>
          {disableBuyerActions && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              This listing has been marked as sold by the owner, so buyer contact actions are turned off.
            </div>
          )}
          {isOwner && (
            <div className="rounded-3xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">
              This is your listing. Buyer actions, reviews and reporting are hidden for your own listing. You can manage it from your <Link to="/profile" className="font-semibold underline">profile dashboard</Link>.
            </div>
          )}
          <SafetyBanner compact />
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Rating & Reviews</h2>
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                <RatingStars rating={listing.averageRating} size={18} />
                <span>{listing.averageRating || 0} / 5 · {listing.reviewsCount || 0} review(s)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {listing.reviews?.map((review) => (
              <div key={review._id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{review.name}</p>
                  <RatingStars rating={review.rating} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment}</p>
              </div>
            ))}
            {!listing.reviews?.length && <p className="text-sm text-slate-500">No reviews yet.</p>}
          </div>

          {isOwner ? (
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              Owners cannot review or rate their own listings.
            </div>
          ) : user ? (
            <form className="grid gap-3 rounded-3xl border border-slate-100 p-4" onSubmit={reviewForm.handleSubmit(submitReview)}>
              <h3 className="font-semibold">Leave a review</h3>
              <select className="input" {...reviewForm.register('rating')}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} Star</option>)}
              </select>
              <textarea className="input min-h-[120px]" placeholder="Share your buying experience" {...reviewForm.register('comment')} />
              <FieldError message={reviewForm.formState.errors.comment?.message} />
              <button className="btn-primary" type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? 'Submitting...' : 'Submit review'}</button>
            </form>
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <Link to="/login" className="font-semibold text-brand-700">Sign in</Link> to leave a review after you interact with the seller.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card sticky top-24 space-y-4">
          <h2 className="text-xl font-bold">Contact seller</h2>
          {!canContactSeller ? (
            <button className="btn-primary w-full opacity-70" type="button" disabled>
              {isOwner ? 'This is your listing' : 'This listing is sold'}
            </button>
          ) : (
            <a className="btn-primary w-full gap-2" href={whatsappLink(listing.contact?.whatsapp, `Hello, I found your listing \"${listing.title}\" on PeezuHub. Is it still available?`)} target="_blank" rel="noreferrer">
              <Send size={18} /> WhatsApp Direct Link
            </a>
          )}

          {canContactSeller && (
            <form className="space-y-3" onSubmit={contactForm.handleSubmit(submitContact)}>
              <h3 className="font-semibold">In-app buyer message</h3>
              <input className="input" placeholder="Your name" {...contactForm.register('senderName')} />
              <FieldError message={contactForm.formState.errors.senderName?.message} />
              <input className="input" placeholder="Your email (optional)" {...contactForm.register('senderEmail')} />
              <FieldError message={contactForm.formState.errors.senderEmail?.message} />
              <input className="input" placeholder="Phone (optional)" {...contactForm.register('senderPhone')} />
              <textarea className="input min-h-[120px]" placeholder="Hi, I'm interested in buying this. Is it still available?" {...contactForm.register('message')} />
              <FieldError message={contactForm.formState.errors.message?.message} />
              <button className="btn-secondary w-full" type="submit" disabled={contactSubmitting}>{contactSubmitting ? 'Sending...' : 'Send message'}</button>
            </form>
          )}

          {isOwner ? (
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              Owners cannot report their own listings.
            </div>
          ) : (
            <form className="space-y-3 rounded-3xl border border-rose-100 bg-rose-50 p-4" onSubmit={reportForm.handleSubmit(submitReport)}>
              <div className="flex items-center gap-2 text-rose-700"><ShieldAlert size={18} /><h3 className="font-semibold">Report Listing</h3></div>
              <input className="input" placeholder="Your name" {...reportForm.register('reporterName')} />
              <FieldError message={reportForm.formState.errors.reporterName?.message} />
              <input className="input" placeholder="Your email (optional)" {...reportForm.register('reporterEmail')} />
              <FieldError message={reportForm.formState.errors.reporterEmail?.message} />
              <textarea className="input min-h-[110px]" placeholder="Why are you reporting this listing?" {...reportForm.register('reason')} />
              <FieldError message={reportForm.formState.errors.reason?.message} />
              <button className="btn-secondary w-full border-rose-200 bg-white text-rose-700" type="submit" disabled={reportSubmitting}><MessageCircleWarning size={18} /> {reportSubmitting ? 'Sending report...' : 'Report User/Listing'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
