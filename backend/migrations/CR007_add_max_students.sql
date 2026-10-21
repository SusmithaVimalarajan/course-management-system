USE course_management;

-- CR-007
-- Add optional maximum student capacity to courses.
-- Existing courses automatically receive NULL,
-- which represents unlimited capacity.

ALTER TABLE courses
ADD COLUMN max_students INT NULL DEFAULT NULL;