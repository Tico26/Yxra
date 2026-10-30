// The newsletter band's sign-up (Newsletter.jsx), with double opt-in. Nothing
// is stored until she confirms: POST /api/newsletter emails her a signed link,
// and GET /api/newsletter/confirm (the link) adds her to Resend's
// "Newsletter sign-ups" segment and to "Newsletter", the one segment each
// broadcast goes to. The link carries her address and an expiry,
// signed with the Resend key, so no pending sign-ups are kept anywhere.
const crypto = require("crypto");
const { HttpError, badRequest } = require("../lib/errors");
const resend = require("../lib/resend");

const SIGNUPS = "Newsletter sign-ups";
const NEWSLETTER = "Newsletter";
const SENT = "Check your email to confirm";
const TRY_LATER = "Sign-up isn't working right now. Please try again later.";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_DAYS = 7;
const FROM = "Amara's Pick <no-reply@amaraspick.com>";

const sign = (text) =>
  crypto.createHmac("sha256", `newsletter-confirm:${process.env.RESEND_API_KEY}`).update(text).digest("base64url");

// <address, base64url>.<expiry, ms>.<signature>
const confirmToken = (email, expiresAt) => {
  const payload = `${Buffer.from(email).toString("base64url")}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
};

// Her address if the token is genuine and in date, otherwise null.
const readToken = (token) => {
  const [address, expiresAt, signature] = typeof token === "string" ? token.split(".") : [];
  if (!address || !expiresAt || !signature) return null;
  const expected = Buffer.from(sign(`${address}.${expiresAt}`));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  if (!(Number(expiresAt) > Date.now())) return null;
  return Buffer.from(address, "base64url").toString();
};

const confirmEmail = (email, link) => ({
  from: process.env.NEWSLETTER_FROM || FROM,
  to: [email],
  subject: "Confirm your Amara's Pick newsletter",
  html: `<p>Hello,</p>
<p>Please confirm you'd like the Amara's Pick newsletter: new finds in your size and the best offers, by email.</p>
<p><a href="${link}">Yes, sign me up</a></p>
<p>The link works for ${LINK_DAYS} days. If you didn't ask for this, ignore this email and you won't hear from us.</p>
<p>Amara's Pick</p>`,
  text: `Please confirm you'd like the Amara's Pick newsletter: new finds in your size and the best offers, by email.

Yes, sign me up: ${link}

The link works for ${LINK_DAYS} days. If you didn't ask for this, ignore this email and you won't hear from us.

Amara's Pick`,
});

const postNewsletter = async (req, res, next) => {
  const { email, website } = req.body || {};
  if (!process.env.RESEND_API_KEY) return next(new HttpError(503, "The newsletter isn't open yet"));
  const address = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (address.length > 254 || !EMAIL.test(address)) return next(badRequest("Enter a valid email address"));
  // Only bots fill in the hidden field; they are told it worked.
  if (website) return res.status(202).send({ msg: SENT });

  const site = (process.env.AMARAS_PICK_SITE_URL || "https://amaraspick.com").replace(/\/+$/, "");
  const token = confirmToken(address, Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000);
  try {
    // Sent whether or not she is already on the list, so the form never says who is.
    await resend.sendEmail(confirmEmail(address, `${site}/api/newsletter/confirm?token=${token}`));
  } catch (err) {
    console.error(err.message);
    return next(new HttpError(502, TRY_LATER));
  }
  res.status(202).send({ msg: SENT });
};

const getConfirm = async (req, res) => {
  const email = process.env.RESEND_API_KEY && readToken(req.query.token);
  if (!email) return res.redirect(302, "/newsletter/not-confirmed");
  try {
    await resend.addToSegment(email, await resend.segmentId(SIGNUPS), { resubscribe: true });
    await resend.addToSegment(email, await resend.segmentId(NEWSLETTER));
  } catch (err) {
    console.error(err.message);
    return res.redirect(302, "/newsletter/not-confirmed");
  }
  res.redirect(302, "/newsletter/confirmed");
};

module.exports = { postNewsletter, getConfirm, confirmToken };
