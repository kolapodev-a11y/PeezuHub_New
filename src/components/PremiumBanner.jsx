import { ArrowRight, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PremiumBanner() {
  const { user } = useAuth();
  const target = user ? '/profile?upgrade=1' : '/login';

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-500 p-5 text-white shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <BadgeCheck size={14} /> Premium Visibility
          </p>
          <h3 className="text-xl font-bold">Upgrade a listing – ₦5,000/month for top placement + verified badge</h3>
          <p className="mt-2 text-sm text-blue-50">Featured listings appear first, gain stronger trust signals, and get extra visibility in the home carousel.</p>
        </div>
        <Link to={target} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-brand-700">
          Upgrade <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
