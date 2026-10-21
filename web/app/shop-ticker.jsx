// Tico's shop marquee: every shop we search, with Y X R A between them. The
// list repeats to at least 12 and then twice, so the loop is seamless.
export default function ShopTicker({ retailers, size }) {
  if (!retailers.length) return null;
  let displayList = [...retailers];
  while (displayList.length < 12) displayList = [...displayList, ...retailers];
  const fullLoop = [...displayList, ...displayList];
  const letters = ["Y", "X", "R", "A"];

  return (
    <section className="relative text-primary h-[22vh] min-h-[120px] flex items-center justify-center overflow-hidden">
      <p className="sr-only">Shops we search: {retailers.map((r) => r.retailer_name).join(", ")}</p>
      <div className="w-full overflow-hidden relative group pause-on-hover" aria-hidden="true">
        <div className="animate-marquee flex gap-4 pr-4">
          {fullLoop.map((shop, index) => (
            <div key={index} className="flex items-center gap-4">
              <a
                href={`/shops/${shop.retailer_id}${size ? `?size=${size}` : ""}`}
                tabIndex={-1}
                className="px-6 py-3 border border-black/5 bg-white rounded-xl text-base font-medium tracking-wide shadow-sm hover:shadow-md whitespace-nowrap flex items-center justify-center h-16 min-w-[140px] transition-all"
              >
                {shop.retailer_name}
              </a>
              <span className="font-didot text-sm text-black font-bold">{letters[index % 4]}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background-body to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background-body to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}
