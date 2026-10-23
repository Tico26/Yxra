import { useState } from 'react';

// Sign-up band shown above the footer on every page. Nothing is sent yet;
// Tico chose to keep the thank-you message after pressing the button.
const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
    }, 5000);
  };

  return (
    <section aria-labelledby="newsletter-heading" className="bg-mist">
      <div className="container-custom grid gap-6 py-12 md:grid-cols-12 md:items-end md:py-14">
        <h2 id="newsletter-heading" className="font-display text-h2 md:col-span-5">
          Get the Yxra newsletter
        </h2>
        <div className="md:col-span-7" role="status">
          {submitted ? (
            <div className="min-h-12">
              <p className="font-display text-size-l">Thank you for joining!</p>
              <p className="mt-1 text-body text-graphite">You've successfully subscribed to our newsletter.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="field-label">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full sm:w-auto">
                Sign up
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
