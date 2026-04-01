import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Grid2X2,
  Home,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  SquarePen,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { subscribeUnreadCountChange } from '../utils/notifications';

function getInitials(user) {
  const seed = user?.name || user?.email || 'P';
  return seed
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function ProfileAvatar({ initials, className = '' }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-sky-400 text-sm font-bold text-white shadow-soft ${className}`}>
      {initials}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const initials = useMemo(() => getInitials(user), [user]);

  const navItems = useMemo(
    () => [
      { to: '/', label: 'Home', icon: Home },
      { to: '/explore', label: 'Explore', icon: Search },
      { to: '/post-service', label: 'Post Listing', icon: SquarePen },
    ],
    []
  );

  const desktopLinkClass = ({ isActive }) =>
    [
      'rounded-full px-4 py-2 text-sm font-semibold transition',
      isActive ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');

  const mobileLinkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
      isActive
        ? 'bg-gradient-to-r from-brand-50 to-sky-50 text-brand-700 shadow-sm ring-1 ring-brand-100'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const { data } = await client.get('/notifications');
        if (!cancelled) {
          setUnreadCount(data?.unreadCount || 0);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  useEffect(() => {
    const unsubscribe = subscribeUnreadCountChange((nextCount) => {
      setUnreadCount(nextCount);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }

      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('[data-mobile-menu-trigger]')
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  function openNotifications() {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    navigate(user?.role === 'admin' ? '/admin?tab=notifications' : '/profile?tab=notifications');
  }

  function handleLogout() {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    logout();
    navigate('/');
  }

  const notificationBadge = unreadCount > 99 ? '99+' : unreadCount;

  const profileMenu = user ? (
    <div className="absolute right-0 top-[calc(100%+0.85rem)] z-50 w-[19rem] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur">
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 p-4 text-white">
        <div className="flex items-start gap-3">
          <ProfileAvatar initials={initials} className="h-12 w-12 rounded-2xl bg-white/15 text-base shadow-none ring-1 ring-white/20" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name || 'PeezuHub User'}</p>
            <p className="mt-1 truncate text-xs text-blue-50/90">{user?.email || 'No email address'}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/95">
                {user?.role || 'member'}
              </span>
              {user?.role === 'admin' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-50 ring-1 ring-emerald-200/30">
                  <ShieldCheck size={12} />
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <button
          type="button"
          onClick={() => {
            setProfileMenuOpen(false);
            navigate('/profile');
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <User size={18} className="text-brand-600" />
          <div>
            <p className="font-semibold">My Profile</p>
            <p className="text-xs text-slate-500">Manage listings, inbox and account details</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setProfileMenuOpen(false);
            navigate('/post-service');
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <SquarePen size={18} className="text-brand-600" />
          <div>
            <p className="font-semibold">Post a Listing</p>
            <p className="text-xs text-slate-500">Create a fresh listing with better visibility</p>
          </div>
        </button>

        <button
          type="button"
          onClick={openNotifications}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={18} className="text-brand-600" />
          <div className="flex-1">
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-slate-500">
              {user?.role === 'admin' ? 'Review admin alerts and moderation activity' : 'Open your latest buyer and account activity'}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">{notificationBadge}</span>
          )}
        </button>

        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate('/admin');
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Grid2X2 size={18} className="text-brand-600" />
            <div>
              <p className="font-semibold">Admin Dashboard</p>
              <p className="text-xs text-slate-500">Moderation, reports and platform activity</p>
            </div>
          </button>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  ) : null;

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3 text-brand-700">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">P</div>
            <div>
              <p className="text-base font-bold">PeezuHub</p>
              <p className="text-xs text-slate-500">Trusted Nigerian listings</p>
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
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5">
        <Link to="/" className="flex min-w-0 items-center gap-3 text-brand-700">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-soft">P</div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900">PeezuHub</p>
            <p className="truncate text-xs text-slate-500">Trusted Nigerian listings</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={desktopLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-100 hover:text-brand-700 md:inline-flex"
            aria-label="Search listings"
            title="Search listings"
          >
            <Search size={18} />
          </button>

          {user && (
            <button
              type="button"
              onClick={openNotifications}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-100 hover:text-brand-700"
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 min-w-[1.1rem] rounded-full bg-rose-500 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-sm">
                  {notificationBadge}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-brand-100 hover:shadow-soft"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <ProfileAvatar initials={initials} />
                <div className="hidden min-w-0 text-left lg:block">
                  <p className="max-w-[11rem] truncate text-sm font-semibold text-slate-900">{user?.name || 'PeezuHub User'}</p>
                  <p className="max-w-[11rem] truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <ChevronDown size={16} className={`hidden text-slate-400 transition lg:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && profileMenu}
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link className="btn-secondary" to="/login">Login</Link>
              <Link className="btn-primary" to="/register">Get Started</Link>
            </div>
          )}

          <button
            data-mobile-menu-trigger
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-brand-100 hover:text-brand-700 md:hidden"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white/95 px-4 py-4 md:hidden backdrop-blur">
          <div ref={mobileMenuRef} className="mx-auto max-w-7xl space-y-4">
            {user && (
              <div className="rounded-[1.75rem] bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 p-4 text-white shadow-soft">
                <div className="flex items-start gap-3">
                  <ProfileAvatar initials={initials} className="h-12 w-12 rounded-2xl bg-white/15 text-base shadow-none ring-1 ring-white/25" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{user?.name || 'PeezuHub User'}</p>
                    <p className="mt-1 truncate text-xs text-blue-50/90">{user?.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setProfileMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        My Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/post-service');
                        }}
                        className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Post Listing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <nav className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-soft">
              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.to} to={item.to} className={mobileLinkClass}>
                      <Icon size={18} />
                      {item.label}
                    </NavLink>
                  );
                })}

                {user && (
                  <button
                    type="button"
                    onClick={openNotifications}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <div className="relative">
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -right-2 -top-2 min-w-[1rem] rounded-full bg-rose-500 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                          {notificationBadge}
                        </span>
                      )}
                    </div>
                    Notifications
                  </button>
                )}

                {user?.role === 'admin' && (
                  <NavLink to="/admin" className={mobileLinkClass}>
                    <Grid2X2 size={18} />
                    Admin Dashboard
                  </NavLink>
                )}
              </div>
            </nav>

            {user ? (
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Account</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Manage your PeezuHub presence professionally</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Update listings, review account activity and sign out securely from one clean navigation panel.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="btn-secondary w-full"
                  >
                    Profile
                  </button>
                  <button type="button" onClick={handleLogout} className="btn-primary w-full bg-slate-900 hover:bg-slate-800">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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
