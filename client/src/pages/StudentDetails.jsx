import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStudent, deleteStudent } from "../api/studentApi";
import { useAuth } from "../context/AuthContext";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, canSeeField } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getStudent(id);
        if (!ignore) setStudent(res.data);
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
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) return;
    setActionError("");
    setDeleting(true);
    try {
      await deleteStudent(student._id);
      navigate("/students", { state: { message: `${student.fullName} was deleted.` } });
    } catch (err) {
      setActionError(err.message);
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <p className="status" role="status">
        Loading student...
      </p>
    );

  if (error)
    return (
      <section>
        <p className="error-box" role="alert">
          {error}
        </p>
        <Link to="/students">Back to students</Link>
      </section>
    );

  return (
    <section>
      <h1>{student.fullName}</h1>
      {actionError && (
        <p className="error-box" role="alert">
          {actionError}
        </p>
      )}
      <dl className="details">
        <dt>Email</dt>
        <dd>{student.email}</dd>
        {canSeeField("mobile") && (
          <>
            <dt>Mobile</dt>
            <dd>{student.mobile}</dd>
          </>
        )}
        <dt>Gender</dt>
        <dd className="capitalize">{student.gender}</dd>
        <dt>Course</dt>
        <dd>{student.course ? <Link to={`/courses/${student.course._id}`}>{student.course.name} ({student.course.code})</Link> : "Not assigned"}</dd>
        {canSeeField("address") && (
          <>
            <dt>Address</dt>
            <dd>{student.address}</dd>
          </>
        )}
        <dt>Registered</dt>
        <dd>{new Date(student.createdAt).toLocaleDateString()}</dd>
      </dl>
      <div className="form-actions">
        {can("students:update") && (
          <Link className="btn" to={`/students/${student._id}/edit`}>
            Edit
          </Link>
        )}
        {can("students:delete") && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
        <Link className="btn btn-secondary" to="/students">
          Back to list
        </Link>
      </div>
    </section>
  );
}