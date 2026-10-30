import { useEffect, useState } from "react";
import InputField from "../components/InputField";
import Button from "../components/Button";

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
const MOBILE_REGEX = /^[6-9]\d{9}$/; // 10 digits, starting with 6 to 9

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

export default function StudentRegistration() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  // Side effect: hide the success message after 4 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear that field's error
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess("");

    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return; // block invalid submit

    const cleanData = {
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
    };

    // Task 8 will send cleanData to the Express API here.
    console.log("Valid student data:", cleanData);

    setSuccess(`Student ${cleanData.fullName} registered successfully.`);
    setForm(initialForm);
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setSuccess("");
  };

  return (
    <section className="form-card">
      <h1>Student Registration</h1>

      {success && (
        <p className="success-message" role="status">
          {success}
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
        />
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
          <Button type="submit">Register</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
}