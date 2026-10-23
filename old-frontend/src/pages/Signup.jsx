import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Signing up does not work yet; the form only looks the part.
const Signup = () => (
  <AuthLayout
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
    <form className="space-y-5" action="#" method="POST" onSubmit={(e) => e.preventDefault()}>
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
          <a href="#" className="underline underline-offset-4 hover:no-underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline underline-offset-4 hover:no-underline">
            Privacy Policy
          </a>
        </label>
      </div>
      <button type="button" className="btn btn-primary w-full">
        Create account
      </button>
    </form>
  </AuthLayout>
);

export default Signup;
