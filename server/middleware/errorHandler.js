export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Four parameters tell Express this is the error handler
export function errorHandler(err, req, res, next) {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res
      .status(400)
      .json({ success: false, message: "Validation failed", errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return res
      .status(409)
            .json({ success: false, message: `A record with this ${field} already exists` });
  }
    if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid value for ${err.path}` });
  }

  if (err.name === "MulterError") {
    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    const message = tooLarge
      ? "File is too large. Photos can be up to 2 MB and documents up to 5 MB."
      : err.code === "LIMIT_UNEXPECTED_FILE"
        ? "Send one file in a form field named 'file'"
        : "The upload could not be processed";
    return res.status(tooLarge ? 413 : 400).json({ success: false, message });
  }

  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Malformed JSON in request body" });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  console.error("Unexpected error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
}