import ListingCard from './ListingCard';

export default function FeaturedCarousel({ listings = [] }) {
  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-2">
      {listings.length ? listings.map((listing) => (
        <div key={listing._id} className="min-w-[280px] snap-start md:min-w-[320px]">
          <ListingCard listing={listing} />
        </div>
      )) : (
        <div className="card w-full text-sm text-slate-500">No featured listings yet. Premium placements will appear here.</div>
      )}
    </div>
  );
}
