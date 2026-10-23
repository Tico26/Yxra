import { displaySize, joinList } from '../utils/format';

// Fits a short run of sizes on a card tag, then "+N".
const COMPACT_CHAR_BUDGET = 12;

const fitCompact = (labels) => {
  const shown = [];
  let chars = 0;
  for (const label of labels) {
    if (shown.length > 0 && chars + label.length > COMPACT_CHAR_BUDGET) break;
    shown.push(label);
    chars += label.length + 1;
  }
  return shown;
};

// The in-stock plus sizes of a product. Read-only: it is a list, not a picker.
// variant "compact" sits on a card photo; "full" lists every size on the product page.
const SizeTag = ({ sizes = [], variant = 'compact', className = '' }) => {
  if (sizes.length === 0) return null;
  const labels = sizes.map(displaySize);

  if (variant === 'full') {
    return (
      <ul className={`flex flex-wrap gap-2 ${className}`}>
        {labels.map((label, i) => (
          <li
            key={`${label}-${i}`}
            className="border-l-[3px] border-ink bg-mist px-3 py-2 font-display text-size-l font-medium tabular-nums"
          >
            {label}
          </li>
        ))}
      </ul>
    );
  }

  const shown = fitCompact(labels);
  const more = labels.length - shown.length;
  const spoken = `In stock in ${labels.length === 1 ? 'size' : 'sizes'} ${joinList(
    more ? [...shown, `${more} more`] : shown,
  )}`;

  return (
    <p
      className={`inline-flex max-w-[calc(100%-0.5rem)] flex-wrap items-baseline gap-x-2 border-l-[3px] border-ink bg-paper py-1.5 pl-2 pr-2.5 ${className}`}
    >
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className="contents">
        {shown.map((label, i) => (
          <span key={`${label}-${i}`} className="font-display text-small sm:text-size font-medium leading-none tabular-nums">
            {label}
          </span>
        ))}
        {more > 0 && <span className="text-micro font-medium text-stone">+{more}</span>}
      </span>
    </p>
  );
};

export default SizeTag;
