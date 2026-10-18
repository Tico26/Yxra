// Tico's admin routes need the ADMIN_TOKEN as a Bearer token.
const crypto = require("crypto");
const { HttpError } = require("./errors");

const sameSecret = (a, b) => {
  const x = crypto.createHash("sha256").update(a).digest();
  const y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
};

const requireAdmin = (req, res, next) => {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return next(new HttpError(503, "Admin is not set up: ADMIN_TOKEN is missing"));
  const [scheme, given] = (req.get("Authorization") || "").split(" ");
  if (scheme !== "Bearer" || !given || !sameSecret(given, token)) {
    return next(new HttpError(401, "Admin token required"));
  }
  next();
};

module.exports = { requireAdmin };
