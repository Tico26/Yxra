import { redirect, notFound } from "next/navigation";
import { clickOut } from "../../../lib/api.mjs";
import { parseSize } from "../../../lib/format.mjs";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

// The Click-out: records it and sends her to the Retailer's page in her size.
// Stock is as of the nightly Stock check shown on the card (ADR 0006).
export default async function GoPage({ params, searchParams }) {
  const { productId } = await params;
  const size = parseSize((await searchParams).size);
  if (!size || !/^\d+$/.test(productId)) notFound();

  let result;
  try {
    result = await clickOut({ productId: Number(productId), size });
  } catch {
    result = null;
  }
  if (!result) notFound();
  redirect(result.url);
}
