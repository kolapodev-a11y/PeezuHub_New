import { Link } from 'react-router-dom';
import { Edit3, Eye, ShieldCheck, Star, Tag, Trash2 } from 'lucide-react';
import Badge from './Badge';
import RatingStars from './RatingStars';
import { formatDate, money, truncate } from '../utils/format';

export default function ManageListingCard({
  listing,
  onEdit,
  onToggleSaleStatus,
  onDelete,
  onUpgrade,
  actionLoading,
  accountPremiumActive,
  accountPremiumPending,
}) {
  const premiumCoverageActive = listing.premiumPaymentStatus === 'paid' && listing.featuredUntil && new Date(listing.featuredUntil) > new Date();
  const isSold = listing.saleStatus === 'sold';

  return (
    <div className="card overflow-hidden p-0">
      <div className="relative h-48 bg-slate-100">
        <img src={listing.photos?.[0]} alt={listing.title} className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.status === 'pending' && <Badge color="slate">Pending Review</Badge>}
          {listing.status === 'approved' && <Badge color="green">Approved</Badge>}
          {listing.status === 'rejected' && <Badge color="red">Rejected</Badge>}
          {isSold && <Badge color="yellow">Sold</Badge>}
          {listing.isFeatured && <Badge color="yellow">Premium</Badge>}
          {listing.isVerified && !isSold && <Badge color="green">Verified</Badge>}
          {premiumCoverageActive && !listing.isFeatured && <Badge color="blue">Premium Ready</Badge>}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{listing.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{listing.category}</p>
          </div>
          <p className="text-sm font-semibold text-brand-700">{money(listing.startingPrice)}</p>
        </div>

        <p className="text-sm leading-6 text-slate-600">{truncate(listing.description, 120)}</p>

        <div className="grid gap-2 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
          <p><strong>Status:</strong> {listing.status}</p>
          <p><strong>Sale status:</strong> {listing.saleStatus}</p>
          <p><strong>Location:</strong> {listing.city}, {listing.state}</p>
          {premiumCoverageActive && <p><strong>Premium coverage until:</strong> {formatDate(listing.featuredUntil)}</p>}
          {listing.rejectionReason && <p className="text-rose-600"><strong>Reason:</strong> {listing.rejectionReason}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <RatingStars rating={listing.averageRating} size={14} />
            <span>({listing.reviewsCount || 0})</span>
          </div>
          <span>{listing.priceLabel}</span>
        </div>

        {(accountPremiumActive || accountPremiumPending) && (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-700">
            <span className="inline-flex items-center gap-1 font-semibold">
              <ShieldCheck size={14} />
              {accountPremiumActive
                ? 'Your seller premium covers this listing automatically.'
                : 'Premium payment is pending verification for your account.'}
            </span>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <Link to={`/listings/${listing._id}`} className="btn-secondary">
            <Eye size={16} />
            View
          </Link>
          <button className="btn-secondary" type="button" onClick={() => onEdit(listing)} disabled={actionLoading}>
            <Edit3 size={16} />
            Edit
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => onToggleSaleStatus(listing)}
            disabled={actionLoading}
          >
            <Tag size={16} />
            {isSold ? 'Mark Available' : 'Mark as Sold'}
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={onUpgrade}
            disabled={actionLoading || accountPremiumActive || accountPremiumPending}
          >
            <Star size={16} />
            {accountPremiumActive ? 'Premium Active' : accountPremiumPending ? 'Upgrade Pending' : 'Upgrade Account'}
          </button>
          <button
            className="btn-secondary sm:col-span-2 border-rose-200 bg-white text-rose-700"
            type="button"
            onClick={() => onDelete(listing)}
            disabled={actionLoading}
          >
            <Trash2 size={16} />
            Delete Listing
          </button>
        </div>
      </div>
    </div>
  );
}
