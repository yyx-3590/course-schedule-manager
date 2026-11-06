const request = require("supertest");
const jwt = require("jsonwebtoken");
const { app, connect, disconnect, clearDb, makeUser, auth, PASSWORD } = require("./helpers");
const User = require("../src/models/userModel");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDb);

const register = (body) => request(app).post("/api/users/register").send(body);

describe("POST /api/users/register", () => {
  it("creates a user and never returns the password", async () => {
    const res = await register({ username: "alice", email: "Alice@Example.com", password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("alice@example.com");
    expect(res.body.password).toBeUndefined();
  });

  it("stores a bcrypt hash, not the plain password", async () => {
    await register({ username: "alice", email: "alice@example.com", password: PASSWORD });
    const user = await User.findOne({ email: "alice@example.com" });
    expect(user.password).not.toBe(PASSWORD);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it("rejects a duplicate email", async () => {
    await register({ username: "alice", email: "alice@example.com", password: PASSWORD });
    const res = await register({ username: "alice2", email: "alice@example.com", password: PASSWORD });
    expect(res.status).toBe(400);
  });

  it("rejects a short password and a bad email", async () => {
    const res = await register({ username: "alice", email: "nope", password: "short" });
    expect(res.status).toBe(400);
    const paths = res.body.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["email", "password"]));
  });
});

describe("POST /api/users/login", () => {
  it("returns a token that holds the user id", async () => {
    await register({ username: "alice", email: "alice@example.com", password: PASSWORD });
    const res = await request(app).post("/api/users/login").send({ email: "alice@example.com", password: PASSWORD });
    expect(res.status).toBe(200);
    const decoded = jwt.verify(res.body.accessToken, process.env.ACCESS_TOKEN_SECRET);
    expect(decoded.user.email).toBe("alice@example.com");
    expect(decoded.user.id).toBeDefined();
  });

  it("gives the same 401 for a wrong password and an unknown email", async () => {
    await register({ username: "alice", email: "alice@example.com", password: PASSWORD });
    const wrongPw = await request(app).post("/api/users/login").send({ email: "alice@example.com", password: "wrong-password" });
    const noUser = await request(app).post("/api/users/login").send({ email: "ghost@example.com", password: PASSWORD });
    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body.message).toBe(noUser.body.message);
  });
});

describe("GET /api/users/current and token checks", () => {
  it("returns the logged in user", async () => {
    const { token, email } = await makeUser("alice");
    const res = await request(app).get("/api/users/current").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it("rejects a missing token", async () => {
    const res = await request(app).get("/api/users/current");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with another secret", async () => {
    const bad = jwt.sign({ user: { id: "x" } }, "other-secret");
    const res = await request(app).get("/api/users/current").set(auth(bad));
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const old = jwt.sign({ user: { id: "x" } }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -10 });
    const res = await request(app).get("/api/users/current").set(auth(old));
    expect(res.status).toBe(401);
  });
});

describe("unknown routes", () => {
  it("returns 404 as JSON", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.title).toBe("Not Found");
  });
});
