import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { CATEGORIES, STATES } from '../constants/data';
import FilterChips from '../components/FilterChips';
import ListingCard from '../components/ListingCard';
import Loader from '../components/Loader';
import useFetch from '../hooks/useFetch';

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [stateFilter, setStateFilter] = useState(params.get('state') || 'All States');
  const [categoryFilter, setCategoryFilter] = useState(params.get('category') || 'All Categories');
  const [sort, setSort] = useState(params.get('sort') || 'newest');

  useEffect(() => {
    const next = {};
    if (search) next.search = search;
    if (stateFilter !== 'All States') next.state = stateFilter;
    if (categoryFilter !== 'All Categories') next.category = categoryFilter;
    if (sort !== 'newest') next.sort = sort;
    setParams(next, { replace: true });
  }, [search, stateFilter, categoryFilter, sort, setParams]);

  const { data, loading, error } = useFetch(async () => {
    const { data } = await client.get('/listings', {
      params: {
        search,
        state: stateFilter,
        category: categoryFilter,
        sort,
      },
    });
    return data;
  }, [search, stateFilter, categoryFilter, sort]);

  const categories = useMemo(() => ['All Categories', ...CATEGORIES.map((item) => item.name)], []);

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h1 className="section-title">Search & Explore</h1>
          <p className="mt-1 text-sm text-slate-500">Use Nigerian state filters, category chips, and sorting to find the right listing quickly.</p>
        </div>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for cars, furniture, houses, land, phones, poultry..."
        />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">States</p>
          <FilterChips items={STATES} value={stateFilter} onChange={setStateFilter} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
          <FilterChips items={categories} value={categoryFilter} onChange={setCategoryFilter} />
        </div>
        <select className="input max-w-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="highest_rated">Highest Rated</option>
          <option value="lowest_price">Lowest Price</option>
        </select>
      </div>

      {loading ? <Loader label="Finding listings..." /> : error ? <div className="card text-rose-600">{error}</div> : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{data?.length || 0} listing(s) found</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
          </div>
          {!data?.length && <div className="card text-sm text-slate-500">No listings matched your filters yet.</div>}
        </div>
      )}
    </div>
  );
}
