function label(field) {
  if (!field) return "Request body";
  const words = field.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatIssues(issues) {
  const errors = [];
  for (const issue of issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) errors.push({ field: key, message: `Unexpected field: ${key}` });
      continue;
    }
    const field = issue.path.join(".");
    const missing =
      issue.code === "invalid_type" &&
      (issue.received === "undefined" || /received undefined/i.test(issue.message));
    let message = issue.message;
    if (missing) message = `${label(field)} is required`;
    else if (issue.code === "invalid_type" && issue.expected === "object") message = "Request body must be a JSON object";
    else if (issue.code === "invalid_type") message = `${label(field)} must be a ${issue.expected}`;
    errors.push({ field, message });
  }
  return errors;
}

export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatIssues(result.error.issues),
      });
    }
    req.body = result.data;
    next();
  };
}
