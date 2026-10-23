import { useId } from 'react';

const pounds = (n) => `£${n}`;

// Handle positions run from 0 to STEPS along the track. Price grows with the
// square of the position, so the cheap end, where most products are, gets
// more room than the dear end.
const STEPS = 1000;

// Arrow keys move £1, Page Up/Down £10.
const KEY_STEPS = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 };

// Two-handle price slider in whole pounds: two native range inputs laid over
// one track, so each handle keeps its own keyboard and screen reader support.
const PriceFilter = ({ min, max, value, onChange }) => {
  const labelId = useId();
  const [lo, hi] = value;
  const span = max - min || 1;
  const toPosition = (price) => Math.round(Math.sqrt((price - min) / span) * STEPS);
  const toPrice = (position) => min + Math.round(span * (position / STEPS) ** 2);
  const loPos = toPosition(lo);
  const hiPos = toPosition(hi);
  const left = (loPos / STEPS) * 100;
  const right = (hiPos / STEPS) * 100;
  // When both handles sit at the top end, the minimum handle has to be on top
  // or it could never be dragged back down.
  const minOnTop = loPos > STEPS / 2;

  const setLo = (price) => onChange([Math.max(min, Math.min(price, hi)), hi]);
  const setHi = (price) => onChange([lo, Math.min(max, Math.max(price, lo))]);

  // Step by whole pounds from the keyboard, since one position can be less
  // than £1 at the cheap end and more than £1 at the dear end.
  const keyStep = (current, set) => (e) => {
    if (e.key === 'Home') set(min);
    else if (e.key === 'End') set(max);
    else if (KEY_STEPS[e.key]) set(current + KEY_STEPS[e.key]);
    else return;
    e.preventDefault();
  };

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
          min={0}
          max={STEPS}
          step={1}
          value={loPos}
          aria-label="Minimum price"
          aria-valuetext={pounds(lo)}
          onChange={(e) => setLo(toPrice(Number(e.target.value)))}
          onKeyDown={keyStep(lo, setLo)}
          style={{ zIndex: minOnTop ? 2 : 1 }}
        />
        <input
          type="range"
          min={0}
          max={STEPS}
          step={1}
          value={hiPos}
          aria-label="Maximum price"
          aria-valuetext={pounds(hi)}
          onChange={(e) => setHi(toPrice(Number(e.target.value)))}
          onKeyDown={keyStep(hi, setHi)}
          style={{ zIndex: minOnTop ? 1 : 2 }}
        />
      </div>
    </div>
  );
};

export default PriceFilter;
