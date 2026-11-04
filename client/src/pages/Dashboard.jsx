import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Button from "../components/Button";
import StatCard from "../components/StatCard";
import useCourseOptions from "../hooks/useCourseOptions";
import { getDashboard } from "../api/dashboardApi";
import { capitalize } from "../utils/format";

const EMPTY_FILTERS = { from: "", to: "", course: "" };

const STATUS_COLORS = {
  active: "#16a34a",
  completed: "#2563eb",
  withdrawn: "#dc2626",
  suspended: "#d97706",
};

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function courseLabel(byCourse, code) {
  const c = byCourse.find((x) => x.code === code);
  return c ? `${c.name} (${c.code})` : code;
}

export default function Dashboard() {
  const { courses } = useCourseOptions();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);

  useEffect(() => {
    if (invalidRange) return undefined;
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getDashboard(filters);
        if (!ignore) setData(res.data);
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
  }, [filters, invalidRange, reloadKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const hasFilters = Boolean(filters.from || filters.to || filters.course);
  const totals = data?.totals;
  const activeCount = data?.byStatus.find((s) => s.status === "active")?.count ?? 0;
  const statusData = (data?.byStatus ?? []).filter((s) => s.count > 0);
  const monthlyData = (data?.monthly ?? []).map((m) => ({ ...m, label: monthLabel(m.month) }));

  return (
    <section>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Dashboard filters">
        <label>
          Registered from
          <input type="date" name="from" value={filters.from} max={filters.to || undefined} onChange={handleChange} />
        </label>
        <label>
          Registered to
          <input type="date" name="to" value={filters.to} min={filters.from || undefined} onChange={handleChange} />
        </label>
        <label>
          Course
          <select name="course" value={filters.course} onChange={handleChange}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {hasFilters && (
          <button type="button" className="btn btn-small btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </button>
        )}
      </form>

      {invalidRange && (
        <p className="error-box" role="alert">
          The "from" date must be on or before the "to" date.
        </p>
      )}

      {loading && !data && !error && (
        <p className="status" role="status">
          Loading dashboard...
        </p>
      )}

      {!loading && error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
          <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
        </div>
      )}

      {data && !error && (
        <div className={loading ? "is-loading" : undefined} aria-busy={loading}>
          <div className="stat-grid">
            <StatCard
              label="Students"
              value={totals.students}
              hint={hasFilters ? "Matching the filters" : "Registered in total"}
            />
            <StatCard label="Active enrolments" value={activeCount} hint="Enrollment status: active" />
            <StatCard label="Active courses" value={totals.activeCourses} hint={`of ${totals.courses} courses`} />
            <StatCard label="Instructors" value={totals.instructors} />
          </div>

          {totals.students === 0 ? (
            <div className="empty-state">
              <p>{hasFilters ? "No students match these filters." : "No students have been registered yet."}</p>
            </div>
          ) : (
            <>
              <div className="chart-grid">
                <section className="chart-card" aria-labelledby="chart-course">
                  <h2 id="chart-course">Students per course</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.byCourse} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="code" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [value, "Students"]}
                        labelFormatter={(code) => courseLabel(data.byCourse, code)}
                      />
                      <Bar dataKey="count" fill="#f5c400" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ul className="sr-only">
                    {data.byCourse.map((c) => (
                      <li key={c.courseId}>
                        {c.name}: {c.count} students
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="chart-card" aria-labelledby="chart-status">
                  <h2 id="chart-status">Students by enrollment status</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="status" outerRadius={90} label>
                        {statusData.map((s) => (
                          <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, capitalize(name)]} />
                      <Legend formatter={(value) => capitalize(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="sr-only">
                    {data.byStatus.map((s) => (
                      <li key={s.status}>
                        {capitalize(s.status)}: {s.count} students
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section className="chart-card" aria-labelledby="chart-monthly">
                <h2 id="chart-monthly">Enrolments per month</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [value, "Students"]} />
                    <Line type="monotone" dataKey="count" stroke="#111111" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
                <ul className="sr-only">
                  {monthlyData.map((m) => (
                    <li key={m.month}>
                      {m.label}: {m.count} students
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <section className="chart-card" aria-labelledby="recent-heading">
            <h2 id="recent-heading">Recently registered students</h2>
            {data.recentStudents.length === 0 ? (
              <p className="empty-state">No recent registrations.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentStudents.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <Link to={`/students/${s._id}`}>{s.fullName}</Link>
                        </td>
                        <td>{s.course ? `${s.course.name} (${s.course.code})` : "-"}</td>
                        <td>
                          <span className={`status-badge status-enrol-${s.enrollmentStatus}`}>
                            {capitalize(s.enrollmentStatus)}
                          </span>
                        </td>
                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
