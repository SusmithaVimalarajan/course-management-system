// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   FaEdit,
//   FaEye,
//   FaPlus,
//   FaSave,
//   FaTimes,
//   FaTrash,
// } from "react-icons/fa";

// import api from "../services/api";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";


// const EMPTY_COURSE = {
//   title: "",
//   category: "",
//   level: "Beginner",
//   duration: "",
//   price: "",
//   image: "",
//   description: "",
// };

// const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"];


// // Load the course list.
// async function fetchAllCourses() {
//   const response = await api.get("/courses");

//   return response.data.courses;
// }


// function ManageCourses() {

//   const [courses, setCourses] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // Form visibility + which course is being edited
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   const [formData, setFormData] = useState(EMPTY_COURSE);

//   // General form error
//   const [formError, setFormError] = useState("");

//   // Field-level server validation errors
//   const [fieldErrors, setFieldErrors] = useState({});

//   const [saving, setSaving] = useState(false);


//   // ---------- Load the course list once, when the page opens ----------
//   useEffect(() => {

//     const loadCourses = async () => {

//       try {

//         setCourses(await fetchAllCourses());

//       } catch (error) {

//         setError(
//           error.response?.data?.message ||
//           "Failed to load courses"
//         );

//       } finally {

//         setLoading(false);

//       }
//     };

//     loadCourses();

//   }, []);


//   // ---------- Reload the list after create / update / delete ----------
//   const refreshCourses = async () => {
//     setCourses(await fetchAllCourses());
//   };


//   // ---------- Form helpers ----------

//   const handleChange = (event) => {

//     const { name, value } = event.target;

//     setFormData({
//       ...formData,
//       [name]: value,
//     });

//     // Remove the server error for the field
//     // when the user starts correcting it.
//     setFieldErrors((previous) => ({
//       ...previous,
//       [name]: "",
//     }));

//     setFormError("");
//   };


//   // ---------- Open Add Form ----------

//   const openAddForm = () => {

//     setShowForm(true);
//     setEditingId(null);

//     setFormData({
//       ...EMPTY_COURSE,
//     });

//     setFormError("");
//     setFieldErrors({});
//     setError("");
//     setSuccess("");
//   };


//   // ---------- Open Edit Form ----------

//   const openEditForm = (course) => {

//     setShowForm(true);
//     setEditingId(course.id);

//     // Fill the form with existing course values.
//     setFormData({
//       title: course.title || "",
//       category: course.category || "",
//       level: course.level || "Beginner",
//       duration: course.duration || "",
//       price: String(course.price ?? ""),
//       image: course.image || "",
//       description: course.description || "",
//     });

//     setFormError("");
//     setFieldErrors({});
//     setError("");
//     setSuccess("");
//   };


//   // ---------- Close Form ----------

//   const closeForm = () => {

//     setShowForm(false);
//     setEditingId(null);

//     setFormData({
//       ...EMPTY_COURSE,
//     });

//     setFormError("");
//     setFieldErrors({});
//   };


//   // ---------- Create / Update ----------

//   const handleSubmit = async (event) => {

//     // Stop browser from reloading the page.
//     event.preventDefault();

//     setFormError("");
//     setError("");
//     setSuccess("");
//     setFieldErrors({});


//     // ---------- Client-side validation ----------
//     // This is only an additional user-friendly check.
//     // Backend validation remains the final protection.

//     if (
//       !formData.title.trim() ||
//       !formData.category.trim() ||
//       !formData.level
//     ) {

//       setFormError(
//         "Title, category and level are required."
//       );

//       return;
//     }


//     if (!formData.duration.trim()) {

//       setFormError(
//         "Duration is required (for example: 8 Weeks)."
//       );

//       return;
//     }


//     if (
//       formData.price === "" ||
//       Number(formData.price) < 0
//     ) {

//       setFormError(
//         "Please enter a valid price."
//       );

//       return;
//     }


//     // The backend expects price to be a number.
//     const coursePayload = {

//       title: formData.title.trim(),

//       category: formData.category.trim(),

//       level: formData.level,

//       duration: formData.duration.trim(),

//       price: Number(formData.price),

//       image: formData.image.trim(),

//       description: formData.description.trim(),
//     };


//     setSaving(true);


//     try {

//       if (editingId) {

//         // ---------- Update existing course ----------

//         const response = await api.put(
//           `/courses/${editingId}`,
//           coursePayload
//         );

//         setSuccess(
//           response.data.message
//         );

//       } else {

//         // ---------- Create new course ----------

//         const response = await api.post(
//           "/courses",
//           coursePayload
//         );

//         setSuccess(
//           response.data.message
//         );
//       }


//       // Close form after successful save.
//       closeForm();

//       // Show fresh data from backend.
//       await refreshCourses();

//     } catch (error) {

//       // ---------- SERVER-SIDE VALIDATION ERROR ----------

//       const responseData =
//         error.response?.data;


//       // Backend field-level errors.
//       //
//       // Example:
//       // {
//       //   errors: {
//       //     title: "Course title already exists.",
//       //     price: "Price must be greater than or equal to 0."
//       //   }
//       // }

//       if (responseData?.errors) {

//         setFieldErrors(
//           responseData.errors
//         );
//       }


//       // General backend error message.
//       setFormError(
//         responseData?.message ||
//         "Could not save the course. Please try again."
//       );

//     } finally {

//       setSaving(false);
//     }
//   };


//   // ---------- Delete ----------

//   const handleDelete = async (course) => {

//     // Always confirm before destructive action.
//     const confirmed = window.confirm(
//       `Delete "${course.title}"? This cannot be undone.`
//     );


//     if (!confirmed) {
//       return;
//     }


//     setError("");
//     setSuccess("");


//     try {

//       const response = await api.delete(
//         `/courses/${course.id}`
//       );

//       setSuccess(
//         response.data.message
//       );

//       await refreshCourses();

//     } catch (error) {

//       setError(
//         error.response?.data?.message ||
//         "Could not delete the course."
//       );
//     }
//   };


//   return (

//     <>

//       <Navbar />


//       <div className="container">


//         {/* ---------- Page Header ---------- */}

//         <div className="page-header">

//           <div>

//             <h1>
//               Manage Courses
//             </h1>

//             <p className="page-subtitle">
//               Add new courses, update the existing ones,
//               or remove courses that are no longer offered.
//             </p>

//           </div>


//           <button
//             type="button"
//             className="btn btn-primary"
//             onClick={
//               showForm
//                 ? closeForm
//                 : openAddForm
//             }
//           >

//             {showForm
//               ? <FaTimes />
//               : <FaPlus />
//             }

//             {showForm
//               ? "Cancel"
//               : "Add Course"
//             }

//           </button>

//         </div>


//         {/* ---------- Success / General Error Messages ---------- */}

//         {success && (
//           <p className="success">
//             {success}
//           </p>
//         )}

//         {error && (
//           <p className="error">
//             {error}
//           </p>
//         )}


//         {/* ---------- Add / Edit Form ---------- */}

//         {showForm && (

//           <section className="section-card">


//             <div className="section-card-header">

//               <h2>
//                 {editingId
//                   ? "Edit Course"
//                   : "New Course"
//                 }
//               </h2>

//             </div>


//             <form
//               className="form"
//               onSubmit={handleSubmit}
//             >


//               {/* ---------- Title + Category ---------- */}

//               <div className="form-row">


//                 <div className="form-group">

//                   <label htmlFor="title">
//                     Title *
//                   </label>


//                   <input
//                     id="title"
//                     className={
//                       fieldErrors.title
//                         ? "input input-error"
//                         : "input"
//                     }
//                     type="text"
//                     name="title"
//                     value={formData.title}
//                     onChange={handleChange}
//                     placeholder="e.g. React"
//                   />


//                   {fieldErrors.title && (

//                     <p className="field-error">
//                       {fieldErrors.title}
//                     </p>

//                   )}

//                 </div>


//                 <div className="form-group">

//                   <label htmlFor="category">
//                     Category *
//                   </label>


//                   <input
//                     id="category"
//                     className={
//                       fieldErrors.category
//                         ? "input input-error"
//                         : "input"
//                     }
//                     type="text"
//                     name="category"
//                     value={formData.category}
//                     onChange={handleChange}
//                     placeholder="e.g. Frontend"
//                   />


//                   {fieldErrors.category && (

//                     <p className="field-error">
//                       {fieldErrors.category}
//                     </p>

//                   )}

//                 </div>

//               </div>


//               {/* ---------- Level + Duration + Price ---------- */}

//               <div className="form-row">


//                 <div className="form-group">

//                   <label htmlFor="level">
//                     Level *
//                   </label>


//                   <select
//                     id="level"
//                     className={
//                       fieldErrors.level
//                         ? "input input-error"
//                         : "input"
//                     }
//                     name="level"
//                     value={formData.level}
//                     onChange={handleChange}
//                   >

//                     {LEVEL_OPTIONS.map(
//                       (level) => (

//                         <option
//                           key={level}
//                           value={level}
//                         >
//                           {level}
//                         </option>

//                       )
//                     )}

//                   </select>


//                   {fieldErrors.level && (

//                     <p className="field-error">
//                       {fieldErrors.level}
//                     </p>

//                   )}

//                 </div>


//                 <div className="form-group">

//                   <label htmlFor="duration">
//                     Duration *
//                   </label>


//                   <input
//                     id="duration"
//                     className={
//                       fieldErrors.duration
//                         ? "input input-error"
//                         : "input"
//                     }
//                     type="text"
//                     name="duration"
//                     value={formData.duration}
//                     onChange={handleChange}
//                     placeholder="e.g. 10 Weeks"
//                   />


//                   {fieldErrors.duration && (

//                     <p className="field-error">
//                       {fieldErrors.duration}
//                     </p>

//                   )}

//                 </div>


//                 <div className="form-group">

//                   <label htmlFor="price">
//                     Price (Rs.) *
//                   </label>


//                   <input
//                     id="price"
//                     className={
//                       fieldErrors.price
//                         ? "input input-error"
//                         : "input"
//                     }
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     name="price"
//                     value={formData.price}
//                     onChange={handleChange}
//                     placeholder="e.g. 25000"
//                   />


//                   {fieldErrors.price && (

//                     <p className="field-error">
//                       {fieldErrors.price}
//                     </p>

//                   )}

//                 </div>

//               </div>


//               {/* ---------- Image ---------- */}

//               <div className="form-group">

//                 <label htmlFor="image">
//                   Image URL
//                 </label>


//                 <input
//                   id="image"
//                   className={
//                     fieldErrors.image
//                       ? "input input-error"
//                       : "input"
//                   }
//                   type="text"
//                   name="image"
//                   value={formData.image}
//                   onChange={handleChange}
//                   placeholder="https://placehold.co/300x180?text=React"
//                 />


//                 {fieldErrors.image && (

//                   <p className="field-error">
//                     {fieldErrors.image}
//                   </p>

//                 )}

//               </div>


//               {/* ---------- Description ---------- */}

//               <div className="form-group">

//                 <label htmlFor="description">
//                   Description
//                 </label>


//                 <textarea
//                   id="description"
//                   className={
//                     fieldErrors.description
//                       ? "input input-error"
//                       : "input"
//                   }
//                   rows="4"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   placeholder="Short summary of what students will learn."
//                 />


//                 {fieldErrors.description && (

//                   <p className="field-error">
//                     {fieldErrors.description}
//                   </p>

//                 )}

//               </div>


//               {/* ---------- General Form Error ---------- */}

//               {formError && (

//                 <p className="error">
//                   {formError}
//                 </p>

//               )}


//               {/* ---------- Form Actions ---------- */}

//               <div className="form-actions">


//                 <button
//                   type="submit"
//                   className="btn btn-primary"
//                   disabled={saving}>

//                   <FaSave />

//                   {saving
//                     ? "Saving..."
//                     : editingId
//                       ? "Update Course"
//                       : "Create Course"
//                   }

//                 </button>


//                 <button
//                   type="button"
//                   className="btn btn-outline"
//                   onClick={closeForm}
//                   disabled={saving}
//                 >

//                   <FaTimes />

//                   Cancel

//                 </button>


//               </div>


//             </form>

//           </section>

//         )}


//         {/* ---------- Course Table ---------- */}

//         <section className="section-card">


//           <div className="section-card-header">

//             <h2>
//               All Courses
//               {courses.length > 0
//                 ? ` (${courses.length})`
//                 : ""
//               }
//             </h2>


//             <Link
//               to="/admin/enrollments"
//               className="link-inline"
//             >

//               <FaEye />

//               Manage enrollments

//             </Link>

//           </div>


//           {loading && (

//             <p className="loading">
//               Loading courses...
//             </p>

//           )}


//           {!loading &&
//             courses.length === 0 && (

//               <p className="empty">
//                 No courses yet.
//                 Click "Add Course" to create
//                 the first one.
//               </p>

//             )
//           }


//           {!loading &&
//             courses.length > 0 && (

//               <div className="table-wrapper">


//                 <table className="table">


//                   <thead>

//                     <tr>

//                       <th>ID</th>
//                       <th>Image</th>
//                       <th>Title</th>
//                       <th>Category</th>
//                       <th>Level</th>
//                       <th>Duration</th>
//                       <th>Price</th>
//                       <th className="table-actions-column">
//                         Actions
//                       </th>

//                     </tr>

//                   </thead>


//                   <tbody>

//                     {courses.map(
//                       (course) => (

//                         <tr
//                           key={course.id}
//                         >

//                           <td>
//                             {course.id}
//                           </td>


//                           <td>

//                             <img
//                               src={course.image}
//                               alt={course.title}
//                               className="table-thumb"
//                             />

//                           </td>


//                           <td>
//                             {course.title}
//                           </td>


//                           <td>
//                             {course.category}
//                           </td>


//                           <td>

//                             <span className="tag tag-level">
//                               {course.level}
//                             </span>

//                           </td>


//                           <td>
//                             {course.duration}
//                           </td>


//                           <td>
//                             Rs. {course.price}
//                           </td>


//                           <td>

//                             <div className="table-actions">


//                               <button
//                                 type="button"
//                                 className="btn btn-small btn-outline"
//                                 onClick={() =>
//                                   openEditForm(course)
//                                 }
//                               >

//                                 <FaEdit />

//                                 Edit

//                               </button>


//                               <button
//                                 type="button"
//                                 className="btn btn-small btn-danger"
//                                 onClick={() =>
//                                   handleDelete(course)
//                                 }
//                               >

//                                 <FaTrash />

//                                 Delete

//                               </button>


//                             </div>

//                           </td>

//                         </tr>

//                       )
//                     )}

//                   </tbody>

//                 </table>

//               </div>

//             )
//           }

//         </section>


//       </div>


//       <Footer />

//     </>
//   );
// }


// export default ManageCourses;





import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndo,
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


const EMPTY_COURSE = {
  title: "",
  category: "",
  level: "Beginner",
  duration: "",
  price: "",
  image: "",
  description: "",
};

const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];


// Load the course list.
async function fetchAllCourses() {
  const response = await api.get("/courses");

  return response.data.courses;
}


function ManageCourses() {

  // =========================================================
  // COURSE DATA
  // =========================================================

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // =========================================================
  // ADD / EDIT FORM STATE
  // =========================================================

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(
    EMPTY_COURSE
  );

  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [saving, setSaving] = useState(false);


  // =========================================================
  // CR-003
  // SEARCH / FILTER / SORT STATE
  // =========================================================

  // Search by:
  // - Course ID
  // - Course title
  // - Course category
  const [searchTerm, setSearchTerm] = useState("");


  // Category filter
  const [categoryFilter, setCategoryFilter] = useState("");


  // Level filter
  const [levelFilter, setLevelFilter] = useState("");


  // Sorting
  //
  // Default sorting:
  // ID ascending
  //
  // sortField can be:
  // id, title, category, level, duration, price
  const [sortField, setSortField] = useState("id");

  const [sortDirection, setSortDirection] = useState("asc");


  // =========================================================
  // LOAD COURSES
  // =========================================================

  useEffect(() => {

    const loadCourses = async () => {

      try {

        const loadedCourses =
          await fetchAllCourses();

        setCourses(loadedCourses);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }
    };

    loadCourses();

  }, []);


  // =========================================================
  // RELOAD COURSE LIST
  // =========================================================

  const refreshCourses = async () => {

    const loadedCourses =
      await fetchAllCourses();

    setCourses(loadedCourses);
  };


  // =========================================================
  // CR-003
  // CATEGORY OPTIONS
  //
  // Get unique categories from all courses.
  // =========================================================

  const categoryOptions = useMemo(() => {

    const categories = courses
      .map((course) =>
        String(course.category || "").trim()
      )
      .filter(Boolean);

    return [...new Set(categories)].sort(
      (a, b) =>
        a.localeCompare(
          b,
          undefined,
          { sensitivity: "base" }
        )
    );

  }, [courses]);


  // =========================================================
  // CR-003
  // FILTER + SEARCH + SORT
  //
  // All three work together.
  // =========================================================

  const displayedCourses = useMemo(() => {

    const search = searchTerm
      .trim()
      .toLowerCase();


    // -------------------------------------------------------
    // STEP 1: SEARCH + FILTER
    // -------------------------------------------------------

    const filtered = courses.filter((course) => {

      // Search by ID, title or category.
      const matchesSearch =
        !search ||
        String(course.id ?? "")
          .toLowerCase()
          .includes(search) ||
        String(course.title ?? "")
          .toLowerCase()
          .includes(search) ||
        String(course.category ?? "")
          .toLowerCase()
          .includes(search);


      // Category filter.
      const matchesCategory =
        !categoryFilter ||
        String(course.category ?? "")
          .toLowerCase() ===
          categoryFilter.toLowerCase();


      // Level filter.
      const matchesLevel =
        !levelFilter ||
        String(course.level ?? "")
          .toLowerCase() ===
          levelFilter.toLowerCase();


      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel
      );

    });


    // -------------------------------------------------------
    // STEP 2: SORT
    // -------------------------------------------------------

    const sorted = [...filtered].sort(
      (a, b) => {

        let comparison = 0;


        // Numeric sorting
        // Important for ID and Price.
        if (
          sortField === "id" ||
          sortField === "price"
        ) {

          const valueA =
            Number(a[sortField]) || 0;

          const valueB =
            Number(b[sortField]) || 0;

          comparison = valueA - valueB;

        }

        // Text sorting
        else {

          const valueA = String(
            a[sortField] ?? ""
          ).trim();

          const valueB = String(
            b[sortField] ?? ""
          ).trim();


          // localeCompare with sensitivity "base"
          // gives case-insensitive sorting.
          comparison =
            valueA.localeCompare(
              valueB,
              undefined,
              {
                sensitivity: "base",
                numeric: true,
              }
            );
        }


        return sortDirection === "asc"
          ? comparison
          : -comparison;

      }
    );


    return sorted;

  }, [
    courses,
    searchTerm,
    categoryFilter,
    levelFilter,
    sortField,
    sortDirection,
  ]);


  // =========================================================
  // CR-003
  // HANDLE SORT
  // =========================================================

  const handleSort = (field) => {

    // If clicking the same column:
    // ASC -> DESC
    // DESC -> ASC
    if (sortField === field) {

      setSortDirection(
        (previous) =>
          previous === "asc"
            ? "desc"
            : "asc"
      );

      return;
    }


    // If clicking a new column:
    // start with ascending order.
    setSortField(field);
    setSortDirection("asc");
  };


  // =========================================================
  // CR-003
  // SORT ICON
  // =========================================================

  const renderSortIcon = (field) => {

    // Column is not currently sorted.
    if (sortField !== field) {

      return <FaSort className="sort-icon" />;
    }


    if (sortDirection === "asc") {

      return (
        <FaSortUp className="sort-icon active" />
      );
    }


    return (
      <FaSortDown className="sort-icon active" />
    );
  };


  // =========================================================
  // CR-003
  // RESET SEARCH / FILTER / SORT
  // =========================================================

  const resetFilters = () => {

    setSearchTerm("");
    setCategoryFilter("");
    setLevelFilter("");

    // Reset sorting to ID ascending.
    setSortField("id");
    setSortDirection("asc");
  };


  // =========================================================
  // FORM HELPERS
  // =========================================================

  const handleChange = (event) => {

    const { name, value } = event.target;


    setFormData({
      ...formData,
      [name]: value,
    });


    // Remove server error for this field.
    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));


    setFormError("");
  };


  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  const openAddForm = () => {

    setShowForm(true);
    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFormError("");
    setFieldErrors({});

    setError("");
    setSuccess("");
  };


  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const openEditForm = (course) => {

    setShowForm(true);
    setEditingId(course.id);


    setFormData({

      title: course.title || "",

      category: course.category || "",

      level:
        course.level || "Beginner",

      duration:
        course.duration || "",

      price:
        String(course.price ?? ""),

      image:
        course.image || "",

      description:
        course.description || "",
    });


    setFormError("");
    setFieldErrors({});

    setError("");
    setSuccess("");
  };


  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {

    setShowForm(false);
    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFormError("");
    setFieldErrors({});
  };


  // =========================================================
  // CREATE / UPDATE COURSE
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setFormError("");
    setError("");
    setSuccess("");
    setFieldErrors({});


    // -------------------------------------------------------
    // CLIENT-SIDE VALIDATION
    // -------------------------------------------------------

    if (
      !formData.title.trim() ||
      !formData.category.trim() ||
      !formData.level
    ) {

      setFormError(
        "Title, category and level are required."
      );

      return;
    }


    if (!formData.duration.trim()) {

      setFormError(
        "Duration is required (for example: 8 Weeks)."
      );

      return;
    }


    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {

      setFormError(
        "Please enter a valid price."
      );

      return;
    }


    // -------------------------------------------------------
    // API PAYLOAD
    // -------------------------------------------------------

    const coursePayload = {

      title:
        formData.title.trim(),

      category:
        formData.category.trim(),

      level:
        formData.level,

      duration:
        formData.duration.trim(),

      price:
        Number(formData.price),

      image:
        formData.image.trim(),

      description:
        formData.description.trim(),
    };


    setSaving(true);


    try {

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      if (editingId) {

        const response =
          await api.put(
            `/courses/${editingId}`,
            coursePayload
          );


        setSuccess(
          response.data.message
        );

      }

      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      else {

        const response =
          await api.post(
            "/courses",
            coursePayload
          );


        setSuccess(
          response.data.message
        );
      }


      // Close form.
      closeForm();


      // Refresh data.
      //
      // IMPORTANT:
      // Search / filter / sort state is NOT reset.
      //
      // Therefore CR-003 requirement:
      // "Search, filtering, and sorting state may not be
      // preserved after creating, updating, or deleting"
      // is handled correctly.
      await refreshCourses();

    } catch (error) {

      const responseData =
        error.response?.data;


      // Field-level server errors.
      if (responseData?.errors) {

        setFieldErrors(
          responseData.errors
        );
      }


      // General error.
      setFormError(
        responseData?.message ||
        "Could not save the course. Please try again."
      );

    } finally {

      setSaving(false);
    }
  };


  // =========================================================
  // DELETE COURSE
  // =========================================================

  const handleDelete = async (course) => {

    const confirmed =
      window.confirm(
        `Delete "${course.title}"? This cannot be undone.`
      );


    if (!confirmed) {

      return;
    }


    setError("");
    setSuccess("");


    try {

      const response =
        await api.delete(
          `/courses/${course.id}`
        );


      setSuccess(
        response.data.message
      );


      // Refresh only.
      //
      // Search / filter / sort states stay unchanged.
      await refreshCourses();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Could not delete the course."
      );
    }
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <>

      <Navbar />


      <div className="container">


        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="page-header">

          <div>

            <h1>
              Manage Courses
            </h1>

            <p className="page-subtitle">
              Add new courses, update the existing ones,
              or remove courses that are no longer offered.
            </p>

          </div>


          <button
            type="button"
            className="btn btn-primary"
            onClick={
              showForm
                ? closeForm
                : openAddForm
            }
          >

            {showForm
              ? <FaTimes />
              : <FaPlus />
            }


            {showForm
              ? "Cancel"
              : "Add Course"
            }

          </button>

        </div>


        {/* ===================================================
            SUCCESS / GENERAL ERROR
        =================================================== */}

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


        {/* ===================================================
            CR-003
            SEARCH + FILTER CONTROLS
        =================================================== */}

        <section className="filter-bar">

          {/* SEARCH */}

          <div className="form-group search-group">

            <label htmlFor="course-search">
              Search courses
            </label>


            <div className="search-input-wrapper">

              <FaSearch className="search-icon" />


              <input
                id="course-search"
                type="text"
                className="input search-input"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search by ID, title or category..."
              />

            </div>

          </div>


          {/* CATEGORY FILTER */}

          <div className="form-group">

            <label htmlFor="category-filter">
              Category
            </label>


            <select
              id="category-filter"
              className="input"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                All Categories
              </option>


              {categoryOptions.map(
                (category) => (

                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>

                )
              )}

            </select>

          </div>


          {/* LEVEL FILTER */}

          <div className="form-group">

            <label htmlFor="level-filter">
              Level
            </label>


            <select
              id="level-filter"
              className="input"
              value={levelFilter}
              onChange={(event) =>
                setLevelFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                All Levels
              </option>


              {LEVEL_OPTIONS.map(
                (level) => (

                  <option
                    key={level}
                    value={level}
                  >
                    {level}
                  </option>

                )
              )}

            </select>

          </div>


          {/* RESET BUTTON */}

          <button
            type="button"
            className="btn btn-outline clear-filters-btn"
            onClick={resetFilters}
          >

            <FaUndo />

            Reset Filters

          </button>

        </section>


        {/* ===================================================
            CR-003
            RESULT COUNTER
        =================================================== */}

        <div className="result-summary">

          <strong>
            Showing {displayedCourses.length}
          </strong>

          {" "}

          of {courses.length} course
          {courses.length !== 1 ? "s" : ""}


          {(searchTerm ||
            categoryFilter ||
            levelFilter) && (

            <span className="result-filter-note">

              {" "}based on current search/filter

            </span>

          )}

        </div>


        {/* ===================================================
            ADD / EDIT FORM
        =================================================== */}

        {showForm && (

          <section className="section-card">


            <div className="section-card-header">

              <h2>
                {editingId
                  ? "Edit Course"
                  : "New Course"
                }
              </h2>

            </div>


            <form
              className="form"
              onSubmit={handleSubmit}
            >


              {/* TITLE + CATEGORY */}

              <div className="form-row">


                <div className="form-group">

                  <label htmlFor="title">
                    Title *
                  </label>


                  <input
                    id="title"
                    className={
                      fieldErrors.title
                        ? "input input-error"
                        : "input"
                    }
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. React"
                  />


                  {fieldErrors.title && (

                    <p className="field-error">
                      {fieldErrors.title}
                    </p>

                  )}

                </div>


                <div className="form-group">

                  <label htmlFor="category">
                    Category *
                  </label>


                  <input
                    id="category"
                    className={
                      fieldErrors.category
                        ? "input input-error"
                        : "input"
                    }
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Frontend"
                  />


                  {fieldErrors.category && (

                    <p className="field-error">
                      {fieldErrors.category}
                    </p>

                  )}

                </div>

              </div>


              {/* LEVEL + DURATION + PRICE */}

              <div className="form-row">


                <div className="form-group">

                  <label htmlFor="level">
                    Level *
                  </label>


                  <select
                    id="level"
                    className={
                      fieldErrors.level
                        ? "input input-error"
                        : "input"
                    }
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                  >

                    {LEVEL_OPTIONS.map(
                      (level) => (

                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>

                      )
                    )}

                  </select>


                  {fieldErrors.level && (

                    <p className="field-error">
                      {fieldErrors.level}
                    </p>

                  )}

                </div>


                <div className="form-group">

                  <label htmlFor="duration">
                    Duration *
                  </label>


                  <input
                    id="duration"
                    className={
                      fieldErrors.duration
                        ? "input input-error"
                        : "input"
                    }
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 10 Weeks"
                  />


                  {fieldErrors.duration && (

                    <p className="field-error">
                      {fieldErrors.duration}
                    </p>

                  )}

                </div>


                <div className="form-group">

                  <label htmlFor="price">
                    Price (Rs.) *
                  </label>


                  <input
                    id="price"
                    className={
                      fieldErrors.price
                        ? "input input-error"
                        : "input"
                    }
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 25000"
                  />


                  {fieldErrors.price && (

                    <p className="field-error">
                      {fieldErrors.price}
                    </p>

                  )}

                </div>

              </div>


              {/* IMAGE */}

              <div className="form-group">

                <label htmlFor="image">
                  Image URL
                </label>


                <input
                  id="image"
                  className={
                    fieldErrors.image
                      ? "input input-error"
                      : "input"
                  }
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://placehold.co/300x180?text=React"
                />


                {fieldErrors.image && (

                  <p className="field-error">
                    {fieldErrors.image}
                  </p>

                )}

              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label htmlFor="description">
                  Description
                </label>


                <textarea
                  id="description"
                  className={
                    fieldErrors.description
                      ? "input input-error"
                      : "input"
                  }
                  rows="4"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short summary of what students will learn."
                />


                {fieldErrors.description && (

                  <p className="field-error">
                    {fieldErrors.description}
                  </p>

                )}

              </div>


              {/* FORM ERROR */}

              {formError && (

                <p className="error">
                  {formError}
                </p>

              )}


              {/* FORM ACTIONS */}

              <div className="form-actions">


                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >

                  <FaSave />

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Course"
                      : "Create Course"
                  }

                </button>


                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeForm}
                  disabled={saving}
                >

                  <FaTimes />

                  Cancel

                </button>

              </div>


            </form>

          </section>

        )}


        {/* ===================================================
            COURSE TABLE
        =================================================== */}

        <section className="section-card">


          <div className="section-card-header">

            <h2>
              All Courses
              {courses.length > 0
                ? ` (${courses.length})`
                : ""
              }
            </h2>


            <Link
              to="/admin/enrollments"
              className="link-inline"
            >

              <FaEye />

              Manage enrollments

            </Link>

          </div>


          {/* LOADING */}

          {loading && (

            <p className="loading">
              Loading courses...
            </p>

          )}


          {/* NO COURSES IN DATABASE */}

          {!loading &&
            courses.length === 0 && (

              <p className="empty">
                No courses yet.
                Click "Add Course" to create
                the first one.
              </p>

            )
          }


          {/* =================================================
              CR-003
              NO SEARCH/FILTER RESULTS
          ================================================= */}

          {!loading &&
            courses.length > 0 &&
            displayedCourses.length === 0 && (

              <div className="no-results">

                <div className="no-results-icon">
                  <FaSearch />
                </div>


                <h3>
                  No courses found
                </h3>


                <p>
                  No courses match your current
                  search or filter criteria.
                </p>


                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetFilters}
                >

                  <FaUndo />

                  Reset Filters

                </button>

              </div>

            )
          }


          {/* =================================================
              COURSE TABLE
          ================================================= */}

          {!loading &&
            displayedCourses.length > 0 && (

              <div className="table-wrapper">


                <table className="table">


                  <thead>

                    <tr>


                      {/* ID */}

                      <th>

                        <button
                          type="button"
                          className={
                            sortField === "id"
                              ? "sort-button active"
                              : "sort-button"
                          }
                          onClick={() =>
                            handleSort("id")
                          }
                        >

                          ID

                          {renderSortIcon("id")}

                        </button>

                      </th>


                      {/* IMAGE */}

                      <th>
                        Image
                      </th>


                      {/* TITLE */}

                      <th>

                        <button
                          type="button"
                          className={
                            sortField === "title"
                              ? "sort-button active"
                              : "sort-button"
                          }
                          onClick={() =>
                            handleSort("title")
                          }
                        >

                          Title

                          {renderSortIcon("title")}

                        </button>

                      </th>


                      {/* CATEGORY */}

                      <th>

                        <button
                          type="button"
                          className={
                            sortField === "category"
                              ? "sort-button active"
                              : "sort-button"
                          }
                          onClick={() =>
                            handleSort("category")
                          }
                        >

                          Category

                          {renderSortIcon("category")}

                        </button>

                      </th>


                      {/* LEVEL */}

                      <th>

                        <button
                          type="button"
                          className={
                            sortField === "level"
                              ? "sort-button active"
                              : "sort-button"
                          }
                          onClick={() =>
                            handleSort("level")
                          }
                        >

                          Level

                          {renderSortIcon("level")}

                        </button>

                      </th>


                      {/* DURATION */}

                      <th>

                        <button
                          type="button"
                          className={
                            sortField === "duration"
                              ? "sort-button active"
                              : "sort-button"
                          }
                          onClick={() =>
                            handleSort("duration")
                          }
                        >

                          Duration

                          {renderSortIcon("duration")}

                        </button>

                      </th>


                      {/* PRICE */}

                      <th>

                        <button
                          type="button"
                          className={
                            sortField === "price"
                              ? "sort-button active"
                              : "sort-button"
                          }
                          onClick={() =>
                            handleSort("price")
                          }
                        >

                          Price

                          {renderSortIcon("price")}

                        </button>

                      </th>


                      {/* ACTIONS */}

                      <th className="table-actions-column">
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {displayedCourses.map(
                      (course) => (

                        <tr
                          key={course.id}
                        >

                          <td>
                            {course.id}
                          </td>


                          <td>

                            <img
                              src={course.image}
                              alt={course.title}
                              className="table-thumb"
                            />

                          </td>


                          <td>
                            {course.title}
                          </td>


                          <td>
                            {course.category}
                          </td>


                          <td>

                            <span className="tag tag-level">
                              {course.level}
                            </span>

                          </td>


                          <td>
                            {course.duration}
                          </td>


                          <td>
                            Rs. {course.price}
                          </td>


                          <td>

                            <div className="table-actions">


                              <button
                                type="button"
                                className="btn btn-small btn-outline"
                                onClick={() =>
                                  openEditForm(course)
                                }
                              >

                                <FaEdit />

                                Edit

                              </button>


                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() =>
                                  handleDelete(course)
                                }
                              >

                                <FaTrash />

                                Delete

                              </button>


                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )
          }

        </section>


      </div>


      <Footer />

    </>

  );
}


export default ManageCourses;