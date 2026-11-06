const express = require("express");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Behind nginx (Docker) the real client IP comes from X-Forwarded-For. Needed for rate limiting.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

app.use(helmet());
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
