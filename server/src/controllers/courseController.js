const Course = require("../models/courseModel");
const { findConflicts } = require("../utils/conflicts");

// Loads a course and makes sure it belongs to the logged in user.
const findOwnedCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }
  if (course.user_id.toString() !== req.user.id) {
    res.status(403);
    throw new Error("User doesn't have permission to access this course");
  }
  return course;
};

// Rejects a course whose times overlap another course of the same user in the same term.
const assertNoConflicts = async (req, res, excludeId) => {
  const { termSeason, termYear } = req.body;
  const query = { user_id: req.user.id, termSeason, termYear };
  if (excludeId) query._id = { $ne: excludeId };

  const messages = findConflicts(req.body, await Course.find(query));
  if (messages.length) {
    res.status(409);
    const err = new Error("This course clashes with another course in the same term");
    err.details = messages.map((message) => ({ path: "schedules", message }));
    throw err;
  }
};

//@desc Get all courses of the current user
//@route GET /api/courses
//@access private
const getCourses = async (req, res) => {
  const courses = await Course.find({ user_id: req.user.id }).sort({ termYear: 1, code: 1 });
  res.status(200).json(courses);
};

//@desc Create a course
//@route POST /api/courses
//@access private
const createCourse = async (req, res) => {
  await assertNoConflicts(req, res);
  const course = await Course.create({ ...req.body, user_id: req.user.id });
  res.status(201).json(course);
};

//@desc Get one course
//@route GET /api/courses/:id
//@access private
const getCourse = async (req, res) => {
  const course = await findOwnedCourse(req, res);
  res.status(200).json(course);
};

//@desc Update a course
//@route PUT /api/courses/:id
//@access private
const updateCourse = async (req, res) => {
  const course = await findOwnedCourse(req, res);
  await assertNoConflicts(req, res, course.id);
  course.set(req.body);
  await course.save();
  res.status(200).json(course);
};

//@desc Delete a course
//@route DELETE /api/courses/:id
//@access private
const deleteCourse = async (req, res) => {
  const course = await findOwnedCourse(req, res);
  await course.deleteOne();
  res.status(200).json(course);
};

//@desc Delete several courses at once (only the user's own)
//@route DELETE /api/courses
//@access private
const deleteCourses = async (req, res) => {
  const result = await Course.deleteMany({
    _id: { $in: req.body.ids },
    user_id: req.user.id,
  });
  res.status(200).json({ deletedCount: result.deletedCount });
};

module.exports = {
  getCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  deleteCourses,
};
