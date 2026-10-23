// The YX|RA logo: GFS Didot split by a vertical bar. Sized by the parent's
// font size; at 52px the bar is 3px wide with 12px either side.
const Wordmark = ({ className = '' }) => (
  <span className={`inline-flex items-center font-didot font-normal leading-none tracking-[-0.04em] ${className}`}>
    YX
    <span
      aria-hidden="true"
      className="inline-block h-[1.15em] w-[max(2px,0.0577em)] mx-[0.2308em] bg-current translate-y-[0.08em]"
    ></span>
    RA
  </span>
);

export default Wordmark;
