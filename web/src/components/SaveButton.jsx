import { toggleSaved, useIsSaved } from '../utils/saved';

export const HeartIcon = ({ filled = false, className = 'h-[22px] w-[22px]' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

// The heart on a Product (spec 0004 rule 8): saves it, or removes it again.
// variant "photo" sits on a card's photo; "boxed" sits beside other buttons.
const SaveButton = ({ productId, productName, variant = 'photo', className = '' }) => {
  const saved = useIsSaved(productId);
  const look =
    variant === 'photo' ? 'h-11 w-11 bg-paper hover:bg-mist' : 'h-12 w-12 border border-ink bg-paper hover:bg-mist';
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from Saved` : `Save ${productName}`}
      onClick={() => toggleSaved(productId)}
      className={`flex flex-none items-center justify-center text-ink transition-colors duration-150 motion-reduce:transition-none ${look} ${className}`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
};

export default SaveButton;
