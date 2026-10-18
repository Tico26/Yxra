// Calls the Express API. YXRA_API_URL is where it runs, e.g. https://api.yxra.co.uk
const API_URL = (process.env.YXRA_API_URL || "http://localhost:9090").replace(/\/$/, "");

export const searchProducts = async ({ size, category }) => {
  const query = new URLSearchParams({ uk_size: String(size) });
  if (category) query.set("category", category);
  const res = await fetch(`${API_URL}/api/products?${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()).products;
};

// Runs the Live check. Returns { outcome: "sent", url } or
// { outcome: "sold_out", message, similar }, or null if the Product is gone.
export const clickOut = async ({ productId, size }) => {
  const res = await fetch(`${API_URL}/api/click-outs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, uk_size: size }),
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`Click-out failed (${res.status})`);
  return res.json();
};
