// Where a broken or old confirmation link lands (GET /api/newsletter/confirm
// on the API). The sign-up band below the page lets her ask for a fresh link.
const NewsletterNotConfirmed = () => (
  <div className="container-custom pb-12 pt-10 text-center md:pb-16 md:pt-16">
    <h1 className="font-display text-display-l font-normal">We couldn&apos;t confirm that</h1>
    <p className="mt-3 text-body-l text-graphite">
      The link may be more than seven days old, or something went wrong our end. Sign up again below and
      we&apos;ll send you a fresh one.
    </p>
  </div>
);

export default NewsletterNotConfirmed;
