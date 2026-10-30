
import { useState } from "react";
import "./StudentRegistration.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  rollNumber: "",
  course: "",
  year: "",
  address: "",
};

function StudentRegistration({ onBack }) {
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.log("Student details:", formData);
    setMessage("Registration form submitted successfully!");
  }

  function handleReset() {
    setFormData({ ...initialForm });
    setMessage("");
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to Home
        </button>

        <h1>Student Registration</h1>
        <p className="registration-subtitle">
          Enter the student details below.
        </p>

        {message && (
          <div className="success-message" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="registration-grid">
            <div className="field">
              <label htmlFor="student-name">Full Name</label>
              <input
                id="student-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="student-email">Email Address</label>
              <input
                id="student-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="student-phone">Phone Number</label>
              <input
                id="student-phone"
                name="phone"
                type="tel"
                pattern="[0-9]{10}"
                title="Enter a 10-digit phone number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="student-roll">Roll Number</label>
              <input
                id="student-roll"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="Enter roll number"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="student-course">Course</label>
              <select
                id="student-course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
              >
                <option value="">Select course</option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.Sc">B.Sc</option>
                <option value="B.Com">B.Com</option>
                <option value="BBA">BBA</option>
                <option value="MCA">MCA</option>
                <option value="MBA">MBA</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="student-year">Academic Year</label>
              <select
                id="student-year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
              >
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div className="field full-width">
              <label htmlFor="student-address">Address</label>
              <textarea
                id="student-address"
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                required
              />
            </div>
          </div>

          <div className="registration-actions">
            <button type="submit" className="submit-button">
              Register Student
            </button>

            <button
              type="button"
              className="clear-button"
              onClick={handleReset}
            >
              Clear Form
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default StudentRegistration;
