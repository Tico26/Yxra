const { translateSizeLabel } = require("../../lib/sizes");

const t = (label, known) => translateSizeLabel(label, known);

describe("translateSizeLabel (R11–R13)", () => {
  test.each([
    ["18", [18]],
    ["UK 18", [18]],
    ["uk18", [18]],
    ["Size 22", [22]],
    ["18 Regular", [18]],
    ["20 Long", [20]],
    ["24 Petite", [24]],
    ["18R", [18]],
  ])("a plain UK size %s is translated directly", (label, uk) => {
    expect(t(label)).toEqual({ uk_sizes: uk, size_status: "translated" });
  });

  test.each([
    ["18/20", [18, 20]],
    ["UK 22/24", [22, 24]],
    ["18-20", [18, 20]],
    ["18 – 20", [18, 20]],
  ])("R13: %s covers both UK sizes", (label, uk) => {
    expect(t(label).uk_sizes).toEqual(uk);
  });

  test.each([
    ["EU 46", [18]],
    ["EU50", [22]],
    ["EUR 52/54", [24, 26]],
    ["US 14", [18]],
    ["US 18", [22]],
  ])("EU and US sizes are converted when marked: %s", (label, uk) => {
    expect(t(label).uk_sizes).toEqual(uk);
  });

  test.each(["3X", "XXL", "One Size", "17", "M/L", "18/22/26", "42", "Small"])(
    "R12: %s has no confident UK size and is left unsettled",
    (label) => {
      expect(t(label)).toEqual({ uk_sizes: [], size_status: "unsettled" });
    }
  );

  test("R11: the Brand's own chart (or Tico's answer) comes before the rules", () => {
    expect(t("3X", { uk_sizes: [26, 28] })).toEqual({ uk_sizes: [26, 28], size_status: "translated" });
    expect(t("18", { uk_sizes: [16] })).toEqual({ uk_sizes: [16], size_status: "translated" });
  });

  test("a known answer with no UK size (the AI was unsure) keeps the label unsettled", () => {
    expect(t("3X", { uk_sizes: [] })).toEqual({ uk_sizes: [], size_status: "unsettled" });
  });
});
