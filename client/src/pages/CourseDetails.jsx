import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCourse, getCourseStudents } from "../api/courseApi";
import { formatFee, formatDuration, capitalize } from "../utils/format";

export default function CourseDetails() {
  const { id } = useParams();
  const { can, canSeeField } = useAuth();
  const showMobile = canSeeField("mobile");

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [students, setStudents] = useState({ data: [], total: 0, totalPages: 1 });
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getCourse(id);
        if (!ignore) setCourse(res.data);
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

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStudentsLoading(true);
      setStudentsError("");
      try {
        const res = await getCourseStudents(id, { page, limit: 10 });
        if (!ignore) setStudents({ data: res.data, total: res.total, totalPages: res.totalPages });
      } catch (err) {
        if (!ignore) setStudentsError(err.message);
      } finally {
        if (!ignore) setStudentsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, page]);

  if (loading)
    return (
      <p className="status" role="status">
        Loading course...
      </p>
    );

  if (error)
    return (
      <section>
        <p className="error-box" role="alert">
          {error}
        </p>
        <Link to="/courses">Back to courses</Link>
      </section>
    );

  return (
    <section>
      <h1>
        {course.name} <small>({course.code})</small>
      </h1>
      <dl className="details">
        <dt>Status</dt>
        <dd>
          <span className={`status-badge status-${course.status}`}>{capitalize(course.status)}</span>
        </dd>
        <dt>Duration</dt>
        <dd>{formatDuration(course.durationMonths)}</dd>
        <dt>Fee</dt>
        <dd>{formatFee(course.fee)}</dd>
        <dt>Instructor</dt>
        <dd>
          {course.instructor
            ? `${course.instructor.fullName} – ${course.instructor.specialization}`
            : "Not assigned"}
        </dd>
        <dt>Description</dt>
        <dd>{course.description || "No description"}</dd>
        <dt>Enrolled students</dt>
        <dd>{course.studentCount}</dd>
        <dt>Created</dt>
        <dd>{new Date(course.createdAt).toLocaleDateString()}</dd>
      </dl>

      <div className="form-actions">
        {can("courses:manage") && (
          <Link className="btn" to={`/courses/${course._id}/edit`}>
            Edit
          </Link>
        )}
        <Link className="btn btn-secondary" to="/courses">
          Back to courses
        </Link>
      </div>

      <h2>Enrolled students</h2>

      {studentsLoading && students.data.length === 0 && (
        <p className="status" role="status">
          Loading students...
        </p>
      )}
      {studentsError && (
        <p className="error-box" role="alert">
          {studentsError}
        </p>
      )}
      {!studentsLoading && !studentsError && students.total === 0 && (
        <p className="empty-state">No students are enrolled in this course yet.</p>
      )}

      {!studentsError && students.data.length > 0 && (
        <>
          <div className={`table-wrap${studentsLoading ? " is-loading" : ""}`}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {showMobile && <th>Mobile</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.data.map((s) => (
                  <tr key={s._id}>
                    <td>{s.fullName}</td>
                    <td>{s.email}</td>
                    {showMobile && <td>{s.mobile}</td>}
                    <td>
                      <Link className="btn btn-small" to={`/students/${s._id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                type="button"
                className="btn btn-small btn-secondary"
                disabled={page <= 1 || studentsLoading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {students.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                disabled={page >= students.totalPages || studentsLoading}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}