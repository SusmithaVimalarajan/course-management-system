import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaEye,
  FaGraduationCap,
  FaSearch,
  FaMoneyBillWave,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


/*
 * Safely convert a price into a number.
 *
 * Handles:
 * - number
 * - numeric string
 * - 0
 * - null / undefined
 * - invalid values
 *
 * Invalid values become 0 so NaN is never displayed.
 */
const toSafePrice = (value) => {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


/*
 * Format price for display.
 */
const formatPrice = (value) => {

  return toSafePrice(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

};


function StudentDashboard() {

  const [enrollments, setEnrollments] = useState([]);

  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const [
          enrollmentsResponse,
          statsResponse,
        ] = await Promise.all([

          api.get("/enrollments/my"),

          api.get("/courses/stats"),

        ]);


        setEnrollments(
          enrollmentsResponse.data.enrollments || []
        );


        setStats({

          courseCount:
            statsResponse.data.courseCount || 0,

          studentCount:
            statsResponse.data.studentCount || 0,

        });

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your dashboard"
        );

      } finally {

        setLoading(false);

      }

    };

    loadDashboard();

  }, []);


  /*
   * Calculate the total enrolled-course value
   * from the already-loaded enrollment response.
   *
   * No additional API request is required.
   */
  const totalEnrollmentValue = useMemo(() => {

    return enrollments.reduce((total, enrollment) => {

      return total + toSafePrice(enrollment.price);

    }, 0);

  }, [enrollments]);


  /*
   * Only show the 3 most recent enrollments on the dashboard.
   *
   * Copy the array before sorting so that the original
   * enrollment data is not modified.
   */
  const recentEnrollments = useMemo(() => {

    return [...enrollments]
      .sort((a, b) => {

        const aTime = new Date(a.enrolled_at).getTime();
        const bTime = new Date(b.enrolled_at).getTime();

        const aInvalid = Number.isNaN(aTime);
        const bInvalid = Number.isNaN(bTime);

        if (aInvalid && bInvalid) return 0;
        if (aInvalid) return 1;
        if (bInvalid) return -1;

        return bTime - aTime;

      })
      .slice(0, 3);

  }, [enrollments]);


  const formatDate = (value) => {

    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();

  };


  return (

    <>
      <Navbar />

      <div className="container">

        {/* ---------- Welcome ---------- */}

        <div className="page-header">

          <div>

            <h1>
              Student Dashboard
            </h1>

            <p className="page-subtitle">
              Welcome back,{" "}
              {user?.full_name || user?.username}!
            </p>

          </div>


          <Link
            to="/courses"
            className="btn btn-primary"
          >
            <FaSearch />
            Browse Courses
          </Link>

        </div>


        {/* ---------- Error ---------- */}

        {error && (
          <p className="error">
            {error}
          </p>
        )}


        {/* ---------- Stat cards ---------- */}

        <div className="dashboard-grid">

          <div className="dashboard-card">

            <span className="dashboard-card-value">
              {loading
                ? "..."
                : enrollments.length}
            </span>

            <span className="dashboard-card-label">
              My Enrolled Courses
            </span>

          </div>


          <div className="dashboard-card">

            <span className="dashboard-card-value">
              {loading
                ? "..."
                : stats.courseCount}
            </span>

            <span className="dashboard-card-label">
              Courses Available
            </span>

          </div>


          <div className="dashboard-card">

            <span className="dashboard-card-value">
              {loading
                ? "..."
                : stats.studentCount}
            </span>

            <span className="dashboard-card-label">
              Registered Students
            </span>

          </div>


          {/* ---------- CR-004 Total Enrollment Value ---------- */}

          <div className="dashboard-card">

            <span className="dashboard-card-icon">
              <FaMoneyBillWave />
            </span>

            <span className="dashboard-card-value dashboard-price-value">
              {loading
                ? "..."
                : `Rs. ${formatPrice(totalEnrollmentValue)}`}
            </span>

            <span className="dashboard-card-label">
              Total Enrollment Value
            </span>

          </div>

        </div>


        {/* ---------- Recent enrollments ---------- */}

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              My Recent Enrollments
            </h2>


            <Link
              to="/my-enrollments"
              className="link-inline"
            >
              <FaEye />
              {" "}View all
            </Link>

          </div>


          {loading && (
            <p className="loading">
              Loading...
            </p>
          )}


          {!loading &&
            recentEnrollments.length === 0 && (

              <p className="empty">
                You have not enrolled in any courses yet.
                Head over to the courses page and enroll
                in your first course.
              </p>

            )}


          {!loading &&
            recentEnrollments.length > 0 && (

              <div className="table-wrapper">

                <table className="table">

                  <thead>

                    <tr>

                      <th>
                        Course
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Level
                      </th>

                      <th>
                        Enrolled On
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {recentEnrollments.map(
                      (enrollment) => (

                        <tr
                          key={enrollment.id}
                        >

                          <td>

                            <Link
                              to={`/courses/${enrollment.course_id}`}
                            >
                              {enrollment.title}
                            </Link>

                          </td>


                          <td>
                            {enrollment.category}
                          </td>


                          <td>
                            {enrollment.level}
                          </td>


                          <td>
                            {formatDate(
                              enrollment.enrolled_at
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

        </section>


        {/* ---------- Quick actions ---------- */}

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              Quick Actions
            </h2>

          </div>


          <div className="quick-actions">

            <Link
              to="/courses"
              className="quick-action"
            >

              <span className="quick-action-icon">
                <FaBook />
              </span>

              <span>
                Browse all courses
              </span>

            </Link>


            <Link
              to="/my-enrollments"
              className="quick-action"
            >

              <span className="quick-action-icon">
                <FaGraduationCap />
              </span>

              <span>
                View my enrollments
              </span>

            </Link>

          </div>

        </section>

      </div>

      <Footer />

    </>
  );
}


export default StudentDashboard;