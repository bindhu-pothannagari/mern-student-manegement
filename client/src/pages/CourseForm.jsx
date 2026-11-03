import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { createCourse, getCourse, updateCourse } from "../api/courseApi";
import { getInstructorOptions } from "../api/instructorApi";

const EMPTY = {
  name: "",
  code: "",
  description: "",
  durationMonths: "",
  fee: "",
  status: "active",
  instructor: "",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function validate(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Course name is required.";
  else if (name.length < 2 || name.length > 100) errors.name = "Name must be 2 to 100 characters.";

  if (!form.code.trim()) errors.code = "Course code is required.";
  else if (!/^[A-Za-z0-9-]{2,12}$/.test(form.code.trim()))
    errors.code = "Code must be 2–12 letters, numbers or hyphens.";

  const duration = Number(form.durationMonths);
  if (form.durationMonths === "") errors.durationMonths = "Duration is required.";
  else if (!Number.isInteger(duration) || duration < 1 || duration > 120)
    errors.durationMonths = "Enter a whole number of months from 1 to 120.";

  const fee = Number(form.fee);
  if (form.fee === "") errors.fee = "Fee is required.";
  else if (!Number.isFinite(fee) || fee < 0) errors.fee = "Fee must be 0 or more.";

  if (!form.status) errors.status = "Please select a status.";
  if (form.description.length > 1000) errors.description = "Description must be at most 1000 characters.";
  return errors;
}

export default function CourseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    let ignore = false;
    getInstructorOptions()
      .then((res) => {
        if (!ignore) setInstructors(res.data);
      })
      .catch((err) => {
        if (!ignore) setServerError(`Could not load instructors: ${err.message}`);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    async function load() {
      try {
        const { data } = await getCourse(id);
        if (!ignore) {
          setForm({
            name: data.name,
            code: data.code,
            description: data.description || "",
            durationMonths: String(data.durationMonths),
            fee: String(data.fee),
            status: data.status,
            instructor: data.instructor?._id ?? "",
          });
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
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      durationMonths: Number(form.durationMonths),
      fee: Number(form.fee),
      status: form.status,
      instructor: form.instructor || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) await updateCourse(id, payload);
      else await createCourse(payload);
      navigate("/courses", {
        state: { message: `${payload.name} was ${isEdit ? "updated" : "created"}.` },
      });
    } catch (err) {
      if (err.errors?.length) {
        const fieldErrors = {};
        err.errors.forEach((item) => {
          fieldErrors[item.field] = item.message;
        });
        setErrors(fieldErrors);
      } else if (err.status === 409) {
        setErrors({ code: "A course with this code already exists." });
      } else if (/instructor/i.test(err.message)) {
        setErrors({ instructor: err.message });
      } else {
        setServerError(err.message);
      }
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <p className="status" role="status">
        Loading course...
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

  const instructorOptions = instructors.map((i) => ({
    value: i._id,
    label: `${i.fullName} – ${i.specialization}`,
  }));

  return (
    <section className="form-card">
      <h1>{isEdit ? "Edit Course" : "Add Course"}</h1>
      {serverError && (
        <p className="error-box" role="alert">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Course Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g. Bachelor of Computer Applications"
        />
        <InputField
          label="Course Code"
          name="code"
          value={form.code}
          onChange={handleChange}
          error={errors.code}
          placeholder="e.g. BCA"
          maxLength={12}
        />
        <InputField
          label="Description"
          name="description"
          as="textarea"
          value={form.description}
          onChange={handleChange}
          error={errors.description}
          placeholder="What the course covers"
        />
        <InputField
          label="Duration (months)"
          name="durationMonths"
          type="number"
          min="1"
          max="120"
          step="1"
          value={form.durationMonths}
          onChange={handleChange}
          error={errors.durationMonths}
        />
        <InputField
          label="Fee (₹)"
          name="fee"
          type="number"
          min="0"
          step="1"
          value={form.fee}
          onChange={handleChange}
          error={errors.fee}
        />
        <InputField
          label="Status"
          name="status"
          as="select"
          options={statusOptions}
          value={form.status}
          onChange={handleChange}
          error={errors.status}
        />
        <InputField
          label="Instructor"
          name="instructor"
          as="select"
          options={instructorOptions}
          value={form.instructor}
          onChange={handleChange}
          error={errors.instructor}
        />
        <p className="field-note">Leave the instructor empty to keep the course unassigned.</p>

        <div className="form-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/courses")}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}