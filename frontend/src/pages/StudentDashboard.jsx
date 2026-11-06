import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaBook,
  FaEye,
  FaGraduationCap,
  FaSearch
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMPTY_REPORT = {
  enrolledCourses: 0,
  pendingRequests: 0,
  rejectedRequests: 0,
  distinctCategories: 0,
  earliestEnrollmentDate: null,
  latestEnrollmentDate: null,
  recentEnrollments: []
};

function StudentDashboard() {
  const [report, setReport] = useState(EMPTY_REPORT);

  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");

  const user = getUser();

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const reportRequest = api.get("/reports/my");
      const statsRequest = api.get("/courses/stats");

      const [reportResult, statsResult] =
        await Promise.allSettled([
          reportRequest,
          statsRequest
        ]);

      if (!isMounted) return;

      // Student report.
      if (reportResult.status === "fulfilled") {
        const data = reportResult.value.data || {};

        setReport({
          ...EMPTY_REPORT,
          ...data,
          recentEnrollments: Array.isArray(
            data.recentEnrollments
          )
            ? data.recentEnrollments
            : []
        });

        setError("");
      } else {
        setError(
          reportResult.reason?.response?.data?.message ||
          "Failed to load your learning report."
        );
      }

      // Course statistics.
      if (statsResult.status === "fulfilled") {
        const data = statsResult.value.data || {};

        setStats({
          courseCount: Number(data.courseCount) || 0,
          studentCount: Number(data.studentCount) || 0
        });

        setStatsError("");
      } else {
        setStatsError(
          statsResult.reason?.response?.data?.message ||
          "Course statistics are temporarily unavailable."
        );
      }

      setLoading(false);
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString()
      : "0";
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString();
  };

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="page-header">
          <div>
            <h1>Student Dashboard</h1>

            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}.
              {" "}Here is your learning overview.
            </p>
          </div>

          <Link to="/courses" className="btn btn-primary">
            <FaSearch />
            Browse Courses
          </Link>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Enrollment summary cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.enrolledCourses)}
            </span>

            <span className="dashboard-card-label">
              Approved Courses
            </span>
          </div>

          <div className="dashboard-card cr011-pending-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.pendingRequests)}
            </span>

            <span className="dashboard-card-label">
              Pending Requests
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.rejectedRequests)}
            </span>

            <span className="dashboard-card-label">
              Rejected Requests
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading
                ? "..."
                : formatNumber(report.distinctCategories)}
            </span>

            <span className="dashboard-card-label">
              Categories Explored
            </span>
          </div>
        </div>

        {/* General course statistics */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {statsError
                ? "-"
                : formatNumber(stats.courseCount)}
            </span>

            <span className="dashboard-card-label">
              Available Courses
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {statsError
                ? "-"
                : formatNumber(stats.studentCount)}
            </span>

            <span className="dashboard-card-label">
              Registered Students
            </span>
          </div>
        </div>

        {statsError && (
          <p className="error">{statsError}</p>
        )}

        {/* Enrollment date summary */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>My Approved Enrollment Summary</h2>
          </div>

          {loading ? (
            <p className="loading">
              Loading your enrollment summary...
            </p>
          ) : (
            <div className="cr009-student-summary">
              <div className="cr009-summary-item">
                <span>First Enrollment</span>
                <strong>
                  {formatDate(report.earliestEnrollmentDate)}
                </strong>
              </div>

              <div className="cr009-summary-item">
                <span>Latest Enrollment</span>
                <strong>
                  {formatDate(report.latestEnrollmentDate)}
                </strong>
              </div>
            </div>
          )}

          {!loading && report.enrolledCourses === 0 && (
            <p className="empty">
              You do not have any approved courses yet.
              Your pending requests will appear below.
            </p>
          )}
        </section>

        {/* Recent requests */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>My Recent Enrollment Requests</h2>

            <Link
              to="/my-enrollments"
              className="link-inline"
            >
              <FaEye /> View all
            </Link>
          </div>

          {loading ? (
            <p className="loading">
              Loading your recent requests...
            </p>
          ) : report.recentEnrollments.length === 0 ? (
            <p className="empty">
              No enrollment requests to display.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Price</th>
                    <th>Requested On</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {report.recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>
                        <Link
                          to={`/courses/${enrollment.courseId}`}
                        >
                          {enrollment.title || "-"}
                        </Link>
                      </td>

                      <td>{enrollment.category || "-"}</td>
                      <td>{enrollment.level || "-"}</td>

                      <td>
                        Rs. {formatPrice(enrollment.price)}
                      </td>

                      <td>
                        {formatDate(enrollment.enrolledAt)}
                      </td>

                      <td>
                        <span
                          className={`cr011-status cr011-status-${enrollment.status}`}
                        >
                          {enrollment.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>My Learning</h2>
          </div>

          <div className="quick-actions">
            <Link
              to="/my-enrollments"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaGraduationCap />
              </span>

              <span>View enrollment requests and decisions</span>
            </Link>

            <Link
              to="/courses"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaBook />
              </span>

              <span>Browse available courses</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default StudentDashboard;