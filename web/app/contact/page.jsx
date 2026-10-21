import { SITE } from "../../lib/site.mjs";
import TraderLine from "../trader-line";

export const metadata = { title: "Contact", description: "How to reach Yxra." };

export default function ContactPage() {
  const mail = <a href={`mailto:${SITE.email}`}>{SITE.email}</a>;
  return (
    <article className="prose">
      <h1>Contact</h1>
      <p>Email {mail}. We aim to reply within two working days.</p>
      <ul>
        <li>
          <strong>Something wrong with an item?</strong> Tell us which one and what was wrong (sold
          out, wrong size, not plus size, broken link) and we will fix or hide it.
        </li>
        <li>
          <strong>Run a shop?</strong> See <a href="/for-retailers">For Retailers</a> to join or opt
          out.
        </li>
        <li>
          <strong>Your data.</strong> To use your rights or make a data protection complaint, see{" "}
          <a href="/privacy">Privacy</a>.
        </li>
      </ul>
      <TraderLine />
    </article>
  );
}
