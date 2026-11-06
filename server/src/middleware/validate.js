// Validates req.body against a zod schema and replaces it with the parsed data.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    const err = new Error("Validation failed");
    err.details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return next(err);
  }
  req.body = result.data;
  next();
};

module.exports = validate;
