import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt,
  FaCheckCircle,
} from "react-icons/fa";

import api from "../services/api";

import {
  isLoggedIn,
  isStudent,
  isAdmin,
} from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function CourseDetails() {

  const { id } =
    useParams();

  const location =
    useLocation();


  const [course, setCourse] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [enrolling, setEnrolling] =
    useState(false);

  const [isEnrolled, setIsEnrolled] =
    useState(false);


  const loggedIn =
    isLoggedIn();

  const studentLoggedIn =
    isStudent();

  const adminLoggedIn =
    isAdmin();


  // ===================================================
  // Load course + current enrollment state
  // ===================================================

  useEffect(() => {

    const getCourseData =
      async () => {

        try {

          setLoading(true);
          setError("");


          // Get course with capacity data
          const response =
            await api.get(
              `/courses/${id}`
            );


          setCourse(
            response.data.course
          );


          // Check current student enrollment
          if (studentLoggedIn) {

            const enrollmentResponse =
              await api.get(
                "/enrollments/my"
              );


            const studentEnrollments =
              enrollmentResponse.data.enrollments || [];


            const enrolled =
              studentEnrollments.some(
                (enrollment) =>
                  String(
                    enrollment.course_id
                  ) === String(id)
              );


            setIsEnrolled(
              enrolled
            );

          } else {

            setIsEnrolled(false);

          }

        } catch (error) {

          setError(
            error.response?.data?.message ||
            "Failed to load course"
          );

        } finally {

          setLoading(false);

        }
      };


    getCourseData();

  }, [id, studentLoggedIn]);


  // ===================================================
  // Enroll
  // ===================================================

  const handleEnroll =
    async () => {

      setError("");
      setSuccess("");
      setEnrolling(true);


      try {

        const response =
          await api.post(
            "/enrollments",
            {
              courseId: id,
            }
          );


        setSuccess(
          response.data.message ||
          "Course enrollment successful"
        );


        setIsEnrolled(true);


        // Refresh the course availability
        const refreshedCourse =
          await api.get(
            `/courses/${id}`
          );


        setCourse(
          refreshedCourse.data.course
        );

      } catch (error) {

        const responseData =
          error.response?.data;


        // Full course
        if (
          error.response?.status === 409 &&
          responseData?.code === "COURSE_FULL"
        ) {

          setCourse((currentCourse) => {

            if (!currentCourse) {
              return currentCourse;
            }

            return {
              ...currentCourse,
              is_full: true,
              seats_remaining: 0,
            };
          });


          setError(
            responseData.message ||
            "Course is full. No seats are currently available."
          );

        }

        // Already enrolled
        else if (
          error.response?.status === 409 &&
          responseData?.code === "ALREADY_ENROLLED"
        ) {

          setIsEnrolled(true);

          setError(
            responseData.message ||
            "You are already enrolled in this course."
          );

        }

        else {

          setError(
            responseData?.message ||
            "Enrollment failed. Please try again."
          );

        }

      } finally {

        setEnrolling(false);

      }
    };


  // ===================================================
  // Loading
  // ===================================================

  if (loading) {

    return (
      <>
        <Navbar />

        <div className="container">

          <p className="loading">
            Loading course...
          </p>

        </div>

        <Footer />
      </>
    );
  }


  // ===================================================
  // Course not found
  // ===================================================

  if (error && !course) {

    return (
      <>
        <Navbar />

        <div className="container">

          <p className="error">
            {error}
          </p>

          <div className="center-actions">

            <Link
              to="/courses"
              className="btn btn-primary"
            >
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


  const availabilityClass =
    isUnlimited
      ? "details-availability-unlimited"
      : course.is_full
        ? "details-availability-full"
        : "details-availability-available";


  return (
    <>
      <Navbar />


      <div className="container">


        {/* Breadcrumb */}

        <p className="breadcrumb">

          <Link to="/courses">
            Courses
          </Link>

          <span> / </span>

          <span>
            {course.title}
          </span>

        </p>


        <div className="details-layout">


          {/* =================================================
              Left: image
              ================================================= */}

          <div className="details-image-wrapper">

            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />

          </div>


          {/* =================================================
              Right: information
              ================================================= */}

          <div className="details-info">


            <div className="course-card-tags">

              <span className="tag tag-category">
                {course.category}
              </span>

              <span className="tag tag-level">
                {course.level}
              </span>

            </div>


            <h1>
              {course.title}
            </h1>


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


            {/* =================================================
                Availability
                ================================================= */}

            <div
              className={`details-availability ${availabilityClass}`}
            >

              {isUnlimited ? (

                <>
                  <strong>
                    Availability
                  </strong>

                  <span>
                    Unlimited
                  </span>
                </>

              ) : course.is_full ? (

                <>
                  <strong>
                    Course Full
                  </strong>

                  <span>
                    {course.enrolled_count || 0}
                    {" / "}
                    {course.max_students}
                    {" students"}
                  </span>
                </>

              ) : (

                <>
                  <strong>
                    Availability
                  </strong>

                  <span>
                    {course.enrolled_count || 0}
                    {" / "}
                    {course.max_students}
                    {" students"}
                  </span>
                </>

              )}

            </div>


            {/* =================================================
                Messages
                ================================================= */}

            {success && (
              <p className="success">
                {success}
              </p>
            )}


            {error && (
              <p className="error">
                {error}
              </p>
            )}


            {/* =================================================
                Action area
                ================================================= */}

            <div className="details-actions">


              {/* Not logged in */}

              {!loggedIn && (

                <div className="notice">

                  <p>
                    Please login as a student
                    to enroll in this course.
                  </p>


                  <Link
                    to="/login"
                    state={{
                      from:
                        location.pathname +
                        location.search +
                        location.hash,
                    }}
                    className="btn btn-primary"
                  >

                    <FaSignInAlt />
                    Login to Enroll

                  </Link>

                </div>
              )}


              {/* Logged in student */}

              {studentLoggedIn && (

                <>

                  {/* Already enrolled */}

                  {isEnrolled ? (

                    <>

                      <div className="success enrollment-state-message">

                        <FaCheckCircle />

                        <span>
                          You are currently enrolled
                          in this course.
                        </span>

                      </div>


                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >

                        <FaGraduationCap />
                        My Enrollments

                      </Link>

                    </>

                  ) : course.is_full ? (

                    /* Full course */

                    <>

                      <div className="error enrollment-state-message">

                        <span>
                          Course Full.
                          No seats are currently available.
                        </span>

                      </div>


                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        disabled
                      >

                        <FaShoppingCart />
                        Course Full

                      </button>


                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >

                        <FaGraduationCap />
                        My Enrollments

                      </Link>

                    </>

                  ) : (

                    /* Available / Unlimited course */

                    <>

                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >

                        <FaShoppingCart />

                        {enrolling
                          ? "Enrolling..."
                          : "Enroll Now"}

                      </button>


                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >

                        <FaGraduationCap />
                        My Enrollments

                      </Link>

                    </>

                  )}

                </>
              )}


              {/* Logged in admin */}

              {adminLoggedIn && (

                <div className="notice">

                  <p>
                    You are logged in as an administrator.
                    Only students can enroll in courses.
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