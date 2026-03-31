import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'P';
}

function formatAlertCount(count) {
  if (count > 9) return '9+';
  return String(count);
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const isAdmin = user?.role === 'admin';
  const userInitials = useMemo(() => getInitials(user?.name), [user?.name]);

  const linkClass = ({ isActive }) =>
    `relative text-sm font-semibold transition ${
      isActive ? 'text-brand-700' : 'text-slate-600 hover:text-brand-700'
    }`;

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (!user) {
      setAlertCount(0);
      return undefined;
    }

    let active = true;

    async function loadAlerts() {
      try {
        if (isAdmin) {
          const { data } = await client.get('/notifications');
          if (active) setAlertCount(Number(data?.unreadCount) || 0);
          return;
        }

        const { data } = await client.get('/messages/inbox');
        if (active) setAlertCount(Array.isArray(data) ? data.length : 0);
      } catch {
        if (active) setAlertCount(0);
      }
    }

    loadAlerts();
    return () => {
      active = false;
    };
  }, [user, isAdmin, location.pathname]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleNotificationClick() {
    navigate(isAdmin ? '/admin' : '/profile');
  }

  const profileMenu = user && (
    <div
      ref={profileMenuRef}
      className="absolute right-0 top-[calc(100%+0.85rem)] z-50 w-[min(90vw,21rem)] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-500 text-base font-bold text-white shadow-soft">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 shadow-sm">
                {isAdmin ? 'Admin account' : 'Verified member'}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck size={12} />
                  Moderator access
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
          onClick={() => {
            navigate('/profile');
            setProfileOpen(false);
          }}
        >
          <span className="inline-flex items-center gap-3">
            <UserCircle2 size={18} />
            My Profile
          </span>
          <ChevronDown size={16} className="rotate-[-90deg] text-slate-400" />
        </button>

        <button
          type="button"
          className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
          onClick={() => {
            navigate('/profile');
            setProfileOpen(false);
          }}
        >
          <span className="inline-flex items-center gap-3">
            <LayoutDashboard size={18} />
            Dashboard & Listings
          </span>
          <ChevronDown size={16} className="rotate-[-90deg] text-slate-400" />
        </button>

        <button
          type="button"
          className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
          onClick={() => {
            navigate('/post-service');
            setProfileOpen(false);
          }}
        >
          <span className="inline-flex items-center gap-3">
            <PlusCircle size={18} />
            Post a Listing
          </span>
          <ChevronDown size={16} className="rotate-[-90deg] text-slate-400" />
        </button>

        {isAdmin && (
          <button
            type="button"
            className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-700"
            onClick={() => {
              navigate('/admin');
              setProfileOpen(false);
            }}
          >
            <span className="inline-flex items-center gap-3">
              <ShieldCheck size={18} />
              Admin Dashboard
            </span>
            <ChevronDown size={16} className="rotate-[-90deg] text-slate-400" />
          </button>
        )}

        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 text-brand-700">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-500 text-white shadow-soft">
              P
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900">PeezuHub</p>
              <p className="truncate text-xs text-slate-500">Trusted Nigerian listings</p>
            </div>
          </Link>

          <Link className="btn-secondary inline-flex items-center gap-2" to="/">
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3 text-brand-700">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-500 text-white shadow-soft">
              P
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900">PeezuHub</p>
              <p className="truncate text-xs text-slate-500">Trusted Nigerian listings</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/explore" className={linkClass}>Explore</NavLink>
            <NavLink to="/post-service" className={linkClass}>Post Listing</NavLink>
            {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-100 hover:text-brand-700"
              onClick={() => navigate('/explore')}
              aria-label="Search listings"
            >
              <Search size={18} />
            </button>

            {user ? (
              <>
                <button
                  type="button"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-100 hover:text-brand-700"
                  onClick={handleNotificationClick}
                  aria-label="Open notifications"
                >
                  <Bell size={18} />
                  {alertCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {formatAlertCount(alertCount)}
                    </span>
                  )}
                </button>

                {isAdmin && (
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 lg:inline-flex">
                    <ShieldCheck size={14} />
                    Admin
                  </span>
                )}

                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-brand-100"
                    onClick={() => setProfileOpen((current) => !current)}
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-500 text-sm font-bold text-white shadow-soft">
                      {userInitials}
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <p className="max-w-[8.5rem] truncate text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="max-w-[8.5rem] truncate text-xs text-slate-500">{isAdmin ? 'Admin account' : 'My account'}</p>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && profileMenu}
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-3 md:flex">
                <Link className="btn-secondary" to="/login">Login</Link>
                <Link className="btn-primary" to="/register">Get Started</Link>
              </div>
            )}

            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white/95 px-4 pb-5 pt-4 md:hidden">
          <div className="space-y-4">
            {user && (
              <div className="rounded-[1.75rem] border border-slate-100 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-500 text-base font-bold text-white shadow-soft">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-slate-900">{user.name}</p>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1 shadow-sm">{isAdmin ? 'Admin account' : 'Member account'}</span>
                      {alertCount > 0 && <span>{formatAlertCount(alertCount)} new alerts</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <NavLink to="/" className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                Home
              </NavLink>
              <NavLink to="/explore" className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                Explore
              </NavLink>
              <NavLink to="/post-service" className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                Post Listing
              </NavLink>
              {user && (
                <>
                  <NavLink to="/profile" className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                    My Profile
                  </NavLink>
                  <button
                    type="button"
                    className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={handleNotificationClick}
                  >
                    Notifications & Inbox
                  </button>
                  {isAdmin && (
                    <NavLink to="/admin" className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                      Admin Dashboard
                    </NavLink>
                  )}
                  <button
                    type="button"
                    className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>

            {!user && (
              <div className="grid grid-cols-2 gap-3 pt-1">
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
