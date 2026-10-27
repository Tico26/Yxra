import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Logging in isn't open yet: the page says so and the form is switched off.
const Login = () => (
  <AuthLayout
    note="Coming soon. You don't need an account to use Amara&apos;s Pick."
    title="Log in"
    footer={
      <>
        New to Amara&apos;s Pick?{' '}
        <Link to="/signup" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
          Create an account
        </Link>
      </>
    }
  >
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <fieldset disabled className="space-y-5">
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
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="remember-me" className="flex items-center gap-2 text-small text-ink">
            <input id="remember-me" name="remember-me" type="checkbox" className="h-5 w-5 accent-ink" />
            Remember me
          </label>
          <a href="#" className="text-small text-ink underline underline-offset-4 hover:no-underline">
            Forgot your password?
          </a>
        </div>
        <button type="button" className="btn btn-primary w-full">
          Coming soon
        </button>
      </fieldset>
    </form>
  </AuthLayout>
);

export default Login;
