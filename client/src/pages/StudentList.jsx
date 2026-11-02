import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getStudents, deleteStudent } from "../api/studentApi";
import Button from "../components/Button";

export default function StudentList() {
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getStudents();
        if (!ignore) setStudents(res.data);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setError("");
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) return;
    setMessage("");
    setActionError("");
    try {
      await deleteStudent(student._id);
      setStudents((prev) => prev.filter((s) => s._id !== student._id));
      setMessage(`${student.fullName} was deleted.`);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>Students</h1>
        <Link className="btn" to="/register">
          Add student
        </Link>
      </div>

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {actionError && (
        <p className="error-box" role="alert">
          {actionError}
        </p>
      )}

      {loading && (
        <p className="status" role="status">
          Loading students...
        </p>
      )}

      {!loading && error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="empty-state">
          <p>No students yet.</p>
          <Link className="btn" to="/register">
            Register the first student
          </Link>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <>
          <p>Total students: {students.length}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Course</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.fullName}</td>
                    <td>{s.email}</td>
                    <td>{s.mobile}</td>
                    <td>{s.course}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn btn-small" to={`/students/${s._id}`}>
                          View
                        </Link>
                        <Link
                          className="btn btn-small btn-secondary"
                          to={`/students/${s._id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(s)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}