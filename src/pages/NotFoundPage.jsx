import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl card text-center space-y-4">
      <h1 className="text-4xl font-black text-slate-900">404</h1>
      <p className="text-slate-600">The page you requested could not be found.</p>
      <Link className="btn-primary" to="/">Back home</Link>
    </div>
  );
}
