import { Link } from 'react-router-dom';
import { Mail, Globe, ShieldCheck, MessageCircle } from 'lucide-react';

// FIX #3 – Fully restyled footer with dark background so it is visually
//           distinct from the page content (which uses bg-white / bg-slate-50).

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-lg">
                P
              </div>
              <div>
                <p className="text-base font-bold text-white">PeezuHub</p>
                <p className="text-xs text-slate-400">Trusted Nigerian listings</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              A moderated marketplace for trusted Nigerian business services.
              Find verified vendors, post your services, and grow your brand.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Home', to: '/' },
                { label: 'Explore Services', to: '/explore' },
                { label: 'Post a Service', to: '/post-service' },
                { label: 'Login', to: '/login' },
                { label: 'Register', to: '/register' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-400 transition hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
              Policies
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-400" />
                External payments only — PeezuHub does not process money.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-400" />
                All listings are manually moderated before going live.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-400" />
                Report scams or suspicious listings immediately.
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:peezutech@gmail.com"
                  className="flex items-center gap-2 text-slate-400 transition hover:text-white"
                >
                  <Mail size={14} className="text-brand-400" />
                  peezutech@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://peezutech.name.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 transition hover:text-white"
                >
                  <Globe size={14} className="text-brand-400" />
                  peezutech.name.ng
                </a>
              </li>
              <li>
                <span className="flex items-center gap-2 text-slate-400">
                  <MessageCircle size={14} className="text-brand-400" />
                  Admin: PeezuTech
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row">
          <p>© {year} PeezuHub — Moderated Nigerian Business Showcase. All rights reserved.</p>
          <p>Built with ❤️ by PeezuTech</p>
        </div>
      </div>
    </footer>
  );
}
