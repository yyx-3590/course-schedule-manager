// The allowed origin is read when the app loads, so set it before requiring the app.
process.env.CLIENT_URL = "https://app.example.com/";

const request = require("supertest");
const app = require("../src/app");

describe("CORS", () => {
  test("answers the preflight request from the configured front end", async () => {
    const res = await request(app)
      .options("/api/courses")
      .set("Origin", "https://app.example.com")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://app.example.com");
    expect(res.headers["access-control-allow-headers"]).toMatch(/authorization/i);
  });

  test("adds the header to normal responses", async () => {
    const res = await request(app).get("/api/health").set("Origin", "https://app.example.com");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://app.example.com");
  });

  test("gives no permission to other origins", async () => {
    const res = await request(app)
      .options("/api/courses")
      .set("Origin", "https://evil.example.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
