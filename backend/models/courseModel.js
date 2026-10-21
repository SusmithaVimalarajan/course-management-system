const db = require("../config/db");


// =====================================================
// Convert raw course data into availability data
// =====================================================

function formatCourseAvailability(course) {

  const maxStudents =
    course.max_students === null ||
    course.max_students === undefined
      ? null
      : Number(course.max_students);

  const enrolledCount =
    Number(course.enrolled_count || 0);

  const seatsRemaining =
    maxStudents === null
      ? null
      : Math.max(
          maxStudents - enrolledCount,
          0
        );

  const isFull =
    maxStudents !== null &&
    enrolledCount >= maxStudents;

  return {
    ...course,
    max_students: maxStudents,
    enrolled_count: enrolledCount,
    seats_remaining: seatsRemaining,
    is_full: isFull,
  };
}


const Course = {

  // ===================================================
  // Get all courses with availability
  // ===================================================

  async getAll() {

    const [rows] = await db.execute(
      `SELECT
          c.*,
          (
            SELECT COUNT(*)
            FROM enrollments e
            WHERE e.course_id = c.id
          ) AS enrolled_count
       FROM courses c
       ORDER BY c.id ASC`
    );

    return rows.map(formatCourseAvailability);
  },


  // ===================================================
  // Get one course with availability
  // ===================================================

  async getById(id) {

    const [rows] = await db.execute(
      `SELECT
          c.*,
          (
            SELECT COUNT(*)
            FROM enrollments e
            WHERE e.course_id = c.id
          ) AS enrolled_count
       FROM courses c
       WHERE c.id = ?`,
      [id]
    );

    if (!rows[0]) {
      return null;
    }

    return formatCourseAvailability(rows[0]);
  },


  // ===================================================
  // Create course
  // ===================================================

  async create(course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;


    const [result] = await db.execute(
      `INSERT INTO courses
       (
         title,
         category,
         level,
         duration,
         price,
         image,
         description,
         max_students
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        max_students,
      ]
    );

    return result.insertId;
  },


  // ===================================================
  // Update course
  // Capacity validation is performed inside
  // the transaction so concurrent enrollment changes
  // cannot bypass the capacity rule.
  // ===================================================

  async update(id, course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;


    const connection =
      await db.getConnection();

    try {

      await connection.beginTransaction();


      // Lock the course row
      const [courseRows] =
        await connection.execute(
          `SELECT id
           FROM courses
           WHERE id = ?
           FOR UPDATE`,
          [id]
        );


      if (courseRows.length === 0) {

        const error =
          new Error("Course not found");

        error.code = "COURSE_NOT_FOUND";

        throw error;
      }


      // Current approved enrollment count
      const [countRows] =
        await connection.execute(
          `SELECT COUNT(*) AS enrolled_count
           FROM enrollments
           WHERE course_id = ?`,
          [id]
        );


      const enrolledCount =
        Number(countRows[0].enrolled_count);


      // Do not allow capacity below
      // current enrollment count.
      if (
        max_students !== null &&
        max_students < enrolledCount
      ) {

        const error =
          new Error(
            `Maximum students cannot be less than the current enrollment count (${enrolledCount}).`
          );

        error.code =
          "CAPACITY_BELOW_ENROLLMENT";

        throw error;
      }


      const [result] =
        await connection.execute(
          `UPDATE courses
           SET title = ?,
               category = ?,
               level = ?,
               duration = ?,
               price = ?,
               image = ?,
               description = ?,
               max_students = ?
           WHERE id = ?`,
          [
            title,
            category,
            level,
            duration,
            price,
            image,
            description,
            max_students,
            id,
          ]
        );


      await connection.commit();

      return result;

    } catch (error) {

      await connection.rollback();

      throw error;

    } finally {

      connection.release();

    }
  },


  // ===================================================
  // Delete course
  // ===================================================

  async delete(id) {

    const [result] = await db.execute(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );

    return result;
  },

};


module.exports = Course;