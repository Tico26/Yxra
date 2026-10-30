// Where the link in the confirmation email lands. Opening the link confirms
// nothing: email scanners open links to check them. Only pressing the button
// posts the token to the API (controllers/newsletter.controller.js), which
// answers with the confirmed or not-confirmed page. The page is pre-built, so
// the token is copied from the address as the form is sent.
const addToken = (e) => {
  e.currentTarget.elements.token.value = new URLSearchParams(window.location.search).get('token') || '';
};

const NewsletterConfirm = () => (
  <div className="container-custom pb-20 pt-10 text-center md:pb-24 md:pt-16">
    <h1 className="font-display text-display-l font-normal">One more step</h1>
    <p className="mt-3 text-body-l text-graphite">
      Press the button to start getting the Amara&apos;s Pick newsletter.
    </p>
    <form method="post" action="/api/newsletter/confirm" onSubmit={addToken} className="mt-6">
      <input type="hidden" name="token" defaultValue="" />
      <button type="submit" className="btn btn-primary">
        Yes, sign me up
      </button>
    </form>
  </div>
);

export default NewsletterConfirm;
