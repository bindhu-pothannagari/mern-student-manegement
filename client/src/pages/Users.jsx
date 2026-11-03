import { useEffect, useState } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { listUsers, updateUserRole, deleteUser } from "../api/userApi";

const ROLES = ["admin", "staff", "viewer"];
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export default function Users() {
  const { user: me } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
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
        const res = await listUsers({ search, role, page, limit: 10 });
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
  }, [search, role, page, reloadKey]);

  const changeRole = async (target, newRole) => {
    if (newRole === target.role) return;
    if (!window.confirm(`Change ${target.username} to ${newRole}? They will be signed out.`)) return;
    setMessage("");
    setActionError("");
    setBusyId(target._id);
    try {
      const res = await updateUserRole(target._id, newRole);
      setResult((prev) => ({
        ...prev,
        data: prev.data.map((u) => (u._id === target._id ? res.data : u)),
      }));
      setMessage(`${target.username} is now ${newRole}.`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (target) => {
    if (!window.confirm(`Delete the account ${target.username}? This cannot be undone.`)) return;
    setMessage("");
    setActionError("");
    setBusyId(target._id);
    try {
      await deleteUser(target._id);
      setMessage(`${target.username} was deleted.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const { data: users, total, totalPages } = result;

  return (
    <section>
      <div className="page-header">
        <h1>User accounts</h1>
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
            placeholder="Username or email"
            maxLength={100}
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {capitalize(r)}
              </option>
            ))}
          </select>
        </label>
      </form>

      {loading && users.length === 0 && !error && (
        <p className="status" role="status">
          Loading users...
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
          <p>No users match your search.</p>
        </div>
      )}

      {!error && users.length > 0 && (
        <>
          <p className="results-summary">Total users: {total}</p>
          <div className={`table-wrap${loading ? " is-loading" : ""}`} aria-busy={loading}>
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u._id === me._id;
                  return (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        {isMe ? (
                          `${capitalize(u.role)} (you)`
                        ) : (
                          <select
                            aria-label={`Role for ${u.username}`}
                            value={u.role}
                            disabled={busyId === u._id}
                            onChange={(e) => changeRole(u, e.target.value)}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {capitalize(r)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        {!isMe && (
                          <button
                            type="button"
                            className="btn btn-small btn-danger"
                            disabled={busyId === u._id}
                            onClick={() => removeUser(u)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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