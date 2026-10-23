// A single centred column for Log in and Sign up. `note` sits under the title.
const AuthLayout = ({ title, note, children, footer }) => (
  <div className="container-custom pb-20 pt-12 md:pb-28 md:pt-20">
    <div className="mx-auto w-full max-w-[400px]">
      <h1 className="font-display text-display-l font-normal">{title}</h1>
      {note && <p className="mt-3 text-body-l text-graphite">{note}</p>}
      <div className="mt-8">{children}</div>
      <p className="mt-8 text-body text-graphite">{footer}</p>
    </div>
  </div>
);

export default AuthLayout;
