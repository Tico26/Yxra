// Sign-up band shown above the footer on every page. The newsletter isn't
// running yet, so the field and button are switched off and say so; nothing
// is sent and there is no thank-you message.
const Newsletter = () => (
  <section aria-labelledby="newsletter-heading" className="bg-mist">
    <div className="container-custom grid gap-6 py-12 md:grid-cols-12 md:items-end md:py-14">
      <h2 id="newsletter-heading" className="font-display text-h2 md:col-span-5">
        Get the Amara&apos;s Pick newsletter
      </h2>
      <div className="md:col-span-7">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="newsletter-email" className="field-label">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              disabled
              aria-describedby="newsletter-soon"
              className="field"
            />
          </div>
          <button type="submit" disabled className="btn btn-primary w-full sm:w-auto">
            Coming soon
          </button>
        </form>
        <p id="newsletter-soon" className="mt-2 text-small text-graphite">
          The newsletter is coming soon. Nothing is sent yet.
        </p>
      </div>
    </div>
  </section>
);

export default Newsletter;
