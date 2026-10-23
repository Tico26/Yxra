import { Link } from 'react-router-dom';

// Breadcrumb trail: [[to, label], ..., [null, current]].
export const Breadcrumb = ({ trail }) => (
  <nav aria-label="Breadcrumb" className="mb-4">
    <ol className="flex flex-wrap items-center gap-x-2 text-micro text-graphite">
      {trail.map(([to, label], i) => (
        <li key={label} className="flex items-center gap-x-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          {to ? (
            <Link to={to} className="text-graphite underline-offset-4 hover:text-ink hover:underline">
              {label}
            </Link>
          ) : (
            <span aria-current="page" className="text-ink">
              {label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

const PageHeader = ({ title, lede, trail, children }) => (
  <header className="mb-8 md:mb-10">
    {trail && <Breadcrumb trail={trail} />}
    <h1 className="max-w-[20ch] font-display text-display-l font-normal [text-wrap:balance]">{title}</h1>
    {lede && <p className="mt-3 max-w-[60ch] text-body-l text-graphite">{lede}</p>}
    {children}
  </header>
);

export default PageHeader;
