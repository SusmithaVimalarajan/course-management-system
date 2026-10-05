import { useEffect, useMemo, useState } from "react";
import {
  FaBook,
  FaMoneyBillWave,
  FaChartLine,
  FaLayerGroup,
  FaClock,
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MyEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const loadEnrollments = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/enrollments");

        setEnrollments(response.data.enrollments || []);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load your enrollments."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, []);

  // ---------- Statistics ----------
  const totalCourses = enrollments.length;

  const totalValue = enrollments.reduce(
    (total, enrollment) =>
      total + Number(enrollment.price || 0),
    0
  );

  const averagePrice =
    totalCourses > 0 ? totalValue / totalCourses : 0;

  const distinctCategories = new Set(
    enrollments
      .map((enrollment) => enrollment.category)
      .filter(Boolean)
  ).size;

  // ---------- Sorting ----------
  const sortedEnrollments = useMemo(() => {
    const list = [...enrollments];

    if (sortBy === "newest") {
      return list.sort(
        (a, b) =>
          new Date(b.enrolled_at) -
          new Date(a.enrolled_at)
      );
    }

    if (sortBy === "oldest") {
      return list.sort(
        (a, b) =>
          new Date(a.enrolled_at) -
          new Date(b.enrolled_at)
      );
    }

    if (sortBy === "price-high") {
      return list.sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      );
    }

    if (sortBy === "price-low") {
      return list.sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      );
    }

    return list;
  }, [enrollments, sortBy]);

  // ---------- Helpers ----------
  const formatPrice = (price) => {
    return `Rs. ${Number(price || 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-GB"
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
              These are the courses you are enrolled in.
            </p>
          </div>
        </div>


        {/* ---------- Statistics ---------- */}
        <div className="enrollment-stats">

          <div className="stat-card">
            <div className="stat-icon">
              <FaBook />
            </div>

            <div>
              <h3>{totalCourses}</h3>
              <p>Total Enrolled Courses</p>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <h3>{formatPrice(totalValue)}</h3>
              <p>Total Course Value</p>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon">
              <FaChartLine />
            </div>

            <div>
              <h3>{formatPrice(averagePrice)}</h3>
              <p>Average Course Price</p>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon">
              <FaLayerGroup />
            </div>

            <div>
              <h3>{distinctCategories}</h3>
              <p>Distinct Categories</p>
            </div>
          </div>

        </div>


        {/* ---------- Enrolled Courses Header ---------- */}
        <div className="enrolled-courses-header">

          <div>
            <h2>Enrolled Courses</h2>

            <p>
              {totalCourses}{" "}
              {totalCourses === 1
                ? "course"
                : "courses"}{" "}
              enrolled
            </p>
          </div>


          <div className="sort-control">

            <label htmlFor="sortCourses">
              Sort by
            </label>

            <select
              id="sortCourses"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="input"
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
            </select>

          </div>

        </div>


        {/* ---------- Loading ---------- */}
        {loading && (
          <div className="loading">
            Loading your enrollments...
          </div>
        )}


        {/* ---------- Error ---------- */}
        {!loading && error && (
          <p className="error">{error}</p>
        )}


        {/* ---------- Empty ---------- */}
        {!loading &&
          !error &&
          enrollments.length === 0 && (
            <div className="empty">
              <FaBook />

              <h3>No enrolled courses</h3>

              <p>
                You have not enrolled in any courses yet.
              </p>
            </div>
          )}


        {/* ---------- Course Cards ---------- */}
        {!loading &&
          !error &&
          sortedEnrollments.length > 0 && (
            <div className="enrollment-grid">

              {sortedEnrollments.map((enrollment) => (

                <article
                  className="enrollment-card"
                  key={enrollment.id}
                >

                  {/* Course Image */}
                  <div className="course-image">

                    {enrollment.image_url ||
                    enrollment.image ||
                    enrollment.thumbnail ? (
                      <img
                        src={
                          enrollment.image_url ||
                          enrollment.image ||
                          enrollment.thumbnail
                        }
                        alt={enrollment.title}
                      />
                    ) : (
                      <div className="course-image-placeholder">
                        {enrollment.title}
                      </div>
                    )}

                  </div>


                  {/* Card Body */}
                  <div className="enrollment-card-body">

                    {/* Category + Level */}
                    <div className="course-tags">

                      <span className="tag tag-category">
                        {enrollment.category}
                      </span>

                      <span className="tag tag-level">
                        {enrollment.level}
                      </span>

                    </div>


                    {/* Title */}
                    <h3>{enrollment.title}</h3>


                    {/* Description */}
                    <p className="course-description">
                      {enrollment.description}
                    </p>


                    {/* Course Details */}
                    <div className="course-meta">

                      <div>
                        <strong>Duration:</strong>{" "}
                        {enrollment.duration
                          ? enrollment.duration
                          : `${enrollment.duration_weeks || 0} Weeks`}
                      </div>

                      <div>
                        <strong>Price:</strong>{" "}
                        {formatPrice(
                          enrollment.price
                        )}
                      </div>

                      <div>
                        <strong>Enrolled on:</strong>{" "}
                        {formatDate(
                          enrollment.enrolled_at
                        )}
                      </div>

                    </div>


                    {/* View Course */}
                    <button
                      type="button"
                      className="btn btn-outline enrollment-view-btn"
                      onClick={() => {
                        window.location.href = `/courses/${enrollment.course_id}`;
                      }}
                    >
                      View Course
                    </button>

                  </div>

                </article>

              ))}

            </div>
          )}

      </main>

      <Footer />
    </>
  );
}

export default MyEnrollments;