require("dotenv").config();
const app = require("./app");
const connectDb = require("./config/db");

for (const key of ["CONNECTION_STRING", "ACCESS_TOKEN_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const port = process.env.PORT || 5001;

connectDb()
  .then(() => app.listen(port, () => console.log(`Server running on port ${port}`)))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
