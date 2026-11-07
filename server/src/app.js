const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Behind nginx (Docker) or a cloud proxy the real client IP comes from X-Forwarded-For. Needed for rate limiting.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

app.use(helmet());

// When the React app lives on another domain (for example a Render static site),
// CLIENT_URL says which origin may call the API. Every other origin is refused.
if (process.env.CLIENT_URL) {
  const allowedOrigin = process.env.CLIENT_URL.replace(/\/$/, "");
  app.use("/api", cors({ origin: (origin, callback) => callback(null, origin === allowedOrigin), maxAge: 86400 }));
}

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));

app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
});
app.use(errorHandler);

module.exports = app;
