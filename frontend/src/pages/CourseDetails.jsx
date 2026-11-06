import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams
} from "react-router-dom";

import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt,
  FaCheckCircle
} from "react-icons/fa";

import api from "../services/api";

import {
  isLoggedIn,
  isStudent,
  isAdmin
} from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function CourseDetails() {
  const { id } = useParams();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);

  const loggedIn = isLoggedIn();
  const studentLoggedIn = isStudent();
  const adminLoggedIn = isAdmin();

  // Load course and student's existing request.
  useEffect(() => {
    let active = true;

    const getCourseData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/courses/${id}`);

        if (!active) return;

        setCourse(response.data.course);

        if (studentLoggedIn) {
          const enrollmentResponse = await api.get(
            "/enrollments/my"
          );

          if (!active) return;

          const existing = (
            enrollmentResponse.data.enrollments || []
          ).find(
            (item) => String(item.course_id) === String(id)
          );

          setEnrollmentStatus(existing?.status || null);
        } else {
          setEnrollmentStatus(null);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Failed to load course"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    getCourseData();

    return () => {
      active = false;
    };
  }, [id, studentLoggedIn]);

  // Submit enrollment request.
  const handleEnroll = async () => {
    setError("");
    setSuccess("");
    setRequesting(true);

    try {
      const response = await api.post("/enrollments", {
        courseId: id
      });

      setEnrollmentStatus("pending");

      setSuccess(
        response.data.message ||
        "Enrollment request submitted successfully"
      );

      const refreshedCourse = await api.get(`/courses/${id}`);
      setCourse(refreshedCourse.data.course);

    } catch (err) {
      const data = err.response?.data;

      if (err.response?.status === 409) {
        if (data?.status) {
          setEnrollmentStatus(data.status);
        }

        setError(
          data?.message ||
          "An active enrollment request already exists."
        );
      } else {
        setError(
          data?.message ||
          "Failed to submit enrollment request."
        );
      }
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p className="loading">Loading course...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !course) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p className="error">{error}</p>
          <div className="center-actions">
            <Link to="/courses" className="btn btn-primary">
              Back to Courses
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isUnlimited =
    course.max_students === null ||
    course.max_students === undefined;

  const availabilityClass = isUnlimited
    ? "details-availability-unlimited"
    : course.is_full
      ? "details-availability-full"
      : "details-availability-available";

  const statusLabels = {
    pending: "Request Pending",
    approved: "Enrollment Approved",
    rejected: "Previous Request Rejected"
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <p className="breadcrumb">
          <Link to="/courses">Courses</Link>
          <span> / </span>
          <span>{course.title}</span>
        </p>

        <div className="details-layout">
          <div className="details-image-wrapper">
            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />
          </div>

          <div className="details-info">
            <div className="course-card-tags">
              <span className="tag tag-category">
                {course.category}
              </span>

              <span className="tag tag-level">
                {course.level}
              </span>
            </div>

            <h1>{course.title}</h1>

            <p className="details-description">
              {course.description}
            </p>

            <dl className="details-list">
              <div>
                <dt>Category</dt>
                <dd>{course.category}</dd>
              </div>

              <div>
                <dt>Level</dt>
                <dd>{course.level}</dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>{course.duration}</dd>
              </div>

              <div>
                <dt>Price</dt>
                <dd className="details-price">
                  Rs. {course.price}
                </dd>
              </div>
            </dl>

            <div className={`details-availability ${availabilityClass}`}>
              {isUnlimited ? (
                <>
                  <strong>Availability</strong>
                  <span>Unlimited</span>
                </>
              ) : (
                <>
                  <strong>
                    {course.is_full ? "Course Full" : "Availability"}
                  </strong>

                  <span>
                    {course.enrolled_count || 0}
                    {" / "}
                    {course.max_students}
                    {" approved students"}
                  </span>
                </>
              )}
            </div>

            {success && <p className="success">{success}</p>}
            {error && <p className="error">{error}</p>}

            <div className="details-actions">
              {!loggedIn && (
                <div className="notice">
                  <p>
                    Please login as a student to request enrollment.
                  </p>

                  <Link
                    to="/login"
                    state={{
                      from:
                        location.pathname +
                        location.search +
                        location.hash
                    }}
                    className="btn btn-primary"
                  >
                    <FaSignInAlt />
                    Login to Request
                  </Link>
                </div>
              )}

              {studentLoggedIn && (
                <>
                  {enrollmentStatus ? (
                    <div className="enrollment-state-message">
                      <p>
                        <FaCheckCircle />{" "}
                        {statusLabels[enrollmentStatus]}
                      </p>

                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >
                        <FaGraduationCap />
                        My Enrollments
                      </Link>
                    </div>
                  ) : course.is_full ? (
                    <>
                      <p className="error">
                        This course is currently full.
                      </p>

                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        disabled
                      >
                        Course Full
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleEnroll}
                        disabled={requesting}
                      >
                        <FaShoppingCart />

                        {requesting
                          ? "Submitting Request..."
                          : "Request Enrollment"}
                      </button>

                      <p className="page-subtitle">
                        Your request will be reviewed by an administrator.
                      </p>
                    </>
                  )}
                </>
              )}

              {adminLoggedIn && (
                <div className="notice">
                  <p>
                    You are logged in as an administrator.
                    Only students can request enrollment.
                  </p>

                  <Link
                    to="/admin/courses"
                    className="btn btn-primary"
                  >
                    <FaChartBar />
                    Manage Courses
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default CourseDetails;