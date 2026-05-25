import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import client from '../api/client';
import { CATEGORIES, STATES } from '../constants/data';
import FilterChips from '../components/FilterChips';
import CategoryGrid from '../components/CategoryGrid';
import FeaturedCarousel from '../components/FeaturedCarousel';
import PremiumBanner from '../components/PremiumBanner';
import SafetyBanner from '../components/SafetyBanner';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';
import type { Listing, ListingMetaOptions, CategoryCard } from '../types/listing';

export default function HomePage() {
  const [activeState, setActiveState] = useState('All States');

  const { data: featuredData, loading: featuredLoading, error: featuredError } = useFetch<Listing[]>(async () => {
    const { data } = await client.get('/listings/featured');
    return data;
  }, []);

  const { data: metaData, loading: metaLoading, error: metaError } = useFetch<ListingMetaOptions>(async () => {
    const { data } = await client.get('/listings/meta/options');
    return data;
  }, []);

  const categories = useMemo<CategoryCard[]>(() => {
    const counts = metaData?.categories || [];
    return CATEGORIES.map((item) => ({
      ...item,
      count: counts.find((category) => category.name === item.name)?.count || 0,
    }));
  }, [metaData]);

  const filteredFeatured = useMemo(() => {
    if (!featuredData) return [];
    if (activeState === 'All States') return featuredData;
    return featuredData.filter((item) => item.state === activeState);
  }, [activeState, featuredData]);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 p-6 text-white shadow-soft md:p-10">
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide">Nigeria&apos;s safe, moderated marketplace</p>
          <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">Buy, sell and discover trusted Nigerian listings</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50 md:text-base">Explore local listings, post what you want to sell, and connect through WhatsApp or email with stronger moderation, scam checks, and state-based discovery.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/explore" className="btn-primary bg-white text-brand-700 hover:bg-blue-50">Explore listings</Link>
            <Link to="/post-service" className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">Post a listing</Link>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-3xl bg-white/10 p-3 backdrop-blur">
            <Search size={18} />
            <p className="text-sm">Quick discovery for cars, houses, land, phones, poultry, furniture and more.</p>
          </div>
        </div>

        <div className="space-y-4">
          <SafetyBanner />
          <PremiumBanner />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Browse by state</h2>
            <p className="mt-1 text-sm text-slate-500">Focus on the states that matter most to your local search.</p>
          </div>
          <Link to="/explore" className="text-sm font-semibold text-brand-700">Open full search</Link>
        </div>
        <FilterChips items={STATES} value={activeState} onChange={setActiveState} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Featured & premium listings</h2>
          <p className="mt-1 text-sm text-slate-500">Seller premium lifts eligible listings to the top of the homepage and keeps trust signals stronger while the account upgrade is active.</p>
        </div>
        {featuredLoading ? (
          <Loader label="Loading featured listings..." />
        ) : featuredError ? (
          <div className="card text-sm text-rose-600">{featuredError}</div>
        ) : (
          <FeaturedCarousel listings={filteredFeatured} />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Popular categories</h2>
          <p className="mt-1 text-sm text-slate-500">You can edit these categories anytime later from the shared constants file.</p>
        </div>
        {metaLoading ? (
          <Loader label="Loading categories..." />
        ) : metaError ? (
          <div className="card text-sm text-rose-600">{metaError}</div>
        ) : (
          <CategoryGrid categories={categories} />
        )}
      </section>
    </div>
  );
}
