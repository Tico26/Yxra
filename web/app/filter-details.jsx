"use client";

import { useEffect, useRef } from "react";

const WIDE = "(min-width: 960px)";

// The filter panel is a <details>, so it opens and closes without
// JavaScript. On phones it starts closed above the products; on desktop it
// is a sidebar and always open (CSS keeps it open without JavaScript too).
// A link to #size or #filter, like the header's "Your size", opens it.
export default function FilterDetails({ summary, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return undefined;
    const wide = window.matchMedia(WIDE);
    const sync = () => {
      if (wide.matches || ["#size", "#filter"].includes(window.location.hash)) details.open = true;
    };
    sync();
    wide.addEventListener("change", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      wide.removeEventListener("change", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  return (
    <details className="filter-panel" ref={ref}>
      <summary>
        <span className="filter-label">Filter</span>
        {summary ? <span className="filter-summary">{summary}</span> : null}
      </summary>
      <div className="filter-body">{children}</div>
    </details>
  );
}
