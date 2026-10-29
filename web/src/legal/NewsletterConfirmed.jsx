import { Link } from 'react-router-dom';

// Where Brevo sends her after she clicks the link in the confirmation email
// (controllers/newsletter.controller.js on the API). The sign-up band is
// hidden here, since she has just joined.
const NewsletterConfirmed = () => (
  <div className="container-custom pb-20 pt-10 text-center md:pb-24 md:pt-16">
    <h1 className="font-display text-display-l font-normal">You&apos;re on the list</h1>
    <p className="mt-3 text-body-l text-graphite">
      Your email is confirmed. The next Amara&apos;s Pick newsletter will come to your inbox.
    </p>
    <p className="mt-6">
      <Link to="/products" className="btn btn-primary">
        See what&apos;s in stock
      </Link>
    </p>
  </div>
);

export default NewsletterConfirmed;
