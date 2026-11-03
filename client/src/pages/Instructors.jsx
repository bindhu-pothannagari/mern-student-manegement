import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { listInstructors, deleteInstructor } from "../api/instructorApi";

export default function Instructors() {
  const location = useLocation();
  const { can } = useAuth();
  const canManage = can("instructors:manage");

  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
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
        const res = await listInstructors({ search, page, limit: 10 });
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
  }, [search, page, reloadKey]);

  const handleDelete = async (instructor) => {
    const note =
      instructor.courseCount > 0
        ? ` Their ${instructor.courseCount} course(s) will become unassigned.`
        : "";
    if (!window.confirm(`Delete ${instructor.fullName}?${note}`)) return;
    setMessage("");
    setActionError("");
    try {
      const res = await deleteInstructor(instructor._id);
      setMessage(res.message);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const { data: instructors, total, totalPages } = result;

  return (
    <section>
      <div className="page-header">
        <h1>Instructors</h1>
        {canManage && (
          <Link className="btn" to="/instructors/new">
            Add instructor
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
            placeholder="Name, email or specialization"
            maxLength={100}
          />
        </label>
      </form>

      {loading && instructors.length === 0 && !error && (
        <p className="status" role="status">
          Loading instructors...
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
          <p>{search ? "No instructors match your search." : "No instructors yet."}</p>
        </div>
      )}

      {!error && instructors.length > 0 && (
        <>
          <p className="results-summary">Total instructors: {total}</p>
          <div className={`table-wrap${loading ? " is-loading" : ""}`} aria-busy={loading}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Courses</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {instructors.map((i) => (
                  <tr key={i._id}>
                    <td>{i.fullName}</td>
                    <td>{i.email}</td>
                    <td>{i.specialization}</td>
                    <td>{i.courseCount}</td>
                    {canManage && (
                      <td>
                        <div className="row-actions">
                          <Link
                            className="btn btn-small btn-secondary"
                            to={`/instructors/${i._id}/edit`}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-small btn-danger"
                            onClick={() => handleDelete(i)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
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