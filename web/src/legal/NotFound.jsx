import { Link } from 'react-router-dom';

// Main's not-found page, in the site's type. Also served with a 404 status by
// worker.js for unknown addresses and for a Click-out to a product that's gone.
const NotFound = () => (
  <div className="container-custom pb-20 pt-10 text-center md:pb-24 md:pt-16">
    <h1 className="font-display text-display-l font-normal">We can&apos;t find that one</h1>
    <p className="mt-3 text-body-l text-graphite">
      It may have gone from the shop.{' '}
      <Link to="/" className="text-ink underline underline-offset-4 hover:no-underline">
        Search again
      </Link>
      .
    </p>
  </div>
);

export default NotFound;
