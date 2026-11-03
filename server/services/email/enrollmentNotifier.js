import { enrollmentConfirmation } from "./templates/enrollmentConfirmation.js";

export function maskEmail(email) {
  const [user, domain] = String(email || "").split("@");
  if (!user || !domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}

export function createEnrollmentNotifier({ claim, markSent, markFailed, send, log = console }) {
  return async function notify(studentId) {
    const student = await claim(studentId);
    if (!student) {
      log.info(`[email] enrollment confirmation skipped for student ${studentId}: already sent or in progress`);
      return { status: "skipped" };
    }

    const target = maskEmail(student.email);
    try {
      const message = enrollmentConfirmation({
        studentName: student.fullName,
        courseName: student.course?.name ?? "your course",
        courseCode: student.course?.code ?? "",
        durationMonths: student.course?.durationMonths,
        enrolledAt: student.createdAt,
      });
      const result = await send({ to: student.email, ...message });
      await markSent(studentId, result.messageId);
      const preview = result.previewUrl ? ` (preview: ${result.previewUrl})` : "";
      log.info(`[email] enrollment confirmation sent to ${target} for student ${studentId}${preview}`);
      return { status: "sent", previewUrl: result.previewUrl };
    } catch (err) {
      const code = err?.code || err?.responseCode || "SEND_FAILED";
      try {
        await markFailed(studentId, String(code));
      } catch {
        // the failure is still logged below
      }
      log.error(`[email] enrollment confirmation to ${target} failed for student ${studentId}: ${code}`);
      return { status: "failed" };
    }
  };
}
