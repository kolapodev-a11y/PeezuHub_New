import { Link } from 'react-router-dom';

export default function CategoryGrid({ categories = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {categories.map((category) => (
        <Link
          to={`/explore?category=${encodeURIComponent(category.name)}`}
          key={category.name}
          className="rounded-3xl border border-slate-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5"
        >
          <div className="mb-3 text-2xl">{category.icon || '📌'}</div>
          <h4 className="text-sm font-semibold text-slate-900">{category.name}</h4>
          <p className="mt-1 text-xs text-slate-500">{category.count || 0} listings</p>
        </Link>
      ))}
    </div>
  );
}
