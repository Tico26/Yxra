import TraderLine from "./trader-line";

// Tico's footer: the YX|RA name, then two columns split by a line. The links
// are the pages every page must reach (spec 0002 rule 26).
const COMPANY = [
  ["/how-yxra-makes-money", "How Yxra makes money"],
  ["/for-retailers", "Work with us"],
  ["/contact", "Contact"],
];
const POLICY = [
  ["/shops", "Shops we search"],
  ["/privacy", "Privacy"],
  ["/cookies", "Cookies and storage"],
  ["/terms", "Terms"],
];

const Column = ({ title, links, className }) => (
  <div className={`text-left ${className}`}>
    <h3 className="text-lg font-sans font-semibold mb-4">{title}</h3>
    <ul className="space-y-2">
      {links.map(([href, label]) => (
        <li key={href}>
          <a href={href} className="text-base text-gray-700 hover:text-black transition-colors">
            {label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default function SiteFooter() {
  return (
    <footer className="bg-white py-16 border-t border-gray-200">
      <div className="container-custom max-w-[800px]">
        <div className="text-center mb-12">
          <p className="text-5xl font-didot tracking-[0.2em]">YX|RA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
          <Column title="Company" links={COMPANY} className="md:pr-12" />
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-black -translate-x-1/2" />
          <Column title="Policy" links={POLICY} className="md:pl-12" />
        </div>

        <div className="mt-12 space-y-2 text-sm text-text-muted text-center">
          <p>
            Free for you. We earn nothing from these links yet; later, shops pay a small commission
            that never changes the order.
          </p>
          <p>
            If Yxra shows it, it was in stock in your size at our last nightly check. Each item
            shows when that was.
          </p>
          <TraderLine />
        </div>
      </div>
    </footer>
  );
}
