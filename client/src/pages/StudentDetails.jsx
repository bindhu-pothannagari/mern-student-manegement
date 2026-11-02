import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStudent } from "../api/studentApi";

export default function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <dl className="details">
        <dt>Email</dt>
        <dd>{student.email}</dd>
        <dt>Mobile</dt>
        <dd>{student.mobile}</dd>
        <dt>Gender</dt>
        <dd className="capitalize">{student.gender}</dd>
        <dt>Course</dt>
        <dd>{student.course}</dd>
        <dt>Address</dt>
        <dd>{student.address}</dd>
        <dt>Registered</dt>
        <dd>{new Date(student.createdAt).toLocaleDateString()}</dd>
      </dl>
      <div className="form-actions">
        <Link className="btn" to={`/students/${student._id}/edit`}>
          Edit
        </Link>
        <Link className="btn btn-secondary" to="/students">
          Back to list
        </Link>
      </div>
    </section>
  );
}