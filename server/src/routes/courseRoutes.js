const express = require("express");
const {
  getCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  deleteCourses,
} = require("../controllers/courseController");
const validateToken = require("../middleware/validateTokenHandler");
const validate = require("../middleware/validate");
const { courseSchema, deleteManySchema } = require("../validators/courseSchemas");

const router = express.Router();

router.use(validateToken);
router
  .route("/")
  .get(getCourses)
  .post(validate(courseSchema), createCourse)
  .delete(validate(deleteManySchema), deleteCourses);
router
  .route("/:id")
  .get(getCourse)
  .put(validate(courseSchema), updateCourse)
  .delete(deleteCourse);

module.exports = router;
