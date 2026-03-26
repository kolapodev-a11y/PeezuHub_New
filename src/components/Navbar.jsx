import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShieldCheck, X, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const linkClass = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600'}`;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ── Auth pages: simplified header with "Back to Home" ──────────────────────
  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-brand-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
              P
            </div>
            <div>
              <p className="text-base font-bold">PeezuHub</p>
              <p className="text-xs text-slate-500">Trusted Nigerian listings</p>
            </div>
          </Link>

          {/* FIX #2 – replaced "Create account" / "Back to login" with "Back to Home" */}
          <Link
            className="btn-secondary inline-flex items-center gap-2"
            to="/"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </header>
    );
  }

  // ── Main navigation ────────────────────────────────────────────────────────
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-brand-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            P
          </div>
          <div>
            <p className="text-base font-bold">PeezuHub</p>
            <p className="text-xs text-slate-500">Trusted Nigerian listings</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink to="/" className={linkClass}>Home</NavLink>
          <NavLink to="/explore" className={linkClass}>Explore</NavLink>
          <NavLink to="/post-service" className={linkClass}>Post Service</NavLink>
          {user && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>Admin</NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck size={14} />
                  Admin
                </span>
              )}
              <button className="btn-secondary" onClick={() => navigate('/profile')}>
                {user.name}
              </button>
              <button className="btn-primary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn-secondary" to="/login">Login</Link>
              <Link className="btn-primary" to="/register">Get Started</Link>
            </>
          )}
        </div>

        <button
          className="inline-flex rounded-2xl border border-slate-200 p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/explore" className={linkClass}>Explore</NavLink>
            <NavLink to="/post-service" className={linkClass}>Post Service</NavLink>
            {user && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={linkClass}>Admin</NavLink>
            )}
            {user ? (
              <button className="btn-primary" onClick={logout}>
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link className="btn-secondary w-full" to="/login">Login</Link>
                <Link className="btn-primary w-full" to="/register">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
