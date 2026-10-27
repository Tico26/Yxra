import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Signing up isn't open yet: the page says so and the form is switched off.
const Signup = () => (
  <AuthLayout
    note="Coming soon. You don't need an account to use Amara&apos;s Pick."
    title="Create an account"
    footer={
      <>
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
          Log in
        </Link>
      </>
    }
  >
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <fieldset disabled className="space-y-5">
        <div>
          <label htmlFor="name" className="field-label">
            Name
          </label>
          <input id="name" name="name" type="text" autoComplete="name" required className="field" />
        </div>
        <div>
          <label htmlFor="email-address" className="field-label">
            Email address
          </label>
          <input id="email-address" name="email" type="email" autoComplete="email" required className="field" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" required className="field" />
        </div>
        <div className="flex items-start gap-2">
          <input id="terms" name="terms" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
          <label htmlFor="terms" className="text-small text-ink">
            I agree to the{' '}
            <Link to="/terms" className="underline underline-offset-4 hover:no-underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline underline-offset-4 hover:no-underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        <button type="button" className="btn btn-primary w-full">
          Coming soon
        </button>
      </fieldset>
    </form>
  </AuthLayout>
);

export default Signup;
