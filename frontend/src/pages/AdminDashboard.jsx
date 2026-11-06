import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaBook,
  FaChartBar,
  FaSearch,
  FaUsers
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMPTY_REPORT = {
  totalCourses: 0,
  totalStudents: 0,
  totalEnrollments: 0,
  pendingEnrollments: 0,
  rejectedEnrollments: 0,
  studentsWithEnrollments: 0,
  enrollmentsLast30Days: 0,
  coursesWithoutEnrollments: 0,
  enrollmentsByCategory: [],
  topCourses: [],
  recentEnrollments: []
};

function AdminDashboard() {
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const response = await api.get("/reports/overview");

        if (isMounted) {
          const data = response.data || {};

          setReport({
            ...EMPTY_REPORT,
            ...data,
            enrollmentsByCategory:
              Array.isArray(data.enrollmentsByCategory)
                ? data.enrollmentsByCategory
                : [],
            topCourses: Array.isArray(data.topCourses)
              ? data.topCourses
              : [],
            recentEnrollments:
              Array.isArray(data.recentEnrollments)
                ? data.recentEnrollments
                : []
          });

          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
            "Failed to load reporting data."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
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

  const categoryMaximum = Math.max(
    1,
    ...report.enrollmentsByCategory.map(
      (item) => Number(item.enrollmentCount) || 0
    )
  );

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>

            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}.
              {" "}Here is an overview of the system.
            </p>
          </div>

          <Link
            to="/admin/courses"
            className="btn btn-primary"
          >
            <FaChartBar />
            Manage Courses
          </Link>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Main statistics */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.totalCourses)}
            </span>
            <span className="dashboard-card-label">
              Total Courses
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.totalStudents)}
            </span>
            <span className="dashboard-card-label">
              Total Students
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.totalEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Approved Enrollments
            </span>
          </div>

          <div className="dashboard-card cr011-pending-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.pendingEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Pending Requests
            </span>

            <Link to="/admin/enrollments?status=pending">
              Review requests
            </Link>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : formatNumber(report.rejectedEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Rejected Requests
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading
                ? "..."
                : formatNumber(report.studentsWithEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Students with Approved Enrollments
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading
                ? "..."
                : formatNumber(report.enrollmentsLast30Days)}
            </span>
            <span className="dashboard-card-label">
              Approved Enrollments (Last 30 Days)
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading
                ? "..."
                : formatNumber(report.coursesWithoutEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Courses without Approved Enrollments
            </span>
          </div>
        </div>

        {/* Category report */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Approved Enrollments by Category</h2>
          </div>

          {loading ? (
            <p className="loading">Loading category report...</p>
          ) : report.enrollmentsByCategory.length === 0 ? (
            <p className="empty">No course categories are available.</p>
          ) : (
            <div className="cr009-category-list">
              {report.enrollmentsByCategory.map((item) => {
                const count = Number(item.enrollmentCount) || 0;
                const percentage =
                  (count / categoryMaximum) * 100;

                return (
                  <div
                    className="cr009-category-item"
                    key={item.category}
                  >
                    <div className="cr009-report-label">
                      <span>{item.category || "Uncategorized"}</span>
                      <strong>{formatNumber(count)}</strong>
                    </div>

                    <div
                      className="cr009-bar-track"
                      role="img"
                      aria-label={`${item.category}: ${count} approved enrollments`}
                    >
                      <div
                        className="cr009-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top courses */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Top Five Courses by Approved Enrollment</h2>
          </div>

          {loading ? (
            <p className="loading">Loading top courses...</p>
          ) : report.topCourses.length === 0 ? (
            <p className="empty">
              No approved course enrollments are available yet.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Approved Enrollments</th>
                  </tr>
                </thead>

                <tbody>
                  {report.topCourses.map((course, index) => (
                    <tr key={course.courseId}>
                      <td>{index + 1}</td>
                      <td>{course.title || "-"}</td>
                      <td>{course.category || "-"}</td>
                      <td>
                        {formatNumber(course.enrollmentCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent enrollment requests */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollment Requests</h2>

            <Link
              to="/admin/enrollments"
              className="link-inline"
            >
              Manage enrollments
            </Link>
          </div>

          {loading ? (
            <p className="loading">Loading recent requests...</p>
          ) : report.recentEnrollments.length === 0 ? (
            <p className="empty">
              No enrollment requests have been made yet.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Requested On</th>
                  </tr>
                </thead>

                <tbody>
                  {report.recentEnrollments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.full_name || "-"}</td>
                      <td>{item.username || "-"}</td>
                      <td>{item.title || "-"}</td>
                      <td>
                        <span
                          className={`cr011-status cr011-status-${item.status}`}
                        >
                          {item.status?.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatDate(item.enrolled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Administration shortcuts */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Administration</h2>
          </div>

          <div className="quick-actions">
            <Link
              to="/admin/courses"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaBook />
              </span>
              <span>Add, edit and delete courses</span>
            </Link>

            <Link
              to="/admin/enrollments?status=pending"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaUsers />
              </span>
              <span>Review pending enrollment requests</span>
            </Link>

            <Link to="/courses" className="quick-action">
              <span className="quick-action-icon">
                <FaSearch />
              </span>
              <span>See the public course list</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AdminDashboard;