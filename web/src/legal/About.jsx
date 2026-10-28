import { useEffect } from 'react';

const About = () => {
  useEffect(() => {
    const before = document.title;
    document.title = "About us · Amara's Pick";
    return () => {
      document.title = before;
    };
  }, []);

  return (
    <div className="container-custom pb-20 pt-10 md:pb-24 md:pt-16">
      <article className="min-w-0">
        <p className="mb-3 text-micro uppercase tracking-[0.1em] text-graphite">About us</p>
        <h1 className="font-display text-display-l font-normal [text-wrap:balance]">
          Your size, actually in stock.
        </h1>
        <p className="mt-6 max-w-[60ch] text-body-l">
          Shopping plus size often means checking shop after shop, finding something you love, then seeing
          your size has sold out. Amara&apos;s Pick checks UK shops every night and shows you only clothes,
          swimwear and activewear that are in stock in UK 18 and up.
        </p>
        <blockquote className="mt-8 border-l-2 border-ink pl-5">
          <p className="font-display text-size-l leading-snug">
            Amara is our guide. She searches the shops for you, so you can spend your time choosing instead
            of hunting.
          </p>
        </blockquote>
      </article>
    </div>
  );
};

export default About;
