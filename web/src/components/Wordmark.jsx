// The AMARA'S|PICK logo: GFS Didot split by a vertical bar. Sized by the
// parent's font size, with the same bar proportions as the old AMARA'S|PICK.
const Wordmark = ({ className = '' }) => (
  <span className={`inline-flex items-center whitespace-nowrap font-didot font-normal leading-none tracking-[-0.02em] ${className}`}>
    AMARA&apos;S
    <span
      aria-hidden="true"
      className="inline-block h-[1.15em] w-[max(2px,0.0577em)] mx-[0.2308em] bg-current translate-y-[0.08em]"
    ></span>
    PICK
  </span>
);

export default Wordmark;
