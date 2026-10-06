const express = require("express");

const router = express.Router();

const {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
} = require("../controllers/enrollmentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// =====================================================
// STUDENT
// =====================================================

// Enroll in a course
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["student"]),
  enrollInCourse
);


// View my enrolled courses
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMyEnrollments
);


// Cancel my own enrollment
// IMPORTANT: Keep this route before "/:id"
router.delete(
  "/my/:id",
  authMiddleware,
  roleMiddleware(["student"]),
  cancelMyEnrollment
);


// =====================================================
// ADMIN
// =====================================================

// View all enrollments
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEnrollments
);


// View students enrolled in a course
router.get(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getCourseEnrollments
);


// Admin delete enrollment
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEnrollment
);


module.exports = router;