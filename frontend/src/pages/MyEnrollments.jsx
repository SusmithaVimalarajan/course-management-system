import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaBook,
  FaMoneyBillWave,
  FaSortAmountDown,
  FaLayerGroup,
  FaSearch,
  FaTimesCircle
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
  const [cancellingId, setCancellingId] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  const user = getUser();

  const loadEnrollments = async () => {
    try {
      const response = await api.get("/enrollments/my");
      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load your enrollment requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  // Cancel only pending requests.
  const handleCancelEnrollment = async (enrollment) => {
    const confirmed = window.confirm(
      `Cancel your pending request for "${enrollment.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setCancellingId(enrollment.id);

    try {
      const response = await api.delete(
        `/enrollments/my/${enrollment.id}`
      );

      setSuccess(
        response.data.message ||
        "Enrollment request cancelled successfully"
      );

      await loadEnrollments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to cancel request"
      );
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString();
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const pendingCount = enrollments.filter(
    (item) => item.status === "pending"
  ).length;

  const approvedEnrollments = enrollments.filter(
    (item) => item.status === "approved"
  );

  const rejectedCount = enrollments.filter(
    (item) => item.status === "rejected"
  ).length;

  const totalCourseValue = approvedEnrollments.reduce(
    (total, item) => total + Number(item.price || 0),
    0
  );

  const averageCoursePrice =
    approvedEnrollments.length > 0
      ? totalCourseValue / approvedEnrollments.length
      : 0;

  const distinctCategories = new Set(
    approvedEnrollments
      .map((item) => item.category)
      .filter(Boolean)
  ).size;

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
        sorted.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
        break;

      case "title-z-a":
        sorted.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "")
        );
        break;

      default:
        break;
    }

    return sorted;
  }, [enrollments, sortBy]);

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "cr011-status-approved";
      case "rejected":
        return "cr011-status-rejected";
      default:
        return "cr011-status-pending";
    }
  };

  return (
    <>
      <Navbar />

      <main className="container my-enrollments-page">
        <div className="page-header">
          <div>
            <h1>My Enrollments</h1>

            <p className="page-subtitle">
              {user?.full_name
                ? `${user.full_name}, view your enrollment requests and their status.`
                : "View your enrollment requests and their status."}
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse Courses
          </Link>
        </div>

        {loading && (
          <p className="loading">Loading your enrollments...</p>
        )}

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        {!loading && enrollments.length === 0 && (
          <div className="empty-box">
            <p className="empty">
              You have not submitted any enrollment requests yet.
            </p>

            <Link to="/courses" className="btn btn-primary">
              <FaSearch />
              Find a Course
            </Link>
          </div>
        )}

        {!loading && enrollments.length > 0 && (
          <>
            <div className="enrollment-stats">
              <div className="enrollment-stat-card">
                <div className="enrollment-stat-icon">
                  <FaBook />
                </div>
                <div>
                  <h3>{enrollments.length}</h3>
                  <p>Total Requests</p>
                </div>
              </div>

              <div className="enrollment-stat-card">
                <div className="enrollment-stat-icon">
                  <FaMoneyBillWave />
                </div>
                <div>
                  <h3>{pendingCount}</h3>
                  <p>Pending Requests</p>
                </div>
              </div>

              <div className="enrollment-stat-card">
                <div className="enrollment-stat-icon">
                  <FaSortAmountDown />
                </div>
                <div>
                  <h3>{approvedEnrollments.length}</h3>
                  <p>Approved Courses</p>
                </div>
              </div>

              <div className="enrollment-stat-card">
                <div className="enrollment-stat-icon">
                  <FaLayerGroup />
                </div>
                <div>
                  <h3>{rejectedCount}</h3>
                  <p>Rejected Requests</p>
                </div>
              </div>
            </div>

            <div className="cr011-approved-summary">
              <strong>
                Approved Course Value: Rs. {formatPrice(totalCourseValue)}
              </strong>

              <span>
                Average Approved Course Price: Rs.{" "}
                {formatPrice(averageCoursePrice)}
              </span>

              <span>
                Approved Categories: {distinctCategories}
              </span>
            </div>

            <div className="enrolled-courses-header">
              <div>
                <h2>My Enrollment Requests</h2>
                <p>
                  {enrollments.length} requests found
                </p>
              </div>

              <div className="sort-control">
                <label htmlFor="sortCourses">Sort by</label>

                <select
                  id="sortCourses"
                  className="input"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="title-a-z">Course: A to Z</option>
                  <option value="title-z-a">Course: Z to A</option>
                </select>
              </div>
            </div>

            <div className="enrollment-grid">
              {sortedEnrollments.map((enrollment) => {
                const isCancelling =
                  cancellingId === enrollment.id;

                return (
                  <article
                    className="enrollment-card"
                    key={enrollment.id}
                  >
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

                    <div className="enrollment-card-body">
                      <div className="course-tags">
                        <span className="tag tag-category">
                          {enrollment.category}
                        </span>

                        <span className="tag tag-level">
                          {enrollment.level}
                        </span>
                      </div>

                      <h3>{enrollment.title}</h3>

                      <p className="course-description">
                        {enrollment.description?.slice(0, 100)}
                        {enrollment.description?.length > 100
                          ? "..."
                          : ""}
                      </p>

                      <div className="cr011-status-row">
                        <strong>Status:</strong>

                        <span
                          className={`cr011-status ${getStatusClass(
                            enrollment.status
                          )}`}
                        >
                          {enrollment.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="course-meta">
                        <div>
                          <strong>Duration:</strong>{" "}
                          {enrollment.duration}
                        </div>

                        <div>
                          <strong>Price:</strong>{" "}
                          Rs. {formatPrice(enrollment.price)}
                        </div>

                        <div>
                          <strong>Requested on:</strong>{" "}
                          {formatDate(enrollment.enrolled_at)}
                        </div>

                        {enrollment.reviewed_at && (
                          <div>
                            <strong>Decision date:</strong>{" "}
                            {formatDate(enrollment.reviewed_at)}
                          </div>
                        )}
                      </div>

                      {enrollment.status === "pending" && (
                        <p className="cr011-info">
                          Your request is waiting for administrator approval.
                        </p>
                      )}

                      {enrollment.status === "approved" && (
                        <p className="cr011-approved-message">
                          Your enrollment has been approved.
                        </p>
                      )}

                      {enrollment.status === "rejected" && (
                        <div className="cr011-rejection-note">
                          <strong>Rejection reason:</strong>
                          <p>
                            {enrollment.decision_note ||
                              "No reason provided."}
                          </p>
                        </div>
                      )}

                      <div className="enrollment-card-actions">
                        <Link
                          to={`/courses/${enrollment.course_id}`}
                          className="btn btn-outline enrollment-view-btn"
                        >
                          View Course
                        </Link>

                        {enrollment.status === "pending" && (
                          <button
                            type="button"
                            className="btn btn-danger enrollment-cancel-btn"
                            onClick={() =>
                              handleCancelEnrollment(enrollment)
                            }
                            disabled={isCancelling}
                          >
                            <FaTimesCircle />

                            {isCancelling
                              ? "Cancelling..."
                              : "Cancel Request"}
                          </button>
                        )}

                        {enrollment.status === "rejected" && (
                          <Link
                            to={`/courses/${enrollment.course_id}`}
                            className="btn btn-primary"
                          >
                            Request Again
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

export default MyEnrollments;