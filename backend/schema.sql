CREATE DATABASE IF NOT EXISTS course_management;

USE course_management;


-- =====================================================
-- Users table
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    full_name VARCHAR(100) NOT NULL,

    role ENUM('admin', 'student') NOT NULL
);


-- =====================================================
-- Courses table
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(100) NOT NULL,

    category VARCHAR(50) NOT NULL,

    level VARCHAR(30) NOT NULL,

    duration VARCHAR(30) NOT NULL,

    price DECIMAL(10, 2) NOT NULL,

    image VARCHAR(500),

    description TEXT,

    -- NULL means unlimited capacity
    max_students INT NULL DEFAULT NULL
);


-- =====================================================
-- Enrollments table
-- CR-011: Enrollment Approval Workflow
-- =====================================================

CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    course_id INT NOT NULL,

    status ENUM('pending', 'approved', 'rejected')
        NOT NULL DEFAULT 'pending',

    reviewed_by INT NULL,

    reviewed_at DATETIME NULL,

    decision_note TEXT NULL,

    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Only one pending or approved request per student/course.
    -- Rejected requests can be submitted again.
    active_course_id INT
    GENERATED ALWAYS AS (
        CASE
            WHEN status IN ('pending', 'approved')
            THEN course_id
            ELSE NULL
        END
    ) STORED,

    UNIQUE KEY uq_student_active_course (
        student_id,
        active_course_id
    ),

    INDEX idx_enrollments_status (status),

    INDEX idx_enrollments_course_status (
        course_id,
        status
    ),

    INDEX idx_enrollments_student_status (
        student_id,
        status
    ),

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_enrollment_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);