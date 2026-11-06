const express = require("express");
const router = express.Router();

const {
  enrollInCourse,
  getMyEnrollments,
  cancelMyEnrollment,
  getCourseEnrollments,
  getAllEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment
} = require("../controllers/enrollmentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// =====================================================
// STUDENT ROUTES
// =====================================================

// Student: submit enrollment request
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["student"]),
  enrollInCourse
);

// Student: view own enrollment requests
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMyEnrollments
);

// Student: cancel own pending request
router.delete(
  "/my/:id",
  authMiddleware,
  roleMiddleware(["student"]),
  cancelMyEnrollment
);


// =====================================================
// ADMIN ROUTES
// =====================================================

// Admin: get all enrollments with filters
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEnrollments
);

// Admin: get students in a specific course
router.get(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getCourseEnrollments
);

// Admin: approve or reject enrollment
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateEnrollmentStatus
);

// Admin: delete enrollment
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEnrollment
);

module.exports = router;