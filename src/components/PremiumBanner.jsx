import { ArrowRight, BadgeCheck, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function isPremiumActive(user) {
  return Boolean(
    user?.premiumStatus === 'active' &&
    user?.premiumExpiresAt &&
    new Date(user.premiumExpiresAt) > new Date()
  );
}

function isPremiumPending(user) {
  return user?.premiumStatus === 'pending';
}

export default function PremiumBanner() {
  const { user } = useAuth();
  const premiumActive = isPremiumActive(user);
  const premiumPending = isPremiumPending(user);
  const target = user ? '/profile?upgrade=1' : '/login';

  if (premiumActive) return null;

  if (premiumPending) {
    return (
      <div className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-soft">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
          <Clock3 size={14} /> Premium verification pending
        </p>
        <h3 className="text-xl font-bold">Your seller premium payment is being verified</h3>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          Your upgrade button is hidden until the current verification finishes. You can check the latest status from your profile page.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-500 p-5 text-white shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <BadgeCheck size={14} /> Seller Premium
          </p>
          <h3 className="text-xl font-bold">Upgrade your account – ₦5,000/month for premium coverage on all listings</h3>
          <p className="mt-2 text-sm text-blue-50">One successful upgrade covers your current listings and future listings with top placement, better trust signals and a verified badge while active.</p>
        </div>
        <Link to={target} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-brand-700">
          Upgrade <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
