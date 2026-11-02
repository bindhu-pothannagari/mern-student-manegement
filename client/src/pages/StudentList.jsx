import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getStudents, deleteStudent } from "../api/studentApi";
import Button from "../components/Button";

const COURSES = ["BCA", "BBA", "MCA"];
const GENDERS = ["male", "female", "other"];
const PAGE_SIZES = [10, 25, 50];
const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest first" },
  { value: "createdAt-asc", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

function readFilters(params) {
  const sortKey = params.get("sort") || "createdAt";
  const order = params.get("order") || (sortKey === "name" ? "asc" : "desc");
  const sortValue = `${sortKey}-${order}`;
  const page = Number(params.get("page"));
  const limit = Number(params.get("limit"));
  const gender = params.get("gender") || "";
  return {
    search: params.get("search") || "",
    course: params.get("course") || "",
    gender: GENDERS.includes(gender) ? gender : "",
    sortValue: SORT_OPTIONS.some((o) => o.value === sortValue) ? sortValue : "createdAt-desc",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: PAGE_SIZES.includes(limit) ? limit : 10,
  };
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export default function StudentList() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, course, gender, sortValue, page, limit } = readFilters(searchParams);
  const [sort, order] = sortValue.split("-");

  const [searchText, setSearchText] = useState(search);
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const updateParams = (changes, { resetPage = true, replace = false } = {}) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === "" || value === null || value === undefined) next.delete(key);
          else next.set(key, String(value));
        }
        if (resetPage) next.delete("page");
        return next;
      },
      { replace }
    );
  };

  const goToPage = (n) => updateParams({ page: n > 1 ? n : "" }, { resetPage: false });

  useEffect(() => {
    const trimmed = searchText.trim();
    if (trimmed === search) return;
    const timer = setTimeout(() => updateParams({ search: trimmed }, { replace: true }), 400);
    return () => clearTimeout(timer);
  }, [searchText, search]);

  useEffect(() => {
    setSearchText((prev) => (prev.trim() === search ? prev : search));
  }, [search]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getStudents({ search, course, gender, sort, order, page, limit });
        if (ignore) return;
        if (res.total > 0 && page > res.totalPages) {
          updateParams(
            { page: res.totalPages > 1 ? res.totalPages : "" },
            { resetPage: false, replace: true }
          );
          return;
        }
        setResult({ data: res.data, total: res.total, totalPages: res.totalPages });
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
  }, [search, course, gender, sort, order, page, limit, reloadKey]);

  const retry = () => setReloadKey((k) => k + 1);

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) return;
    setMessage("");
    setActionError("");
    try {
      await deleteStudent(student._id);
      setMessage(`${student.fullName} was deleted.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleSortChange = (value) => {
    if (value === "createdAt-desc") {
      updateParams({ sort: "", order: "" });
    } else {
      const [s, o] = value.split("-");
      updateParams({ sort: s, order: o });
    }
  };

  const hasFilters = Boolean(search || course || gender);
  const clearFilters = () => {
    setSearchText("");
    updateParams({ search: "", course: "", gender: "" });
  };

  const { data: students, total, totalPages } = result;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = start + students.length - 1;

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

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label>
          Search
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Name or email"
            maxLength={100}
          />
        </label>

        <label>
          Course
          <select value={course} onChange={(e) => updateParams({ course: e.target.value })}>
            <option value="">All courses</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Gender
          <select value={gender} onChange={(e) => updateParams({ gender: e.target.value })}>
            <option value="">All genders</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {capitalize(g)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort by
          <select value={sortValue} onChange={(e) => handleSortChange(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Per page
          <select
            value={limit}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateParams({ limit: v === 10 ? "" : v });
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button type="button" className="btn btn-small btn-secondary" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </form>

      {loading && students.length === 0 && !error && (
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

      {!loading && !error && total === 0 && (
        <div className="empty-state">
          {hasFilters ? (
            <>
              <p>No students match your search or filters.</p>
              <button type="button" className="btn" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p>No students yet.</p>
              <Link className="btn" to="/register">
                Register the first student
              </Link>
            </>
          )}
        </div>
      )}

      {!error && students.length > 0 && (
        <>
          <p className="results-summary" aria-live="polite">
            Total students: {total} · Showing {start}–{end}
          </p>
          <div className={`table-wrap${loading ? " is-loading" : ""}`} aria-busy={loading}>
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

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                type="button"
                className="btn btn-small btn-secondary"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(page - 1)}
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
                onClick={() => goToPage(page + 1)}
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