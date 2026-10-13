// Small display helpers shared by the pages.

export const SIZES = [18, 20, 22, 24, 26, 28, 30, 32];

export const CATEGORIES = [
  { value: "", label: "Everything" },
  { value: "clothes", label: "Clothes" },
  { value: "swimwear", label: "Swimwear" },
  { value: "activewear", label: "Activewear" },
];

export const formatPrice = (pence) =>
  pence === null || pence === undefined
    ? ""
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: pence % 100 ? 2 : 0,
      }).format(pence / 100);

// "Checked 12 Oct, 03:00", in UK time.
export const formatChecked = (iso) =>
  `Checked ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(new Date(iso))}`;

// What the green stock line says on a card.
export const stockLine = (size, fits) =>
  fits ? `In stock in ${size} (${fits})` : `In stock in ${size}`;

export const parseSize = (value) => {
  const n = Number(value);
  return SIZES.includes(n) ? n : null;
};

export const parseCategory = (value) =>
  CATEGORIES.some((c) => c.value === value && value) ? value : "";
