import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { createInstructor, getInstructor, updateInstructor } from "../api/instructorApi";
import { validateEmail } from "../utils/validation";

const EMPTY = { fullName: "", email: "", specialization: "" };

function validate(form) {
  const errors = {};
  const name = form.fullName.trim();
  if (!name) errors.fullName = "Full name is required.";
  else if (name.length < 3 || name.length > 100) errors.fullName = "Name must be 3 to 100 characters.";

  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;

  const spec = form.specialization.trim();
  if (!spec) errors.specialization = "Specialization is required.";
  else if (spec.length > 100) errors.specialization = "Specialization must be at most 100 characters.";
  return errors;
}

export default function InstructorForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    async function load() {
      try {
        const { data } = await getInstructor(id);
        if (!ignore) {
          setForm({ fullName: data.fullName, email: data.email, specialization: data.specialization });
          setCourses(data.courses || []);
        }
      } catch (err) {
        if (!ignore) setLoadError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      specialization: form.specialization.trim(),
    };

    setSubmitting(true);
    try {
      if (isEdit) await updateInstructor(id, payload);
      else await createInstructor(payload);
      navigate("/instructors", {
        state: { message: `${payload.fullName} was ${isEdit ? "updated" : "added"}.` },
      });
    } catch (err) {
      if (err.errors?.length) {
        const fieldErrors = {};
        err.errors.forEach((item) => {
          fieldErrors[item.field] = item.message;
        });
        setErrors(fieldErrors);
      } else if (err.status === 409) {
        setErrors({ email: "An instructor with this email already exists." });
      } else {
        setServerError(err.message);
      }
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <p className="status" role="status">
        Loading instructor...
      </p>
    );

  if (loadError)
    return (
      <section className="form-card">
        <p className="error-box" role="alert">
          {loadError}
        </p>
      </section>
    );

  return (
    <section className="form-card">
      <h1>{isEdit ? "Edit Instructor" : "Add Instructor"}</h1>
      {serverError && (
        <p className="error-box" role="alert">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          placeholder="e.g. Ravi Kumar"
          autoComplete="name"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="e.g. ravi@example.com"
          autoComplete="email"
        />
        <InputField
          label="Specialization"
          name="specialization"
          value={form.specialization}
          onChange={handleChange}
          error={errors.specialization}
          placeholder="e.g. Databases"
        />

        {isEdit && (
          <p className="field-note">
            Teaches:{" "}
            {courses.length > 0
              ? courses.map((c) => `${c.name} (${c.code})`).join(", ")
              : "no courses yet. Assign courses from the course form."}
          </p>
        )}

        <div className="form-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update" : "Add"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/instructors")}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}