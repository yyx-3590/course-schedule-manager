const request = require("supertest");
const crypto = require("crypto");
const { app, connect, disconnect, clearDb, makeUser, PASSWORD } = require("./helpers");
const User = require("../src/models/userModel");

jest.mock("../src/utils/mailer", () => ({ sendMail: jest.fn().mockResolvedValue() }));
const { sendMail } = require("../src/utils/mailer");

beforeAll(connect);
afterAll(disconnect);
beforeEach(async () => {
  await clearDb();
  sendMail.mockClear();
});

const NEW_PASSWORD = "BrandNew98765";
const forgot = (email) => request(app).post("/api/users/forgot-password").send({ email });
const reset = (token, password = NEW_PASSWORD) => request(app).post("/api/users/reset-password").send({ token, password });
const login = (email, password) => request(app).post("/api/users/login").send({ email, password });

// Pulls the token out of the link in the email that the mailer mock received.
const tokenFromMail = () => {
  const { text } = sendMail.mock.calls[0][0];
  return text.match(/token=([a-f0-9]+)/)[1];
};

describe("forgot password", () => {
  it("emails a link for a registered address", async () => {
    const { email } = await makeUser();
    const res = await forgot(email);
    expect(res.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe(email);
    expect(sendMail.mock.calls[0][0].text).toContain("/reset-password?token=");
  });

  it("gives the same answer for an unknown address and sends nothing", async () => {
    const { email } = await makeUser();
    const known = await forgot(email);
    const unknown = await forgot("ghost@example.com");
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it("stores only a hash of the token, with a 30 minute expiry", async () => {
    const { email } = await makeUser();
    await forgot(email);
    const token = tokenFromMail();
    const user = await User.findOne({ email });
    expect(user.resetTokenHash).not.toBe(token);
    expect(user.resetTokenHash).toBe(crypto.createHash("sha256").update(token).digest("hex"));
    const minutes = (user.resetTokenExpires - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(29);
    expect(minutes).toBeLessThanOrEqual(30);
  });
});

describe("reset password", () => {
  it("sets a new password that works for login", async () => {
    const { email } = await makeUser();
    await forgot(email);
    const res = await reset(tokenFromMail());
    expect(res.status).toBe(200);
    expect((await login(email, NEW_PASSWORD)).status).toBe(200);
    expect((await login(email, PASSWORD)).status).toBe(401);
  });

  it("works only once", async () => {
    const { email } = await makeUser();
    await forgot(email);
    const token = tokenFromMail();
    expect((await reset(token)).status).toBe(200);
    expect((await reset(token, "AnotherPass123")).status).toBe(400);
    const user = await User.findOne({ email });
    expect(user.resetTokenHash).toBeUndefined();
  });

  it("rejects an expired token", async () => {
    const { email } = await makeUser();
    await forgot(email);
    await User.updateOne({ email }, { resetTokenExpires: new Date(Date.now() - 1000) });
    const res = await reset(tokenFromMail());
    expect(res.status).toBe(400);
    expect((await login(email, PASSWORD)).status).toBe(200);
  });

  it("rejects a made up token", async () => {
    const res = await reset("a".repeat(64));
    expect(res.status).toBe(400);
  });

  it("rejects a weak new password and keeps the token usable", async () => {
    const { email } = await makeUser();
    await forgot(email);
    const token = tokenFromMail();
    expect((await reset(token, "short")).status).toBe(400);
    expect((await reset(token)).status).toBe(200);
  });
});
