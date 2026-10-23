import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Logging in does not work yet; the form only looks the part.
const Login = () => (
  <AuthLayout
    title="Log in"
    footer={
      <>
        New to Yxra?{' '}
        <Link to="/signup" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
          Create an account
        </Link>
      </>
    }
  >
    <form className="space-y-5" action="#" method="POST" onSubmit={(e) => e.preventDefault()}>
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
        Log in
      </button>
    </form>
  </AuthLayout>
);

export default Login;
