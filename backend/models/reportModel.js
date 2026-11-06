const db = require("../config/db");

const Report = {
  // =====================================================
  // ADMIN OVERVIEW
  // =====================================================

  async getAdminOverview() {
    const [overviewRows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM courses) AS totalCourses,

        (SELECT COUNT(*)
         FROM users
         WHERE role = 'student') AS totalStudents,

        (SELECT COUNT(*)
         FROM enrollments
         WHERE status = 'approved') AS totalEnrollments,

        (SELECT COUNT(*)
         FROM enrollments
         WHERE status = 'pending') AS pendingEnrollments,

        (SELECT COUNT(*)
         FROM enrollments
         WHERE status = 'rejected') AS rejectedEnrollments,

        (SELECT COUNT(DISTINCT e.student_id)
         FROM enrollments e
         INNER JOIN users u ON u.id = e.student_id
         WHERE u.role = 'student'
           AND e.status = 'approved') AS studentsWithEnrollments,

        (SELECT COUNT(*)
         FROM enrollments
         WHERE status = 'approved'
           AND enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           AND enrolled_at <= NOW()) AS enrollmentsLast30Days,

        (SELECT COUNT(*)
         FROM courses c
         WHERE NOT EXISTS (
           SELECT 1
           FROM enrollments e
           WHERE e.course_id = c.id
             AND e.status = 'approved'
         )) AS coursesWithoutEnrollments
    `);

    // Approved enrollments by category.
    const [categoryRows] = await db.execute(`
      SELECT
        c.category,
        COUNT(e.id) AS enrollmentCount
      FROM courses c
      LEFT JOIN enrollments e
        ON e.course_id = c.id
       AND e.status = 'approved'
      GROUP BY c.category
      ORDER BY enrollmentCount DESC, c.category ASC
    `);

    // Top five courses by approved enrollment.
    const [topCourseRows] = await db.execute(`
      SELECT
        c.id AS courseId,
        c.title,
        c.category,
        COUNT(e.id) AS enrollmentCount
      FROM courses c
      INNER JOIN enrollments e
        ON e.course_id = c.id
       AND e.status = 'approved'
      GROUP BY c.id, c.title, c.category
      ORDER BY enrollmentCount DESC, c.title ASC, c.id ASC
      LIMIT 5
    `);

    // Recent requests, including their status.
    const [recentEnrollmentRows] = await db.execute(`
      SELECT
        e.id,
        e.student_id,
        e.course_id,
        e.enrolled_at,
        e.status,
        e.reviewed_at,
        e.decision_note,
        u.username,
        u.full_name,
        c.title,
        c.category,
        c.level
      FROM enrollments e
      INNER JOIN users u ON u.id = e.student_id
      INNER JOIN courses c ON c.id = e.course_id
      WHERE u.role = 'student'
      ORDER BY e.enrolled_at DESC, e.id DESC
      LIMIT 6
    `);

    const overview = overviewRows[0];

    return {
      totalCourses: Number(overview.totalCourses || 0),
      totalStudents: Number(overview.totalStudents || 0),

      totalEnrollments: Number(
        overview.totalEnrollments || 0
      ),

      pendingEnrollments: Number(
        overview.pendingEnrollments || 0
      ),

      rejectedEnrollments: Number(
        overview.rejectedEnrollments || 0
      ),

      studentsWithEnrollments: Number(
        overview.studentsWithEnrollments || 0
      ),

      enrollmentsLast30Days: Number(
        overview.enrollmentsLast30Days || 0
      ),

      coursesWithoutEnrollments: Number(
        overview.coursesWithoutEnrollments || 0
      ),

      enrollmentsByCategory: categoryRows.map((row) => ({
        category: row.category,
        enrollmentCount: Number(row.enrollmentCount || 0)
      })),

      topCourses: topCourseRows.map((row) => ({
        courseId: Number(row.courseId),
        title: row.title,
        category: row.category,
        enrollmentCount: Number(row.enrollmentCount || 0)
      })),

      recentEnrollments: recentEnrollmentRows
    };
  },

  // =====================================================
  // STUDENT REPORT
  // Approved enrollments count as enrolled courses.
  // Pending and rejected requests are reported separately.
  // =====================================================

  async getStudentReport(studentId) {
    const [summaryRows] = await db.execute(
      `SELECT
         SUM(
           CASE WHEN e.status = 'approved' THEN 1 ELSE 0 END
         ) AS enrolledCourses,

         SUM(
           CASE WHEN e.status = 'pending' THEN 1 ELSE 0 END
         ) AS pendingRequests,

         SUM(
           CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END
         ) AS rejectedRequests,

         COUNT(
           DISTINCT CASE
             WHEN e.status = 'approved' THEN c.category
           END
         ) AS distinctCategories,

         MIN(
           CASE WHEN e.status = 'approved' THEN e.enrolled_at END
         ) AS earliestEnrollmentDate,

         MAX(
           CASE WHEN e.status = 'approved' THEN e.enrolled_at END
         ) AS latestEnrollmentDate

       FROM enrollments e
       INNER JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?`,
      [studentId]
    );

    const [recentRows] = await db.execute(
      `SELECT
         e.id,
         e.course_id AS courseId,
         e.enrolled_at AS enrolledAt,
         e.status,
         e.reviewed_at AS reviewedAt,
         e.decision_note AS decisionNote,
         c.title,
         c.category,
         c.level,
         c.price
       FROM enrollments e
       INNER JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC
       LIMIT 5`,
      [studentId]
    );

    const summary = summaryRows[0];

    return {
      enrolledCourses: Number(summary.enrolledCourses || 0),

      pendingRequests: Number(
        summary.pendingRequests || 0
      ),

      rejectedRequests: Number(
        summary.rejectedRequests || 0
      ),

      distinctCategories: Number(
        summary.distinctCategories || 0
      ),

      earliestEnrollmentDate:
        summary.earliestEnrollmentDate || null,

      latestEnrollmentDate:
        summary.latestEnrollmentDate || null,

      recentEnrollments: recentRows
    };
  }
};

module.exports = Report;