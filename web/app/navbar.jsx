"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { parseSize } from "../lib/format.mjs";

// Tico's navbar: links on the right, the YX|RA logo in the middle, and it
// fades away once you scroll. The links keep her size.
export default function Navbar() {
  const [isAtTop, setIsAtTop] = useState(true);
  const pathname = usePathname();
  const size = parseSize(useSearchParams().get("size"));
  const withSize = (path) => (size ? `${path}?size=${size}` : path);

  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY < 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    ["/", "Home"],
    ["/shops", "Shops"],
    ["/products", "Products"],
  ];
  const isActive = (path) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  return (
    <nav
      className={`sticky top-0 z-[1000] h-[88px] md:h-[13.5vh] md:min-h-[96px] transition-all duration-700 ease-in-out ${
        isAtTop
          ? "bg-background-card border-b border-border opacity-100"
          : "bg-transparent border-transparent opacity-0 pointer-events-none"
      }`}
    >
      <div className="container-custom flex justify-end items-center relative h-full">
        <div className="flex gap-4 md:gap-6 items-center text-sm md:text-base">
          {links.map(([path, label]) => (
            <a
              key={path}
              href={withSize(path)}
              className={`font-medium transition-colors duration-150 ${
                isActive(path) ? "text-primary underline underline-offset-4" : "text-text-main hover:text-primary"
              } ${path === "/" ? "hidden md:inline" : ""}`}
            >
              {label}
            </a>
          ))}
          <a
            href={size ? `/?size=${size}#size` : "/#size"}
            className="border border-primary px-3 py-1.5 font-medium text-primary whitespace-nowrap"
          >
            {size ? `Size ${size}` : "Your size"}
          </a>
        </div>

        <a
          href={withSize("/")}
          aria-label="Yxra home"
          className="flex items-center text-[44px] md:text-[8.1vh] leading-none font-didot font-normal text-primary tracking-tighter absolute left-4 md:left-1/2 top-1/2 md:-translate-x-1/2 -translate-y-1/2"
        >
          YX<span aria-hidden="true" className="h-[52px] md:h-[10.8vh] w-[3px] bg-primary mx-2 md:mx-3 translate-y-1 md:translate-y-2" />RA
        </a>
      </div>
    </nav>
  );
}
