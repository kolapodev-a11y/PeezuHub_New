export default function Badge({ children, color = 'blue' }) {
  const styles = {
    blue: 'bg-brand-50 text-brand-700 border-brand-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[color]}`}>{children}</span>;
}
