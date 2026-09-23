const ALLOWED_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const validateCourse = (req, res, next) => {
  const {
    title,
    category,
    level,
    duration,
    price,
  } = req.body || {};

  const errors = {};

  // Title
  if (!title || !String(title).trim()) {
    errors.title = "Title is required.";
  }

  // Category
  if (!category || !String(category).trim()) {
    errors.category = "Category is required.";
  }

  // Level
  if (!level || !String(level).trim()) {
    errors.level = "Level is required.";
  } else if (!ALLOWED_LEVELS.includes(String(level).trim())) {
    errors.level =
      "Level must be Beginner, Intermediate, or Advanced.";
  }

  // Duration
  if (!duration || !String(duration).trim()) {
    errors.duration =
      "Duration is required (for example: 8 Weeks).";
  }

  // Price
  if (
    price === "" ||
    price === null ||
    price === undefined
  ) {
    errors.price = "Price is required.";
  } else {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
      errors.price = "Please enter a valid price.";
    } else if (numericPrice < 0) {
      errors.price =
        "Price must be greater than or equal to 0.";
    }
  }

  // Stop request if validation failed
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Please correct the highlighted fields.",
      errors,
    });
  }

  // Clean/normalized data
  req.validatedCourse = {
    title: String(title).trim(),
    category: String(category).trim(),
    level: String(level).trim(),
    duration: String(duration).trim(),
    price: Number(price),
    image: req.body.image
      ? String(req.body.image).trim()
      : "",
    description: req.body.description
      ? String(req.body.description).trim()
      : "",
  };

  next();
};

module.exports = {
  validateCourse,
  ALLOWED_LEVELS,
};