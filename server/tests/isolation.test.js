const request = require("supertest");
const { app, connect, disconnect, clearDb, makeUser, auth, courseBody } = require("./helpers");
const Course = require("../src/models/courseModel");

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDb);

// Alice owns one course. Bob is a different logged in user.
const setup = async () => {
  const alice = await makeUser("alice");
  const bob = await makeUser("bob");
  const { body: course } = await request(app).post("/api/courses").set(auth(alice.token)).send(courseBody());
  return { alice, bob, course };
};

describe("user A cannot reach user B's courses", () => {
  it("does not list them", async () => {
    const { bob } = await setup();
    const res = await request(app).get("/api/courses").set(auth(bob.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 403 on read", async () => {
    const { bob, course } = await setup();
    const res = await request(app).get(`/api/courses/${course._id}`).set(auth(bob.token));
    expect(res.status).toBe(403);
  });

  it("returns 403 on update and leaves the course unchanged", async () => {
    const { bob, course } = await setup();
    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .set(auth(bob.token))
      .send(courseBody({ title: "Hacked" }));
    expect(res.status).toBe(403);
    expect((await Course.findById(course._id)).title).toBe("Algorithms");
  });

  it("returns 403 on delete and keeps the course", async () => {
    const { bob, course } = await setup();
    const res = await request(app).delete(`/api/courses/${course._id}`).set(auth(bob.token));
    expect(res.status).toBe(403);
    expect(await Course.countDocuments({ _id: course._id })).toBe(1);
  });

  it("bulk delete skips courses that belong to someone else", async () => {
    const { bob, course } = await setup();
    const res = await request(app).delete("/api/courses").set(auth(bob.token)).send({ ids: [course._id] });
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(0);
    expect(await Course.countDocuments({ _id: course._id })).toBe(1);
  });
});
