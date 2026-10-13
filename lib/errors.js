class HttpError extends Error {
  constructor(status, msg) {
    super(msg);
    this.status = status;
  }
}

const notFound = (what) => new HttpError(404, `${what} not found`);
const badRequest = (msg) => new HttpError(400, msg);

const parseId = (value, what) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw badRequest(`${what} id must be a number`);
  return id;
};

const handleErrors = (err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).send({ msg: err.message });
  // Postgres: invalid text, foreign key, check and unique violations.
  if (["22P02", "23503", "23514", "23502"].includes(err.code)) {
    return res.status(400).send({ msg: "Bad request" });
  }
  if (err.code === "23505") return res.status(409).send({ msg: "Already exists" });
  console.error(err);
  res.status(500).send({ msg: "Internal server error" });
};

module.exports = { HttpError, notFound, badRequest, parseId, handleErrors };
