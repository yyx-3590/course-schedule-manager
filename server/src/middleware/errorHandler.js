const { constants } = require("../constants");

const getTitle = (statusCode) => {
  switch (statusCode) {
    case constants.VALIDATION_ERROR:
      return "Validation Failed";
    case constants.NOT_FOUND:
      return "Not Found";
    case constants.UNAUTHORIZED:
      return "Unauthorized";
    case constants.FORBIDDEN:
      return "Forbidden";
    case constants.CONFLICT:
      return "Conflict";
    default:
      return "Server Error";
  }
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  // Map common Mongoose / MongoDB errors to client errors
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid id";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate value";
  }

  res.status(statusCode).json({
    title: getTitle(statusCode),
    message,
    details: err.details,
    stackTrace: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;
