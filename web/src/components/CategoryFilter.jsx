import { useEffect, useRef } from 'react';
import { PRODUCT_FILTERS } from '../utils/filters';

const LABELS = new Map(PRODUCT_FILTERS.map((f) => [f.key, f.label]));

// The filter row (spec 0005): All, then the filters given, in filter order.
const CategoryFilter = ({ filters, value, onChange }) => {
  const picked = useRef(null);
  // On a phone the row scrolls sideways; keep the picked filter in view.
  useEffect(() => {
    picked.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [value]);

  if (filters.length < 2 && value === 'all') return null;
  const options = [['all', 'All'], ...filters.map((key) => [key, LABELS.get(key) || key])];

  return (
    <div
      role="group"
      aria-label="Filter by type"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {options.map(([key, label]) => {
        const selected = value === key;
        return (
          <button
            key={key}
            ref={selected ? picked : undefined}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(key)}
            className={`min-h-10 shrink-0 whitespace-nowrap border border-ink px-4 text-small font-medium transition-colors duration-150 motion-reduce:transition-none ${
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
