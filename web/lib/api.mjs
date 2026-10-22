// Calls the Express API. On Cloudflare the site reaches the yxra-api Worker
// through its API service binding; anywhere else YXRA_API_URL says where the
// API runs, e.g. http://localhost:9090.
import { productsQuery } from "./search.mjs";

const API_URL = (process.env.YXRA_API_URL || "http://localhost:9090").replace(/\/$/, "");

const apiBinding = async () => {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return getCloudflareContext().env.API || null;
  } catch {
    return null;
  }
};

const apiFetch = async (path, init = {}) => {
  const binding = await apiBinding();
  // The host is ignored by a service binding; the path is what matters.
  return binding
    ? binding.fetch(`https://yxra-api${path}`, init)
    : fetch(`${API_URL}${path}`, { ...init, cache: "no-store" });
};

// Products in stock for a search from readSearch (lib/search.mjs): her UK
// size and category. With no size, everything in stock in a plus size, each
// with its in_stock_sizes.
export const searchProducts = async (search) => {
  const query = productsQuery(search);
  const res = await apiFetch(`/api/products${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()).products;
};

// The approved Retailers, for the "Shops we search" list.
export const listRetailers = async () => {
  const res = await apiFetch("/api/retailers");
  if (!res.ok) throw new Error(`Retailers failed (${res.status})`);
  return (await res.json()).retailers;
};

// Records the Click-out. Returns { outcome: "sent", url }, or null if the
// Product is gone.
export const clickOut = async ({ productId, size }) => {
  const res = await apiFetch("/api/click-outs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, uk_size: size }),
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`Click-out failed (${res.status})`);
  return res.json();
};
