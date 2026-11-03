import Student from "../../models/Student.js";
import { sendEmail } from "./emailService.js";
import { createEnrollmentNotifier } from "./enrollmentNotifier.js";

function claim(studentId) {
  return Student.findOneAndUpdate(
    { _id: studentId, "enrollmentEmail.status": { $in: ["pending", "failed"] } },
    { $set: { "enrollmentEmail.status": "sending" }, $inc: { "enrollmentEmail.attempts": 1 } },
    { returnDocument: "after" }
  ).populate("course", "name code durationMonths");
}

function markSent(studentId, messageId) {
  return Student.updateOne(
    { _id: studentId },
    {
      $set: {
        "enrollmentEmail.status": "sent",
        "enrollmentEmail.sentAt": new Date(),
        "enrollmentEmail.messageId": messageId,
      },
      $unset: { "enrollmentEmail.lastError": 1 },
    }
  );
}

function markFailed(studentId, code) {
  return Student.updateOne(
    { _id: studentId },
    { $set: { "enrollmentEmail.status": "failed", "enrollmentEmail.lastError": code } }
  );
}

export const sendEnrollmentConfirmation = createEnrollmentNotifier({
  claim,
  markSent,
  markFailed,
  send: sendEmail,
  log: { info: console.log, error: console.error },
});

export function queueEnrollmentConfirmation(studentId) {
  setImmediate(() => {
    sendEnrollmentConfirmation(studentId).catch((err) => {
      console.error(`[email] unexpected error for student ${studentId}: ${err?.name || "Error"}`);
    });
  });
}
