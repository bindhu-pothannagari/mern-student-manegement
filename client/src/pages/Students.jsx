
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Students() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    function loadStudents() {
      const saved = JSON.parse(
        localStorage.getItem("students") || "[]"
      );
      setStudents(saved);
    }

    loadStudents();

    window.addEventListener("storage", loadStudents);
    window.addEventListener("studentsUpdated", loadStudents);

    return () => {
      window.removeEventListener("storage", loadStudents);
      window.removeEventListener("studentsUpdated", loadStudents);
    };
  }, []);

  function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    const updated = students.filter((student) => student.id !== id);

    localStorage.setItem("students", JSON.stringify(updated));
    setStudents(updated);
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <Link to="/" style={styles.backLink}>
          ← Back to Home
        </Link>

        <h1>Student Records</h1>
        <p>View and manage registered student details.</p>

        <Link to="/register" style={styles.addButton}>
          + Register Student
        </Link>

        {students.length === 0 ? (
          <div style={styles.empty}>
            <h3>No students registered yet</h3>
            <p>Register a student to see their details here.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Name</th>
                  <th style={styles.cell}>Email</th>
                  <th style={styles.cell}>Phone</th>
                  <th style={styles.cell}>Roll Number</th>
                  <th style={styles.cell}>Course</th>
                  <th style={styles.cell}>Year</th>
                  <th style={styles.cell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={styles.cell}>{student.name}</td>
                    <td style={styles.cell}>{student.email}</td>
                    <td style={styles.cell}>{student.phone}</td>
                    <td style={styles.cell}>{student.rollNumber}</td>
                    <td style={styles.cell}>{student.course}</td>
                    <td style={styles.cell}>{student.year}</td>
                    <td style={styles.cell}>
                      <button
                        onClick={() => handleDelete(student.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px 15px",
    background: "#f4f6fa",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  card: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "30px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  backLink: {
    display: "inline-block",
    marginBottom: "20px",
    color: "#2563eb",
    textDecoration: "none",
  },
  addButton: {
    display: "inline-block",
    margin: "12px 0 20px",
    padding: "11px 16px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
  },
  empty: {
    marginTop: "20px",
    padding: "25px",
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  cell: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  deleteButton: {
    padding: "7px 12px",
    color: "#fff",
    background: "#dc2626",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
