const Course = require("../models/courseModel");
const User = require("../models/userModel");
const validateCourse = require("../helpers/validateCourse");

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.getAll();

    res.status(200).json({
      message: "Courses retrieved successfully",
      courses,
    });

  } catch (error) {
    console.error("Error getting courses:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get one course
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.getById(id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json({
      message: "Course retrieved successfully",
      course,
    });

  } catch (error) {
    console.error("Error getting course:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Create course
const createCourse = async (req, res) => {
  try {
    const course = req.validatedCourse;

    // Check duplicate title
    const existingCourse = await Course.findByTitle(
      course.title
    );

    if (existingCourse) {
      return res.status(409).json({
        message: "Course title already exists.",
        errors: {
          title: "A course with this title already exists.",
        },
      });
    }

    const courseId = await Course.create(course);

    return res.status(201).json({
      message: "Course created successfully",
      courseId,
    });
  } catch (error) {
    console.error(
      "Error creating course:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = req.validatedCourse;

    // Check whether course exists
    const existingCourse = await Course.getById(id);

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Check duplicate title
    // Exclude current course ID
    const duplicateCourse =
      await Course.findByTitle(
        course.title,
        id
      );

    if (duplicateCourse) {
      return res.status(409).json({
        message: "Course title already exists.",
        errors: {
          title:
            "A course with this title already exists.",
        },
      });
    }

    await Course.update(id, course);

    const updatedCourse =
      await Course.getById(id);

    return res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error(
      "Error updating course:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const existingCourse = await Course.getById(id);

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    await Course.delete(id);

    res.status(200).json({
      message: "Course deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting course:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get statistics (PUBLIC)
const getStats = async (req, res) => {
  try {
    const courses = await Course.getAll();
    const studentCount = await User.countByRole("student");

    res.status(200).json({
      message: "Statistics retrieved successfully",
      courseCount: courses.length,
      studentCount: studentCount,
    });

  } catch (error) {
    console.error("Error getting statistics:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
};
