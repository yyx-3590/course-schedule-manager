const request = require("supertest");
const { app, connect, disconnect, clearDb, makeUser, auth, slot, courseBody } = require("./helpers");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDb);

const create = (token, body = courseBody()) => request(app).post("/api/courses").set(auth(token)).send(body);

describe("auth required", () => {
  it("blocks every course route without a token", async () => {
    const id = "64b64b64b64b64b64b64b64b";
    const calls = [
      request(app).get("/api/courses"),
      request(app).post("/api/courses").send(courseBody()),
      request(app).get(`/api/courses/${id}`),
      request(app).put(`/api/courses/${id}`).send(courseBody()),
      request(app).delete(`/api/courses/${id}`),
      request(app).delete("/api/courses").send({ ids: [id] }),
    ];
    for (const res of await Promise.all(calls)) expect(res.status).toBe(401);
  });
});

describe("create and read", () => {
  it("creates a course and lists it", async () => {
    const { token } = await makeUser();
    const res = await create(token);
    expect(res.status).toBe(201);
    expect(res.body.code).toBe("CS 373");
    expect(res.body.term).toBe("Fall 2026");

    const list = await request(app).get("/api/courses").set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("gets one course by id", async () => {
    const { token } = await makeUser();
    const { body } = await create(token);
    const res = await request(app).get(`/api/courses/${body._id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Algorithms");
  });

  it("returns 404 for a missing course and 400 for a bad id", async () => {
    const { token } = await makeUser();
    const missing = await request(app).get("/api/courses/64b64b64b64b64b64b64b64b").set(auth(token));
    expect(missing.status).toBe(404);
    const bad = await request(app).get("/api/courses/not-an-id").set(auth(token));
    expect(bad.status).toBe(400);
  });
});

describe("validation", () => {
  it("needs a code or a title", async () => {
    const { token } = await makeUser();
    const res = await create(token, courseBody({ code: "", title: "" }));
    expect(res.status).toBe(400);
  });

  it("needs at least one time slot", async () => {
    const { token } = await makeUser();
    const res = await create(token, courseBody({ schedules: [] }));
    expect(res.status).toBe(400);
  });

  it("rejects an end time before the start time", async () => {
    const { token } = await makeUser();
    const res = await create(token, courseBody({ schedules: [slot(["Monday"], "11:00", "10:00")] }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown season and a weekend day", async () => {
    const { token } = await makeUser();
    expect((await create(token, courseBody({ termSeason: "Monsoon" }))).status).toBe(400);
    expect((await create(token, courseBody({ schedules: [slot(["Sunday"], "09:00", "10:00")] }))).status).toBe(400);
  });

  it("rejects two overlapping slots inside one course", async () => {
    const { token } = await makeUser();
    const res = await create(
      token,
      courseBody({ schedules: [slot(["Monday"], "09:00", "10:00"), slot(["Monday"], "09:30", "11:00")] })
    );
    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toMatch(/overlap/);
  });
});

describe("conflict detection across courses", () => {
  it("returns 409 with the reason when a new course clashes", async () => {
    const { token } = await makeUser();
    await create(token);
    const res = await create(
      token,
      courseBody({ title: "Databases", code: "CS 340", schedules: [slot(["Monday"], "10:00", "11:00")] })
    );
    expect(res.status).toBe(409);
    expect(res.body.details[0].message).toContain("clashes with Algorithms CS 373");
  });

  it("allows the same time in a different term", async () => {
    const { token } = await makeUser();
    await create(token);
    const res = await create(token, courseBody({ termSeason: "Winter", termYear: 2027 }));
    expect(res.status).toBe(201);
  });

  it("allows back to back courses", async () => {
    const { token } = await makeUser();
    await create(token);
    const res = await create(token, courseBody({ code: "CS 340", schedules: [slot(["Monday"], "10:30", "12:00")] }));
    expect(res.status).toBe(201);
  });

  it("does not count another user's courses as a clash", async () => {
    const alice = await makeUser("alice");
    const bob = await makeUser("bob");
    await create(alice.token);
    const res = await create(bob.token);
    expect(res.status).toBe(201);
  });
});

describe("update", () => {
  it("updates a course", async () => {
    const { token } = await makeUser();
    const { body } = await create(token);
    const res = await request(app)
      .put(`/api/courses/${body._id}`)
      .set(auth(token))
      .send(courseBody({ instructor: "Dr. Lee" }));
    expect(res.status).toBe(200);
    expect(res.body.instructor).toBe("Dr. Lee");
  });

  it("does not clash with itself when saved again", async () => {
    const { token } = await makeUser();
    const { body } = await create(token);
    const res = await request(app).put(`/api/courses/${body._id}`).set(auth(token)).send(courseBody());
    expect(res.status).toBe(200);
  });

  it("returns 409 when the edit clashes with another course", async () => {
    const { token } = await makeUser();
    await create(token);
    const other = await create(token, courseBody({ code: "CS 340", schedules: [slot(["Tuesday"], "09:00", "10:00")] }));
    const res = await request(app)
      .put(`/api/courses/${other.body._id}`)
      .set(auth(token))
      .send(courseBody({ code: "CS 340", schedules: [slot(["Monday"], "09:30", "10:00")] }));
    expect(res.status).toBe(409);
  });
});

describe("delete", () => {
  it("deletes one course", async () => {
    const { token } = await makeUser();
    const { body } = await create(token);
    const res = await request(app).delete(`/api/courses/${body._id}`).set(auth(token));
    expect(res.status).toBe(200);
    const again = await request(app).get(`/api/courses/${body._id}`).set(auth(token));
    expect(again.status).toBe(404);
  });

  it("deletes several courses at once", async () => {
    const { token } = await makeUser();
    const a = await create(token);
    const b = await create(token, courseBody({ code: "CS 340", schedules: [slot(["Tuesday"], "09:00", "10:00")] }));
    await create(token, courseBody({ code: "CS 450", schedules: [slot(["Friday"], "09:00", "10:00")] }));

    const res = await request(app).delete("/api/courses").set(auth(token)).send({ ids: [a.body._id, b.body._id] });
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(2);
    const list = await request(app).get("/api/courses").set(auth(token));
    expect(list.body).toHaveLength(1);
  });

  it("rejects a bulk delete with a bad id", async () => {
    const { token } = await makeUser();
    const res = await request(app).delete("/api/courses").set(auth(token)).send({ ids: ["abc"] });
    expect(res.status).toBe(400);
  });
});
