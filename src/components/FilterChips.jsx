export default function FilterChips({ items = [], value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${value === item ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
