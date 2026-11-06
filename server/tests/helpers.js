const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");

// Each test file gets its own database, so files never see each other's data.
const connect = async () => {
  const dbName = `test_${process.pid}_${Math.random().toString(36).slice(2)}`;
  await mongoose.connect(process.env.TEST_MONGO_URI, { dbName });
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

const clearDb = async () => {
  for (const c of Object.values(mongoose.connection.collections)) {
    await c.deleteMany({});
  }
};

const PASSWORD = "Test12345678";

// Registers a user, logs in, and returns the token.
const makeUser = async (name = "alice") => {
  const email = `${name}@example.com`;
  await request(app).post("/api/users/register").send({ username: name, email, password: PASSWORD });
  const res = await request(app).post("/api/users/login").send({ email, password: PASSWORD });
  return { email, token: res.body.accessToken };
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const slot = (days, start, end) => ({ days, start, end });

const courseBody = (overrides = {}) => ({
  title: "Algorithms",
  code: "CS 373",
  termSeason: "Fall",
  termYear: 2026,
  schedules: [slot(["Monday", "Wednesday"], "09:00", "10:30")],
  ...overrides,
});

module.exports = { app, connect, disconnect, clearDb, makeUser, auth, slot, courseBody, PASSWORD };
