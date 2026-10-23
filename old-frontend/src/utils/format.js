export const formatPrice = (pence) =>
  pence ? `£${(pence / 100).toFixed(2)}` : null;

// Shops write sizes their own way. The tag is a UK size list, so a leading
// "UK " is dropped; everything else shows as the shop gives it.
export const displaySize = (label) => String(label).replace(/^UK\s+/i, '');

const listFormat = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' });
export const joinList = (items) => listFormat.format(items);

export const CATEGORY_LABELS = {
  clothes: 'Clothes',
  lingerie: 'Lingerie',
  swimwear: 'Swimwear',
  activewear: 'Activewear',
};

// "Mint Velvet's", "Rock Those Curves'".
export const possessive = (name) => (/s$/i.test(name) ? `${name}’` : `${name}’s`);

// Shops send colours like "PALE PINK"; all-caps names are shown in sentence case.
export const displayColour = (colour) => {
  if (!colour) return null;
  const text = String(colour).trim();
  if (text !== text.toUpperCase()) return text;
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};
