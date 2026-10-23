import { useId } from 'react';

const pounds = (n) => `£${n}`;

// Two-handle price slider in whole pounds: two native range inputs laid over
// one track, so each handle keeps its own keyboard and screen reader support.
const PriceFilter = ({ min, max, value, onChange }) => {
  const labelId = useId();
  const [lo, hi] = value;
  const span = max - min || 1;
  const left = ((lo - min) / span) * 100;
  const right = ((hi - min) / span) * 100;
  // When both handles sit at the top end, the minimum handle has to be on top
  // or it could never be dragged back down.
  const minOnTop = lo > min + span / 2;

  return (
    <div role="group" aria-labelledby={labelId}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className="text-small font-medium">Price</span>
        <span className="text-small tabular-nums text-graphite" aria-live="polite">
          {pounds(lo)} – {pounds(hi)}
        </span>
      </div>
      <div className="price-range relative mt-1 h-11">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-rule" aria-hidden="true" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink"
          style={{ left: `${left}%`, right: `${100 - right}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={lo}
          aria-label="Minimum price"
          aria-valuetext={pounds(lo)}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          style={{ zIndex: minOnTop ? 2 : 1 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={hi}
          aria-label="Maximum price"
          aria-valuetext={pounds(hi)}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
          style={{ zIndex: minOnTop ? 1 : 2 }}
        />
      </div>
    </div>
  );
};

export default PriceFilter;
