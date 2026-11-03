function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function oneLine(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

function formatDuration(months) {
  if (!months) return "";
  if (months % 12 === 0) return `${months / 12} year${months === 12 ? "" : "s"}`;
  return `${months} month${months === 1 ? "" : "s"}`;
}

export function enrollmentConfirmation({ studentName, courseName, courseCode, durationMonths, enrolledAt }) {
  const date = new Date(enrolledAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const duration = formatDuration(durationMonths);
  const course = courseCode ? `${courseName} (${courseCode})` : courseName;

  const subject = oneLine(`Enrollment confirmed: ${course}`);

  const text = [
    `Hello ${oneLine(studentName)},`,
    "",
    `Your enrollment in ${oneLine(course)} is confirmed.`,
    duration ? `Duration: ${duration}` : null,
    `Enrolled on: ${date}`,
    "",
    "If you did not expect this email, please contact the administration office.",
    "",
    "Student Management System",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;">
      <tr>
        <td style="padding:24px 28px;background:#2563eb;border-radius:8px 8px 0 0;color:#ffffff;font-size:20px;font-weight:bold;">
          Enrollment confirmed
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 16px;">Hello ${escapeHtml(studentName)},</p>
          <p style="margin:0 0 20px;">Your enrollment has been confirmed. Here are the details:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;width:40%;">Course</td>
              <td style="padding:8px 0;font-weight:bold;">${escapeHtml(course)}</td>
            </tr>
            ${duration ? `<tr><td style="padding:8px 0;color:#6b7280;">Duration</td><td style="padding:8px 0;">${escapeHtml(duration)}</td></tr>` : ""}
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Enrolled on</td>
              <td style="padding:8px 0;">${escapeHtml(date)}</td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
            If you did not expect this email, please contact the administration office.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
          Student Management System
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
