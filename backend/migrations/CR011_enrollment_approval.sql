USE course_management;

-- =====================================================
-- CR-011: Enrollment Approval Workflow
-- =====================================================

-- 1. Add approval workflow columns.
ALTER TABLE enrollments
ADD COLUMN status ENUM('pending', 'approved', 'rejected')
    NOT NULL DEFAULT 'approved'
    AFTER course_id,

ADD COLUMN reviewed_by INT NULL
    AFTER status,

ADD COLUMN reviewed_at DATETIME NULL
    AFTER reviewed_by,

ADD COLUMN decision_note TEXT NULL
    AFTER reviewed_at;

-- 2. Existing enrollment records remain approved.
UPDATE enrollments
SET status = 'approved',
    reviewed_by = NULL,
    reviewed_at = NULL,
    decision_note = NULL;

-- 3. Remove the old restriction that prevents
--    students from submitting a new request after rejection.
ALTER TABLE enrollments
DROP INDEX student_id;

-- 4. Create a generated column.
--    Pending and approved requests receive their course ID.
--    Rejected requests receive NULL.
ALTER TABLE enrollments
ADD COLUMN active_course_id INT
GENERATED ALWAYS AS (
    CASE
        WHEN status IN ('pending', 'approved')
        THEN course_id
        ELSE NULL
    END
) STORED;

-- 5. A student can have only one active request
--    (pending or approved) for the same course.
CREATE UNIQUE INDEX uq_student_active_course
ON enrollments (student_id, active_course_id);

-- 6. Add reviewer foreign key.
ALTER TABLE enrollments
ADD CONSTRAINT fk_enrollment_reviewed_by
FOREIGN KEY (reviewed_by)
REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 7. Indexes for status filtering and reporting.
CREATE INDEX idx_enrollments_status
ON enrollments(status);

CREATE INDEX idx_enrollments_course_status
ON enrollments(course_id, status);

CREATE INDEX idx_enrollments_student_status
ON enrollments(student_id, status);