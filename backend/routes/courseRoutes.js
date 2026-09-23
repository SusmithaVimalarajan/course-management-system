const express = require("express");

const router = express.Router();

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
} = require("../controllers/courseController");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  validateCourse,
} = require("../helpers/validateCourse");


// Get statistics
router.get(
  "/stats",
  getStats
);


// PUBLIC
// View all courses
router.get(
  "/",
  getAllCourses
);


// PUBLIC
// View one course
router.get(
  "/:id",
  getCourseById
);


// Admin only
// Create course
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateCourse,
  createCourse
);


// Admin only
// Update course
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateCourse,
  updateCourse
);


// Admin only
// Delete course
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteCourse
);


module.exports = router;