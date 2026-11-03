import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import InputField from "../components/InputField";
import { resetPassword } from "../api/authApi";
import { validatePassword, validateConfirm, hasErrors } from "../utils/validation";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {
      password: validatePassword(form.password),
      confirmPassword: validateConfirm(form.password, form.confirmPassword),
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    setServerError("");
    try {
      await resetPassword(token, form.password);
      navigate("/login", {
        replace: true,
        state: { message: "Password reset. Please log in with your new password." },
      });
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <h1>Choose a new password</h1>
      {serverError && (
        <div className="error-box" role="alert">
          <p>{serverError}</p>
          <Link to="/forgot-password">Request a new link</Link>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="New password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />
        <InputField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Saving..." : "Reset password"}
        </button>
      </form>
    </section>
  );
}