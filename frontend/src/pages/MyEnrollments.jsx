import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaMoneyBillWave,
  FaSortAmountDown,
  FaLayerGroup,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ID of the enrollment currently being cancelled
  const [cancellingId, setCancellingId] = useState(null);

  // Sorting option
  const [sortBy, setSortBy] = useState("newest");

  const user = getUser();


  // ===================================================
  // Load student's enrollments
  // ===================================================

  useEffect(() => {

    const getEnrollments = async () => {

      try {

        const response =
          await api.get("/enrollments/my");

        setEnrollments(
          response.data.enrollments || []
        );

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your enrollments"
        );

      } finally {

        setLoading(false);

      }
    };

    getEnrollments();

  }, []);


  // ===================================================
  // Cancel enrollment
  // ===================================================

  const handleCancelEnrollment = async (enrollment) => {

    const confirmed = window.confirm(
      `Are you sure you want to cancel your enrollment in "${enrollment.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setCancellingId(enrollment.id);

    try {

      const response =
        await api.delete(
          `/enrollments/my/${enrollment.id}`
        );

      setSuccess(
        response.data.message ||
        "Enrollment cancelled successfully"
      );

      // Refresh the list after successful cancellation
      const refreshedResponse =
        await api.get("/enrollments/my");

      setEnrollments(
        refreshedResponse.data.enrollments || []
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to cancel enrollment. Please try again."
      );

    } finally {

      setCancellingId(null);

    }
  };


  // ===================================================
  // Format date
  // ===================================================

  const formatDate = (value) => {

    if (!value) return "-";

    return new Date(value).toLocaleDateString();

  };


  // ===================================================
  // Statistics
  // ===================================================

  const totalCourses = enrollments.length;


  const totalCourseValue = enrollments.reduce(
    (total, enrollment) => {
      return total + Number(enrollment.price || 0);
    },
    0
  );


  const averageCoursePrice =
    totalCourses > 0
      ? totalCourseValue / totalCourses
      : 0;


  const distinctCategories = new Set(
    enrollments
      .map((enrollment) => enrollment.category)
      .filter(Boolean)
  ).size;


  // ===================================================
  // Sort enrollments
  // ===================================================

  const sortedEnrollments = useMemo(() => {

    const sorted = [...enrollments];

    switch (sortBy) {

      case "newest":

        sorted.sort(
          (a, b) =>
            new Date(b.enrolled_at) -
            new Date(a.enrolled_at)
        );

        break;


      case "oldest":

        sorted.sort(
          (a, b) =>
            new Date(a.enrolled_at) -
            new Date(b.enrolled_at)
        );

        break;


      case "price-high":

        sorted.sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        );

        break;


      case "price-low":

        sorted.sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        );

        break;


      case "title-a-z":

        sorted.sort(
          (a, b) =>
            (a.title || "").localeCompare(
              b.title || ""
            )
        );

        break;


      case "title-z-a":

        sorted.sort(
          (a, b) =>
            (b.title || "").localeCompare(
              a.title || ""
            )
        );

        break;


      default:
        break;
    }

    return sorted;

  }, [enrollments, sortBy]);


  // ===================================================
  // Currency format
  // ===================================================

  const formatPrice = (price) => {

    return Number(price || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  };


  return (

    <>
      <Navbar />

      <main className="container my-enrollments-page">

        {/* ---------- Page Header ---------- */}

        <div className="page-header">

          <div>

            <h1>My Enrollments</h1>

            <p className="page-subtitle">

              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}

            </p>

          </div>


          <Link
            to="/courses"
            className="btn btn-primary"
          >
            <FaSearch />
            Browse More Courses
          </Link>

        </div>


        {/* ---------- Loading ---------- */}

        {loading && (
          <p className="loading">
            Loading your enrollments...
          </p>
        )}


        {/* ---------- Success ---------- */}

        {success && !loading && (
          <p className="success">
            {success}
          </p>
        )}


        {/* ---------- Error ---------- */}

        {error && !loading && (
          <p className="error">
            {error}
          </p>
        )}


        {/* ---------- Empty State ---------- */}

        {!loading &&
          !error &&
          enrollments.length === 0 && (

            <div className="empty-box">

              <p className="empty">
                You have not enrolled in any courses yet.
              </p>

              <Link
                to="/courses"
                className="btn btn-primary"
              >
                <FaSearch />
                Find a Course
              </Link>

            </div>
          )}


        {/* ---------- Enrollment Content ---------- */}

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <>

              {/* ---------- Statistics ---------- */}

              <div className="enrollment-stats">

                <div className="enrollment-stat-card">

                  <div className="enrollment-stat-icon">
                    <FaBook />
                  </div>

                  <div>
                    <h3>{totalCourses}</h3>
                    <p>Total Enrolled Courses</p>
                  </div>

                </div>


                <div className="enrollment-stat-card">

                  <div className="enrollment-stat-icon">
                    <FaMoneyBillWave />
                  </div>

                  <div>
                    <h3>
                      Rs. {formatPrice(totalCourseValue)}
                    </h3>

                    <p>Total Course Value</p>
                  </div>

                </div>


                <div className="enrollment-stat-card">

                  <div className="enrollment-stat-icon">
                    <FaSortAmountDown />
                  </div>

                  <div>
                    <h3>
                      Rs. {formatPrice(averageCoursePrice)}
                    </h3>

                    <p>Average Course Price</p>
                  </div>

                </div>


                <div className="enrollment-stat-card">

                  <div className="enrollment-stat-icon">
                    <FaLayerGroup />
                  </div>

                  <div>
                    <h3>{distinctCategories}</h3>

                    <p>Distinct Categories</p>
                  </div>

                </div>

              </div>


              {/* ---------- Courses Header ---------- */}

              <div className="enrolled-courses-header">

                <div>

                  <h2>
                    Enrolled Courses
                  </h2>

                  <p>
                    {totalCourses}{" "}
                    {totalCourses === 1
                      ? "course"
                      : "courses"}{" "}
                    enrolled
                  </p>

                </div>


                {/* ---------- Sort ---------- */}

                <div className="sort-control">

                  <label htmlFor="sortCourses">
                    Sort by
                  </label>

                  <select
                    id="sortCourses"
                    className="input"
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value)
                    }
                  >

                    <option value="newest">
                      Newest Enrolled
                    </option>

                    <option value="oldest">
                      Oldest Enrolled
                    </option>

                    <option value="price-high">
                      Price: High to Low
                    </option>

                    <option value="price-low">
                      Price: Low to High
                    </option>

                    <option value="title-a-z">
                      Course: A to Z
                    </option>

                    <option value="title-z-a">
                      Course: Z to A
                    </option>

                  </select>

                </div>

              </div>


              {/* ---------- Course Grid ---------- */}

              <div className="enrollment-grid">

                {sortedEnrollments.map(
                  (enrollment) => {

                    const isCancelling =
                      cancellingId === enrollment.id;

                    return (
                      <article
                        className="enrollment-card"
                        key={enrollment.id}
                      >

                        {/* Course Image */}

                        <div className="course-image">

                          {enrollment.image ? (

                            <img
                              src={enrollment.image}
                              alt={enrollment.title}
                              loading="lazy"
                            />

                          ) : (

                            <div className="course-image-placeholder">
                              {enrollment.title}
                            </div>

                          )}

                        </div>


                        {/* Card Body */}

                        <div className="enrollment-card-body">

                          {/* Tags */}

                          <div className="course-tags">

                            <span className="tag tag-category">
                              {enrollment.category}
                            </span>

                            <span className="tag tag-level">
                              {enrollment.level}
                            </span>

                          </div>


                          {/* Title */}

                          <h3>
                            {enrollment.title}
                          </h3>


                          {/* Description */}

                          <p className="course-description">

                            {enrollment.description?.slice(
                              0,
                              100
                            )}

                            {enrollment.description?.length > 100
                              ? "..."
                              : ""}

                          </p>


                          {/* Course Information */}

                          <div className="course-meta">

                            <div>
                              <strong>
                                Duration:
                              </strong>{" "}
                              {enrollment.duration}
                            </div>


                            <div>
                              <strong>
                                Price:
                              </strong>{" "}
                              Rs.{" "}
                              {formatPrice(
                                enrollment.price
                              )}
                            </div>


                            <div>
                              <strong>
                                Enrolled on:
                              </strong>{" "}
                              {formatDate(
                                enrollment.enrolled_at
                              )}
                            </div>

                          </div>


                          {/* Actions */}

                          <div className="enrollment-card-actions">

                            <Link
                              to={`/courses/${enrollment.course_id}`}
                              className="btn btn-outline enrollment-view-btn"
                            >
                              View Course
                            </Link>


                            <button
                              type="button"
                              className="btn btn-danger enrollment-cancel-btn"
                              onClick={() =>
                                handleCancelEnrollment(
                                  enrollment
                                )
                              }
                              disabled={isCancelling}
                            >
                              <FaTimesCircle />

                              {isCancelling
                                ? "Cancelling..."
                                : "Cancel Enrollment"}
                            </button>

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            </>

          )}

      </main>

      <Footer />

    </>

  );
}

export default MyEnrollments;