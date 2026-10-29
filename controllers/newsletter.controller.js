// The newsletter band's sign-up (Newsletter.jsx). Nothing is stored here:
// Brevo emails her a confirmation link and adds her to the sign-ups list
// once she clicks it, recording when she confirmed.
const { HttpError, badRequest } = require("../lib/errors");
const brevo = require("../lib/brevo");

const SENT = "Check your email to confirm";
const TRY_LATER = "Sign-up isn't working right now. Please try again later.";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.postNewsletter = async (req, res, next) => {
  const { email, website } = req.body || {};
  const { BREVO_API_KEY, BREVO_SIGNUPS_LIST_ID, BREVO_CONFIRM_TEMPLATE_ID } = process.env;
  if (!BREVO_API_KEY || !BREVO_SIGNUPS_LIST_ID || !BREVO_CONFIRM_TEMPLATE_ID) {
    return next(new HttpError(503, "The newsletter isn't open yet"));
  }
  const address = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (address.length > 254 || !EMAIL.test(address)) return next(badRequest("Enter a valid email address"));
  // Only bots fill in the hidden field; they are told it worked.
  if (website) return res.status(202).send({ msg: SENT });

  const site = (process.env.AMARAS_PICK_SITE_URL || "https://amaraspick.com").replace(/\/+$/, "");
  try {
    await brevo.sendConfirmation({
      email: address,
      listId: Number(BREVO_SIGNUPS_LIST_ID),
      templateId: Number(BREVO_CONFIRM_TEMPLATE_ID),
      redirectionUrl: `${site}/newsletter/confirmed`,
    });
  } catch (err) {
    // Already on the list: the same answer, so the form never says who is.
    if (!(err instanceof brevo.BrevoError && err.code === "duplicate_parameter")) {
      console.error(err.message);
      return next(new HttpError(502, TRY_LATER));
    }
  }
  res.status(202).send({ msg: SENT });
};
