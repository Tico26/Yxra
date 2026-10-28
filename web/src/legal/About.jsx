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
      </article>
    </div>
  );
};

export default About;
