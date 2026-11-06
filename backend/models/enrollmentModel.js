const db = require("../config/db");

const Enrollment = {
  // =====================================================
  // CR-011: CREATE PENDING ENROLLMENT REQUEST
  // =====================================================

  async create(studentId, courseId) {
    const [result] = await db.execute(
      `INSERT INTO enrollments
       (student_id, course_id, status)
       VALUES (?, ?, 'pending')`,
      [studentId, courseId]
    );

    return result.insertId;
  },

  // =====================================================
  // FIND EXISTING ACTIVE REQUEST
  // Pending or approved requests only
  // =====================================================

  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
         AND course_id = ?
         AND status IN ('pending', 'approved')
       LIMIT 1`,
      [studentId, courseId]
    );

    return rows[0];
  },

  // =====================================================
  // GET A STUDENT'S ENROLLMENTS
  // =====================================================

  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.student_id,
         e.course_id,
         e.status,
         e.enrolled_at,
         e.reviewed_by,
         e.reviewed_at,
         e.decision_note,
         c.title,
         c.category,
         c.level,
         c.duration,
         c.price,
         c.image,
         c.description
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC`,
      [studentId]
    );

    return rows;
  },

  // =====================================================
  // GET STUDENTS ENROLLED IN A COURSE
  // =====================================================

  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.student_id,
         e.course_id,
         e.status,
         e.enrolled_at,
         e.reviewed_by,
         e.reviewed_at,
         e.decision_note,
         u.username,
         u.full_name
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC`,
      [courseId]
    );

    return rows;
  },

  // =====================================================
  // CR-008 + CR-011
  // SERVER-SIDE SEARCH, FILTERING, SORTING AND PAGINATION
  // =====================================================

  async getAll(options = {}) {
    const {
      q = "",
      courseId = null,
      from = null,
      to = null,
      status = null,
      sort = "date",
      order = "desc",
      page = 1,
      limit = 20
    } = options;

    const sortColumns = {
      date: "e.enrolled_at",
      student: "u.full_name",
      course: "c.title"
    };

    const sortColumn = sortColumns[sort];

    if (!sortColumn) {
      throw new Error("Invalid sort field");
    }

    const sortOrder = order === "asc" ? "ASC" : "DESC";

    const conditions = [];
    const params = [];

    if (q) {
      // Treat %, _ and ! as literal search characters.
      const escapedSearch = q.replace(/[!%_]/g, "!$&");
      const pattern = `%${escapedSearch}%`;

      conditions.push(
        `(u.full_name LIKE ? ESCAPE '!' OR
          u.username LIKE ? ESCAPE '!')`
      );

      params.push(pattern, pattern);
    }

    if (courseId !== null) {
      conditions.push("e.course_id = ?");
      params.push(courseId);
    }

    if (from !== null) {
      conditions.push("e.enrolled_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    if (to !== null) {
      conditions.push(
        "e.enrolled_at < DATE_ADD(?, INTERVAL 1 DAY)"
      );

      params.push(to);
    }

    // CR-011: Filter by enrollment status.
    if (status !== null) {
      conditions.push("e.status = ?");
      params.push(status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Count matching records.
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       ${whereClause}`,
      params
    );

    const total = Number(countRows[0].total);

    const offset = (page - 1) * limit;

    // Retrieve requested page.
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.student_id,
         e.course_id,
         e.status,
         e.enrolled_at,
         e.reviewed_by,
         e.reviewed_at,
         e.decision_note,
         u.username,
         u.full_name,
         c.title,
         c.category,
         c.level
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}, e.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      enrollments: rows,
      total
    };
  },

  // =====================================================
  // CR-011: ADMIN APPROVE OR REJECT REQUEST
  // Uses a transaction and locks the course row.
  // =====================================================

  async updateStatus(
    enrollmentId,
    newStatus,
    adminId,
    decisionNote = null
  ) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Lock the enrollment record.
      const [enrollmentRows] = await connection.execute(
        `SELECT
           id,
           student_id,
           course_id,
           status
         FROM enrollments
         WHERE id = ?
         FOR UPDATE`,
        [enrollmentId]
      );

      if (enrollmentRows.length === 0) {
        const error = new Error("Enrollment not found");
        error.statusCode = 404;
        throw error;
      }

      const enrollment = enrollmentRows[0];

      if (enrollment.status !== "pending") {
        const error = new Error(
          "Only pending requests can be processed"
        );

        error.statusCode = 409;
        throw error;
      }

      // Lock course row before checking capacity.
      const [courseRows] = await connection.execute(
        `SELECT
           id,
           max_students
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [enrollment.course_id]
      );

      if (courseRows.length === 0) {
        const error = new Error("Course not found");
        error.statusCode = 404;
        throw error;
      }

      // Approval-specific checks.
      if (newStatus === "approved") {
        // Check for an existing approved enrollment.
        const [duplicateRows] = await connection.execute(
          `SELECT id
           FROM enrollments
           WHERE student_id = ?
             AND course_id = ?
             AND status = 'approved'
             AND id <> ?
           LIMIT 1`,
          [
            enrollment.student_id,
            enrollment.course_id,
            enrollmentId
          ]
        );

        if (duplicateRows.length > 0) {
          const error = new Error(
            "Student already has an approved enrollment"
          );

          error.statusCode = 409;
          throw error;
        }

        // Count approved enrollments only.
        const [capacityRows] = await connection.execute(
          `SELECT COUNT(*) AS approvedCount
           FROM enrollments
           WHERE course_id = ?
             AND status = 'approved'`,
          [enrollment.course_id]
        );

        const approvedCount = Number(
          capacityRows[0].approvedCount
        );

        const maxStudents = courseRows[0].max_students;

        if (
          maxStudents !== null &&
          approvedCount >= Number(maxStudents)
        ) {
          const error = new Error(
            "Course capacity is full"
          );

          error.statusCode = 409;
          throw error;
        }
      }

      // Update decision.
      const [updateResult] = await connection.execute(
        `UPDATE enrollments
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = NOW(),
             decision_note = ?
         WHERE id = ?
           AND status = 'pending'`,
        [
          newStatus,
          adminId,
          newStatus === "rejected" ? decisionNote : null,
          enrollmentId
        ]
      );

      if (updateResult.affectedRows !== 1) {
        const error = new Error(
          "Enrollment request has already been processed"
        );

        error.statusCode = 409;
        throw error;
      }

      await connection.commit();

      return {
        enrollmentId,
        status: newStatus,
        reviewedBy: adminId
      };

    } catch (error) {
      await connection.rollback();
      throw error;

    } finally {
      connection.release();
    }
  },

  // =====================================================
  // CR-011: STUDENT CANCEL PENDING REQUEST ONLY
  // =====================================================

  async cancelPending(studentId, enrollmentId) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?
         AND student_id = ?
         AND status = 'pending'`,
      [enrollmentId, studentId]
    );

    return result;
  },

  // =====================================================
  // ADMIN DELETE ENROLLMENT
  // Existing functionality preserved.
  // =====================================================

  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  }
};

module.exports = Enrollment;