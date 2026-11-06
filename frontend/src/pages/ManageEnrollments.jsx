import { useCallback, useEffect, useState } from "react";

import {
  FaTrash,
  FaCheck,
  FaTimes
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const INITIAL_FILTERS = {
  q: "",
  courseId: "",
  from: "",
  to: "",
  status: "",
  sort: "date",
  order: "desc",
  limit: "20"
};

function ManageEnrollments() {
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const [enrollments, setEnrollments] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Load courses.
  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        const response = await api.get("/courses");

        if (active) {
          setCourses(response.data.courses || []);
        }
      } catch (err) {
        console.error("Could not load courses:", err.message);
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  // Debounce search.
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = searchInput.trim();

      setFilters((previous) =>
        previous.q === value
          ? previous
          : { ...previous, q: value }
      );

      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = (name, value) => {
    setSuccess("");

    setFilters((previous) => ({
      ...previous,
      [name]: value
    }));

    setPage(1);
  };

  // Load enrollment records.
  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        ...filters,
        page
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === "") {
          delete params[key];
        }
      });

      params.limit = Number(filters.limit);

      const response = await api.get("/enrollments", {
        params
      });

      const records = response.data.enrollments || [];
      const meta = response.data.pagination;

      if (!meta) {
        throw new Error("Pagination metadata is missing.");
      }

      if (page > 1 && records.length === 0) {
        const lastValidPage = Math.max(
          1,
          Math.ceil(meta.total / Number(filters.limit))
        );

        setPage(Math.min(page - 1, lastValidPage));
        return;
      }

      setEnrollments(records);
      setPagination(meta);

    } catch (err) {
      setEnrollments([]);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load enrollments."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, reloadKey]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  // Approve request.
  const handleApprove = async (enrollment) => {
    const confirmed = window.confirm(
      `Approve ${enrollment.full_name}'s request for "${enrollment.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setProcessingId(enrollment.id);

    try {
      const response = await api.patch(
        `/enrollments/${enrollment.id}/status`,
        {
          status: "approved"
        }
      );

      setSuccess(
        response.data.message || "Enrollment approved successfully"
      );

      setReloadKey((previous) => previous + 1);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to approve enrollment"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Open rejection form.
  const openRejectForm = (enrollment) => {
    setRejectingId(enrollment.id);
    setRejectionReason("");
    setError("");
    setSuccess("");
  };

  // Reject request.
  const handleReject = async (enrollment) => {
    if (!rejectionReason.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    setError("");
    setSuccess("");
    setProcessingId(enrollment.id);

    try {
      const response = await api.patch(
        `/enrollments/${enrollment.id}/status`,
        {
          status: "rejected",
          reason: rejectionReason.trim()
        }
      );

      setSuccess(
        response.data.message || "Enrollment rejected successfully"
      );

      setRejectingId(null);
      setRejectionReason("");

      setReloadKey((previous) => previous + 1);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to reject enrollment"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Existing admin delete.
  const handleDelete = async (enrollment) => {
    const confirmed = window.confirm(
      `Permanently delete ${enrollment.full_name}'s record for "${enrollment.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await api.delete(
        `/enrollments/${enrollment.id}`
      );

      setSuccess(
        response.data.message || "Enrollment deleted successfully"
      );

      setReloadKey((previous) => previous + 1);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not delete the enrollment."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleString();
  };

  const getStatusClass = (status) => {
    if (status === "approved") return "cr011-status-approved";
    if (status === "rejected") return "cr011-status-rejected";

    return "cr011-status-pending";
  };

  const total = pagination.total;
  const totalPages = pagination.totalPages;

  const start =
    total === 0 ? 0 : (page - 1) * pagination.limit + 1;

  const end = Math.min(page * pagination.limit, total);

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="page-header">
          <div>
            <h1>Manage Enrollments</h1>

            <p className="page-subtitle">
              Review, approve, reject and manage student enrollment requests.
            </p>
          </div>
        </div>

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}

        {/* Filters */}
        <section className="section-card cr008-filters">
          <div className="cr008-filter-grid">
            <div className="form-group">
              <label htmlFor="enrollmentSearch">
                Search student
              </label>

              <input
                id="enrollmentSearch"
                className="input"
                type="search"
                placeholder="Name or username"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseFilter">Course</label>

              <select
                id="courseFilter"
                className="input"
                value={filters.courseId}
                onChange={(event) =>
                  updateFilter("courseId", event.target.value)
                }
              >
                <option value="">All courses</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="statusFilter">Status</label>

              <select
                id="statusFilter"
                className="input"
                value={filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value)
                }
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentFrom">From date</label>

              <input
                id="enrollmentFrom"
                className="input"
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(event) =>
                  updateFilter("from", event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentTo">To date</label>

              <input
                id="enrollmentTo"
                className="input"
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(event) =>
                  updateFilter("to", event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentSort">Sort by</label>

              <select
                id="enrollmentSort"
                className="input"
                value={filters.sort}
                onChange={(event) =>
                  updateFilter("sort", event.target.value)
                }
              >
                <option value="date">Enrollment date</option>
                <option value="student">Student name</option>
                <option value="course">Course name</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentOrder">Order</label>

              <select
                id="enrollmentOrder"
                className="input"
                value={filters.order}
                onChange={(event) =>
                  updateFilter("order", event.target.value)
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentLimit">Records per page</label>

              <select
                id="enrollmentLimit"
                className="input"
                value={filters.limit}
                onChange={(event) =>
                  updateFilter("limit", event.target.value)
                }
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setFilters(INITIAL_FILTERS);
              setSearchInput("");
              setPage(1);
            }}
          >
            Clear Filters
          </button>
        </section>

        {/* Enrollment table */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Enrollment Requests</h2>
            <span>{total} records</span>
          </div>

          {loading ? (
            <p className="loading">Loading enrollments...</p>
          ) : enrollments.length === 0 ? (
            <p className="empty">
              No enrollment records found.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Requested On</th>
                    <th>Status</th>
                    <th>Decision</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => {
                    const isProcessing =
                      processingId === enrollment.id;

                    return (
                      <tr key={enrollment.id}>
                        <td>{enrollment.full_name || "-"}</td>
                        <td>{enrollment.username || "-"}</td>
                        <td>{enrollment.title || "-"}</td>
                        <td>{enrollment.category || "-"}</td>
                        <td>{formatDate(enrollment.enrolled_at)}</td>

                        <td>
                          <span
                            className={`cr011-status ${getStatusClass(
                              enrollment.status
                            )}`}
                          >
                            {enrollment.status.toUpperCase()}
                          </span>
                        </td>

                        <td>
                          {enrollment.reviewed_at
                            ? formatDate(enrollment.reviewed_at)
                            : "-"}

                          {enrollment.decision_note && (
                            <p className="cr011-table-note">
                              {enrollment.decision_note}
                            </p>
                          )}
                        </td>

                        <td>
                          <div className="cr011-admin-actions">
                            {enrollment.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() =>
                                    handleApprove(enrollment)
                                  }
                                  disabled={isProcessing}
                                >
                                  <FaCheck />
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    openRejectForm(enrollment)
                                  }
                                  disabled={isProcessing}
                                >
                                  <FaTimes />
                                  Reject
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                handleDelete(enrollment)
                              }
                              disabled={isProcessing}
                              title="Delete enrollment"
                            >
                              <FaTrash />
                            </button>
                          </div>

                          {rejectingId === enrollment.id && (
                            <div className="cr011-reject-form">
                              <label
                                htmlFor={`reason-${enrollment.id}`}
                              >
                                Rejection reason
                              </label>

                              <textarea
                                id={`reason-${enrollment.id}`}
                                className="input"
                                rows="3"
                                maxLength="1000"
                                value={rejectionReason}
                                onChange={(event) =>
                                  setRejectionReason(event.target.value)
                                }
                                placeholder="Enter the reason for rejection"
                              />

                              <div className="cr011-reject-actions">
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    handleReject(enrollment)
                                  }
                                  disabled={
                                    isProcessing ||
                                    !rejectionReason.trim()
                                  }
                                >
                                  Confirm Rejection
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectionReason("");
                                    setError("");
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="pagination">
              <p>
                Showing {start}–{end} of {total}
              </p>

              <div className="pagination-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ManageEnrollments;