import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaEye,
  FaGraduationCap,
  FaSearch,
  FaMoneyBillWave,
  FaSortAmountDown,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function StudentDashboard() {

  const [enrollments, setEnrollments] = useState([]);

  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


  // ---------- Load dashboard data ----------
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


  // ---------- Recent enrollments ----------
  const recentEnrollments =
    enrollments.slice(0, 3);


  // ---------- Total enrollment value ----------
  const totalEnrollmentValue =
    enrollments.reduce(
      (total, enrollment) => {

        return total + Number(
          enrollment.price || 0
        );

      },
      0
    );


  // ---------- Average enrollment price ----------
  const averageEnrollmentPrice =
    enrollments.length > 0
      ? totalEnrollmentValue / enrollments.length
      : 0;


  // ---------- Format price ----------
  const formatPrice = (value) => {

    return Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

  };


  // ---------- Format date ----------
  const formatDate = (value) => {

    if (!value) return "-";

    return new Date(value).toLocaleDateString();

  };


  return (

    <>
      <Navbar />

      <main className="container">


        {/* ---------- Welcome ---------- */}

        <div className="page-header">

          <div>

            <h1>
              Student Dashboard
            </h1>

            <p className="page-subtitle">

              Welcome back,{" "}
              {user?.full_name ||
                user?.username}!

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


        {/* ---------- Main Statistics ---------- */}

        <div className="dashboard-grid">


          {/* My Enrolled Courses */}

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


          {/* Courses Available */}

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


          {/* Registered Students */}

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


        </div>


        {/* ---------- Enrollment Financial Summary ---------- */}

        {!loading &&
          enrollments.length > 0 && (

            <div className="dashboard-enrollment-summary">


              {/* Total Value */}

              <div className="dashboard-summary-card">

                <div className="dashboard-summary-icon">
                  <FaMoneyBillWave />
                </div>

                <div>

                  <strong>
                    Rs.{" "}
                    {formatPrice(
                      totalEnrollmentValue
                    )}
                  </strong>

                  <span>
                    Total Course Value
                  </span>

                </div>

              </div>


              {/* Average Price */}

              <div className="dashboard-summary-card">

                <div className="dashboard-summary-icon">
                  <FaSortAmountDown />
                </div>

                <div>

                  <strong>
                    Rs.{" "}
                    {formatPrice(
                      averageEnrollmentPrice
                    )}
                  </strong>

                  <span>
                    Average Course Price
                  </span>

                </div>

              </div>


            </div>

          )}


        {/* ---------- Recent Enrollments ---------- */}

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

                You have not enrolled in any
                courses yet. Head over to the
                courses page and enroll in your
                first course.

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
                        Price
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

                            Rs.{" "}
                            {formatPrice(
                              enrollment.price
                            )}

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


        {/* ---------- Quick Actions ---------- */}

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


      </main>

      <Footer />

    </>
  );
}

export default StudentDashboard;