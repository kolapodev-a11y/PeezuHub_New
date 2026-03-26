import { Link } from 'react-router-dom';

export default function AuthShell({ mode, title, subtitle, children, footer }) {
  const isLogin = mode === 'login';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-soft">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/login"
            className={isLogin ? 'btn-primary w-full' : 'btn-secondary w-full'}
          >
            Login
          </Link>
          <Link
            to="/register"
            className={!isLogin ? 'btn-primary w-full' : 'btn-secondary w-full'}
          >
            Register
          </Link>
        </div>
      </div>

      <div className="card space-y-6 p-6 sm:p-8">
        <div>
          <h1 className="section-title">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>

        {children}

        {footer}
      </div>
    </div>
  );
}
