import { SITE } from "../lib/site.mjs";

// Who runs Yxra (E-Commerce Regulations 2002 reg 6), in the footer and on the
// Contact and Terms pages.
export default function TraderLine() {
  const who = SITE.traderName ? `${SITE.traderName}, a sole trader` : "a UK sole trader";
  return (
    <p className="trader">
      Yxra is run by {who}
      {SITE.traderAddress ? `, ${SITE.traderAddress}` : ""}. Email{" "}
      <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
    </p>
  );
}
