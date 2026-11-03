import { useState } from "react";
import { resendEnrollmentEmail } from "../api/emailApi";

const LABELS = {
  pending: "Waiting to send",
  sending: "Sending...",
  failed: "Failed to send",
};

export default function EnrollmentEmailStatus({ studentId, email, canResend }) {
  const [status, setStatus] = useState(email?.status);
  const [sentAt, setSentAt] = useState(email?.sentAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setError("");
    setBusy(true);
    try {
      await resendEnrollmentEmail(studentId);
      setStatus("sent");
      setSentAt(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const label =
    status === "sent"
      ? `Sent on ${new Date(sentAt).toLocaleString()}`
      : LABELS[status] || "Not recorded";

  return (
    <span className="email-status">
      <span className={`status-badge status-email-${status || "none"}`}>{label}</span>
      {status === "failed" && canResend && (
        <button type="button" className="btn btn-small" onClick={handleResend} disabled={busy}>
          {busy ? "Sending..." : "Resend"}
        </button>
      )}
      {error && (
        <span className="error-text" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
