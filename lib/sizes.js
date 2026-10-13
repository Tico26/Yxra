const brandKey = (brand) => (brand || "").trim().toLowerCase();

const sizeLabelKey = (label) => label.trim().toLowerCase().replace(/\s+/g, " ");

module.exports = { brandKey, sizeLabelKey };
