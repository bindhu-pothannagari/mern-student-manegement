import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import { validateEmail, hasErrors } from "../utils/validation";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const target = from ? `${from.pathname}${from.search || ""}` : "/students";
  const notice = location.state?.message;

  const [form, setForm] = useState({ email: "", password: "" });
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
      email: validateEmail(form.email),
      password: form.password ? "" : "Password is required",
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    setServerError("");
    try {
      await login(form.email.trim(), form.password);
      navigate(target, { replace: true });
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <h1>Log in</h1>
      {notice && (
        <p className="success-message" role="status">
          {notice}
        </p>
      )}
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
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="auth-links">
        <Link to="/forgot-password">Forgot password?</Link> · <Link to="/signup">Create an account</Link>
      </p>
    </section>
  );
}