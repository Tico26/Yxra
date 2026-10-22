import { SIZES } from "../lib/format.mjs";
import SectionTitle from "./section-title";

// Everything on Yxra is in her size, so the size comes first. The size goes
// in the page address; nothing is stored on her device.
export default function SizePicker({ size, action = "/", title = "Your size" }) {
  return (
    <section id="size" className="bg-white py-16 scroll-mt-24">
      <div className="container-custom flex flex-col items-center">
        <SectionTitle note="Pick your UK size. We only show what was in stock in it at last night's check.">
          {title}
        </SectionTitle>
        <form action={action} method="get" className="grid grid-cols-4 md:grid-cols-8 gap-3 w-full max-w-[800px]">
          {SIZES.map((s) => (
            <button
              key={s}
              type="submit"
              name="size"
              value={s}
              aria-pressed={s === size}
              className={`h-16 border-2 border-black font-didot text-2xl transition-colors ${
                s === size ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </form>
      </div>
    </section>
  );
}
