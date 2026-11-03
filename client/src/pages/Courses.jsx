import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { listCourses, deleteCourse } from "../api/courseApi";
import { formatFee, formatDuration, capitalize } from "../utils/format";

export default function Courses() {
  const location = useLocation();
  const { can } = useAuth();
  const canManage = can("courses:manage");

  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await listCourses({ search, status, page, limit: 10 });
        if (!ignore) setResult({ data: res.data, total: res.total, totalPages: res.totalPages });
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
  }, [search, status, page, reloadKey]);

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete the course ${course.name}? This cannot be undone.`)) return;
    setMessage("");
    setActionError("");
    try {
      await deleteCourse(course._id);
      setMessage(`${course.name} was deleted.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const { data: courses, total, totalPages } = result;

  return (
    <section>
      <div className="page-header">
        <h1>Courses</h1>
        {canManage && (
          <Link className="btn" to="/courses/new">
            Add course
          </Link>
        )}
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

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label>
          Search
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Course name or code"
            maxLength={100}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </form>

      {loading && courses.length === 0 && !error && (
        <p className="status" role="status">
          Loading courses...
        </p>
      )}

      {!loading && error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
          <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="empty-state">
          <p>{search || status ? "No courses match your search." : "No courses yet."}</p>
        </div>
      )}

      {!error && courses.length > 0 && (
        <>
          <p className="results-summary">Total courses: {total}</p>
          <div className={`table-wrap${loading ? " is-loading" : ""}`} aria-busy={loading}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Instructor</th>
                  <th>Duration</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c._id}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.instructor?.fullName ?? "Not assigned"}</td>
                    <td>{formatDuration(c.durationMonths)}</td>
                    <td>{formatFee(c.fee)}</td>
                    <td>
                      <span className={`status-badge status-${c.status}`}>{capitalize(c.status)}</span>
                    </td>
                    <td>{c.studentCount}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn btn-small" to={`/courses/${c._id}`}>
                          View
                        </Link>
                        {canManage && (
                          <>
                            <Link className="btn btn-small btn-secondary" to={`/courses/${c._id}/edit`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="btn btn-small btn-danger"
                              onClick={() => handleDelete(c)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                type="button"
                className="btn btn-small btn-secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                disabled={page >= totalPages || loading}
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