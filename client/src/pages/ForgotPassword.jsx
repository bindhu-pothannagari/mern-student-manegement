import { useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../components/InputField";
import { forgotPassword } from "../api/authApi";
import { validateEmail } from "../utils/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validateEmail(email);
    setError(msg);
    if (msg) return;

    setSubmitting(true);
    setServerError("");
    try {
      const res = await forgotPassword(email.trim());
      setDone(res.message);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <h1>Forgot password</h1>
      {done ? (
        <p className="success-message" role="status">
          {done}
        </p>
      ) : (
        <>
          <p>Enter your account email and we will send you a link to reset your password.</p>
          {serverError && (
            <p className="error-box" role="alert">
              {serverError}
            </p>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              error={error}
              autoComplete="email"
            />
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      )}
      <p className="auth-links">
        <Link to="/login">Back to log in</Link>
      </p>
    </section>
  );
}