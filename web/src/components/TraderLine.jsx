import { SITE } from '../site';

// Who runs Yxra (E-Commerce Regulations 2002 reg 6), in the footer and on the
// Contact, Privacy and Terms pages.
const TraderLine = ({ className = '' }) => {
  const who = SITE.traderName ? `${SITE.traderName}, a sole trader` : 'a UK sole trader';
  return (
    <p className={className}>
      Yxra is run by {who}
      {SITE.traderAddress ? `, ${SITE.traderAddress}` : ''}. Email{' '}
      <a href={`mailto:${SITE.email}`} className="text-ink underline underline-offset-4 hover:no-underline">
        {SITE.email}
      </a>
      .
    </p>
  );
};

export default TraderLine;
