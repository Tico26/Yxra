import { useEffect } from 'react';

// One column of reading text for Privacy, Terms and the other fixed pages,
// in the same type as the rest of the site. Sets the tab title while open.
const LegalPage = ({ title, updated, children }) => {
  useEffect(() => {
    const before = document.title;
    document.title = `${title} · Amara's Pick`;
    return () => {
      document.title = before;
    };
  }, [title]);

  return (
    <div className="container-custom pb-20 pt-10 md:pb-24 md:pt-16">
      <article className="legal mx-auto max-w-[720px]">
        <h1 className="font-display text-display-l font-normal [text-wrap:balance]">{title}</h1>
        {updated && <p className="mt-3 text-small text-graphite">Last updated {updated}</p>}
        <div className="mt-8">{children}</div>
      </article>
    </div>
  );
};

export default LegalPage;
