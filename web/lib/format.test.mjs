import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, formatChecked, stockLine, parseSize, parseCategory } from "./format.mjs";

test("prices show pounds, with pence only when there are any", () => {
  assert.equal(formatPrice(3500), "£35");
  assert.equal(formatPrice(3750), "£37.50");
  assert.equal(formatPrice(null), "");
});

test("the check time is shown in UK time", () => {
  assert.equal(formatChecked("2026-10-12T02:00:00Z"), "Checked 12 Oct, 03:00");
  assert.equal(formatChecked("2026-12-01T02:00:00Z"), "Checked 1 Dec, 02:00");
});

test("the stock line names her size, and the range when a label covers two", () => {
  assert.equal(stockLine(20, null), "In stock in 20");
  assert.equal(stockLine(20, "fits 18–20"), "In stock in 20 (fits 18–20)");
});

test("only sizes and categories on offer are accepted", () => {
  assert.equal(parseSize("22"), 22);
  assert.equal(parseSize("21"), null);
  assert.equal(parseSize(undefined), null);
  assert.equal(parseCategory("swimwear"), "swimwear");
  assert.equal(parseCategory("shoes"), "");
});
