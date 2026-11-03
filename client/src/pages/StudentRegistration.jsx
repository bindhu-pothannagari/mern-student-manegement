import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { createStudent, getStudent, updateStudent } from "../api/studentApi";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  fullName: "",
  email: "",
  mobile: "",
  gender: "",
  course: "",
  address: "",
};

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

// Temporary list. In Task 12 the courses come from the database.
const courseOptions = [
  { value: "BCA", label: "BCA" },
  { value: "BBA", label: "BBA" },
  { value: "BSc Computer Science", label: "BSc Computer Science" },
  { value: "MCA", label: "MCA" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

function validate(form) {
  const errors = {};
  const name = form.fullName.trim();

  if (!name) errors.fullName = "Full name is required.";
  else if (name.length < 3)
    errors.fullName = "Full name must be at least 3 characters.";
  else if (!/^[A-Za-z .'-]+$/.test(name))
    errors.fullName = "Full name can contain only letters, spaces and . ' -";

  if (!form.email.trim()) errors.email = "Email address is required.";
  else if (!EMAIL_REGEX.test(form.email.trim()))
    errors.email = "Enter a valid email address.";

  if (!form.mobile.trim()) errors.mobile = "Mobile number is required.";
  else if (!MOBILE_REGEX.test(form.mobile.trim()))
    errors.mobile = "Enter a valid 10-digit mobile number.";

  if (!form.gender) errors.gender = "Please select a gender.";
  if (!form.course) errors.course = "Please select a course.";

  if (!form.address.trim()) errors.address = "Address is required.";
  else if (form.address.trim().length < 10)
    errors.address = "Address must be at least 10 characters.";

  return errors;
}

function toForm(student) {
  return {
    fullName: student.fullName ?? "",
    email: student.email ?? "",
    mobile: student.mobile ?? "",
    gender: student.gender ?? "",
    course: student.course ?? "",
    address: student.address ?? "",
  };
}

export default function StudentRegistration() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { canEditField } = useAuth();
  const emailLocked = isEdit && !canEditField("email");

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [serverError, setServerError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Edit mode: load the existing student
  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    async function load() {
      try {
        const res = await getStudent(id);
        if (!ignore) setForm(toForm(res.data));
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

  // Hide the success message after 4 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setServerError("");

    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const cleanData = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      gender: form.gender,
      course: form.course,
      address: form.address.trim(),
    };

    // Send only the fields this role is allowed to change
    const payload = isEdit
      ? Object.fromEntries(Object.entries(cleanData).filter(([key]) => canEditField(key)))
      : cleanData;

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateStudent(id, payload);
        navigate("/students", {
          state: { message: `${cleanData.fullName} was updated.` },
        });
      } else {
        await createStudent(payload);
        setSuccess(`Student ${cleanData.fullName} registered successfully.`);
        setForm(initialForm);
      }
    } catch (err) {
      if (err.errors?.length) {
        const fieldErrors = {};
        err.errors.forEach((item) => {
          fieldErrors[item.field] = item.message;
        });
        setErrors(fieldErrors);
      } else if (err.status === 409) {
        setErrors({ email: err.message });
      } else {
        setServerError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEdit) {
      navigate("/students");
      return;
    }
    setForm(initialForm);
    setErrors({});
    setSuccess("");
    setServerError("");
  };

  if (loading)
    return (
      <p className="status" role="status">
        Loading student...
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
      <h1>{isEdit ? "Edit Student" : "Student Registration"}</h1>

      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
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
          placeholder="e.g. Asha Reddy"
          autoComplete="name"
        />
        <InputField
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="e.g. asha@example.com"
          autoComplete="email"
          disabled={emailLocked}
        />
                {emailLocked && (
          <p className="field-note">Only an admin can change a student's email address.</p>
        )}
        <InputField
          label="Mobile Number"
          name="mobile"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.mobile}
          onChange={handleChange}
          error={errors.mobile}
          placeholder="10-digit number"
          autoComplete="tel"
        />
        <InputField
          label="Gender"
          name="gender"
          as="select"
          options={genderOptions}
          value={form.gender}
          onChange={handleChange}
          error={errors.gender}
        />
        <InputField
          label="Course"
          name="course"
          as="select"
          options={courseOptions}
          value={form.course}
          onChange={handleChange}
          error={errors.course}
        />
        <InputField
          label="Address"
          name="address"
          as="textarea"
          value={form.address}
          onChange={handleChange}
          error={errors.address}
          placeholder="House no, street, city, state"
          autoComplete="street-address"
        />

        <div className="form-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update" : "Register"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            {isEdit ? "Cancel" : "Reset"}
          </Button>
        </div>
      </form>
    </section>
  );
}