const Course = require("../models/courseModel");
const User = require("../models/userModel");


// =====================================================
// Maximum student validation
// =====================================================

function normalizeMaxStudents(value) {

  // Blank / missing = unlimited
  if (
    value === null ||
    value === undefined ||
    (
      typeof value === "string" &&
      value.trim() === ""
    )
  ) {
    return null;
  }


  // String values must contain digits only.
  // This rejects:
  // - decimals
  // - negative values
  // - letters
  // - special numeric formats
  if (
    typeof value === "string" &&
    !/^\d+$/.test(value.trim())
  ) {

    throw new Error(
      "Maximum students must be a positive integer."
    );
  }


  const numberValue =
    Number(value);


  if (
    !Number.isSafeInteger(numberValue) ||
    numberValue <= 0 ||
    numberValue > 2147483647
  ) {

    throw new Error(
      "Maximum students must be a positive integer."
    );
  }


  return numberValue;
}


// =====================================================
// Get all courses
// =====================================================

const getAllCourses = async (req, res) => {

  try {

    const courses =
      await Course.getAll();

    res.status(200).json({
      message:
        "Courses retrieved successfully",
      courses,
    });

  } catch (error) {

    console.error(
      "Error getting courses:",
      error.message
    );

    res.status(500).json({
      message:
        "Internal server error",
    });
  }
};


// =====================================================
// Get one course
// =====================================================

const getCourseById = async (req, res) => {

  try {

    const { id } =
      req.params;

    const course =
      await Course.getById(id);

    if (!course) {

      return res.status(404).json({
        message:
          "Course not found",
      });
    }

    res.status(200).json({
      message:
        "Course retrieved successfully",
      course,
    });

  } catch (error) {

    console.error(
      "Error getting course:",
      error.message
    );

    res.status(500).json({
      message:
        "Internal server error",
    });
  }
};


// =====================================================
// Create course
// =====================================================

const createCourse = async (req, res) => {

  try {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = req.body;


    // Basic required fields
    if (
      !title ||
      !category ||
      !level
    ) {

      return res.status(400).json({
        message:
          "Title, category and level are required",
      });
    }


    let normalizedMaxStudents;

    try {

      normalizedMaxStudents =
        normalizeMaxStudents(
          max_students
        );

    } catch (validationError) {

      return res.status(400).json({
        message:
          validationError.message,
      });
    }


    const courseId =
      await Course.create({
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students:
          normalizedMaxStudents,
      });


    const course =
      await Course.getById(courseId);


    res.status(201).json({
      message:
        "Course created successfully",
      courseId,
      course,
    });

  } catch (error) {

    console.error(
      "Error creating course:",
      error.message
    );

    res.status(500).json({
      message:
        "Internal server error",
    });
  }
};


// =====================================================
// Update course
// =====================================================

const updateCourse = async (req, res) => {

  try {

    const { id } =
      req.params;

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = req.body;


    let normalizedMaxStudents;

    try {

      normalizedMaxStudents =
        normalizeMaxStudents(
          max_students
        );

    } catch (validationError) {

      return res.status(400).json({
        message:
          validationError.message,
      });
    }


    try {

      await Course.update(
        id,
        {
          title,
          category,
          level,
          duration,
          price,
          image,
          description,
          max_students:
            normalizedMaxStudents,
        }
      );

    } catch (updateError) {

      if (
        updateError.code ===
        "COURSE_NOT_FOUND"
      ) {

        return res.status(404).json({
          message:
            "Course not found",
        });
      }


      if (
        updateError.code ===
        "CAPACITY_BELOW_ENROLLMENT"
      ) {

        return res.status(400).json({
          message:
            updateError.message,
        });
      }


      throw updateError;
    }


    const updatedCourse =
      await Course.getById(id);


    res.status(200).json({
      message:
        "Course updated successfully",
      course:
        updatedCourse,
    });

  } catch (error) {

    console.error(
      "Error updating course:",
      error.message
    );

    res.status(500).json({
      message:
        "Internal server error",
    });
  }
};


// =====================================================
// Delete course
// =====================================================

const deleteCourse = async (req, res) => {

  try {

    const { id } =
      req.params;

    const existingCourse =
      await Course.getById(id);

    if (!existingCourse) {

      return res.status(404).json({
        message:
          "Course not found",
      });
    }

    await Course.delete(id);

    res.status(200).json({
      message:
        "Course deleted successfully",
    });

  } catch (error) {

    console.error(
      "Error deleting course:",
      error.message
    );

    res.status(500).json({
      message:
        "Internal server error",
    });
  }
};


// =====================================================
// Get statistics
// =====================================================

const getStats = async (req, res) => {

  try {

    const courses =
      await Course.getAll();

    const studentCount =
      await User.countByRole("student");


    res.status(200).json({
      message:
        "Statistics retrieved successfully",
      courseCount:
        courses.length,
      studentCount:
        studentCount,
    });

  } catch (error) {

    console.error(
      "Error getting statistics:",
      error.message
    );

    res.status(500).json({
      message:
        "Internal server error",
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