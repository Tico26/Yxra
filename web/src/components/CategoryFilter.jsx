import { CATEGORY_LABELS } from '../utils/format';

// Category chips, built from the categories present in the products shown.
const CategoryFilter = ({ categories, value, onChange }) => {
  if (categories.length < 2) return null;
  const options = [['all', 'All'], ...categories.map((c) => [c, CATEGORY_LABELS[c] || c])];

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {options.map(([key, label]) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(key)}
            className={`min-h-10 shrink-0 border border-ink px-4 text-small font-medium transition-colors duration-150 motion-reduce:transition-none ${
              selected ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-mist'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
