import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateConfirm,
  serverFieldErrors,
  hasErrors,
} from "../utils/validation";

const EMPTY = { username: "", email: "", password: "", confirmPassword: "" };

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
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
      username: validateUsername(form.username),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirm(form.password, form.confirmPassword),
    };
    setErrors(next);
    if (hasErrors(next)) return;

    setSubmitting(true);
    setServerError("");
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/students", { replace: true });
    } catch (err) {
      const fieldErrors = serverFieldErrors(err);
      if (hasErrors(fieldErrors)) setErrors(fieldErrors);
      else setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <h1>Create an account</h1>
      {serverError && (
        <p className="error-box" role="alert">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          error={errors.username}
          autoComplete="username"
        />
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
          autoComplete="new-password"
        />
        <InputField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="auth-links">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}