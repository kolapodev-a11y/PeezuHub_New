import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Badge from './Badge';
import RatingStars from './RatingStars';
import { money, truncate } from '../utils/format';

export default function ListingCard({ listing }) {
  const isSold = listing.saleStatus === 'sold';

  return (
    <Link to={`/listings/${listing._id}`} className="card block overflow-hidden p-0 transition hover:-translate-y-1">
      <div className="relative h-44 bg-slate-100">
        <img src={listing.photos?.[0]} alt={listing.title} className={`h-full w-full object-cover ${isSold ? 'opacity-80' : ''}`} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.isFeatured && <Badge color="yellow">Premium</Badge>}
          {listing.isVerified && <Badge color="green">Verified</Badge>}
          {isSold && <Badge color="yellow">Sold</Badge>}
          {listing.status === 'pending' && <Badge color="slate">Pending</Badge>}
          {listing.status === 'rejected' && <Badge color="red">Rejected</Badge>}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">{listing.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{listing.category}</p>
          </div>
          <p className="text-sm font-semibold text-brand-700">{money(listing.startingPrice)}</p>
        </div>
        <p className="text-sm leading-6 text-slate-600">{truncate(listing.description, 90)}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={14} /> {listing.city}, {listing.state}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RatingStars rating={listing.averageRating} size={14} /> ({listing.reviewsCount || 0})
          </div>
        </div>
      </div>
    </Link>
  );
}
