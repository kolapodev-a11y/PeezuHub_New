export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-brand-100 bg-white px-4 py-3 text-brand-700 shadow-soft">
        <div className="h-3 w-3 animate-pulse rounded-full bg-brand-600" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
