import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPublicCourses } from "../api/publicApi";
import { formatDuration, formatFee } from "../utils/format";

const CARD_TONES = ["#2f3a2f", "#3b3328", "#25313d", "#3a2c35", "#2e2e2e", "#33302a"];

function CapIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 18 24 8l20 10-20 10L4 18Z" />
      <path d="M12 22v10c0 3 5.4 6 12 6s12-3 12-6V22" />
      <path d="M44 18v12" />
    </svg>
  );
}

const STEPS = [
  {
    title: "Choose a Course",
    text: "Browse programmes with their duration and fees, and pick the right fit.",
    icon: (
      <svg viewBox="0 0 64 64" width="72" height="72" fill="none" strokeWidth="2" aria-hidden="true">
        <rect x="10" y="12" width="32" height="40" rx="2" stroke="#111" />
        <path d="M17 22h18M17 30h18M17 38h10" stroke="#111" />
        <circle cx="44" cy="40" r="9" fill="#f5c400" stroke="#111" />
        <path d="m51 47 6 6" stroke="#111" />
      </svg>
    ),
  },
  {
    title: "Register the Student",
    text: "Add the student's details and photo. A confirmation email is sent automatically.",
    icon: (
      <svg viewBox="0 0 64 64" width="72" height="72" fill="none" strokeWidth="2" aria-hidden="true">
        <circle cx="26" cy="22" r="9" fill="#f5c400" stroke="#111" />
        <path d="M10 50c0-9 7-15 16-15s16 6 16 15" stroke="#111" />
        <path d="M48 20v16M40 28h16" stroke="#111" />
      </svg>
    ),
  },
  {
    title: "Track Progress",
    text: "Follow enrolment status, documents and reports from one dashboard.",
    icon: (
      <svg viewBox="0 0 64 64" width="72" height="72" fill="none" strokeWidth="2" aria-hidden="true">
        <path d="M10 52h44" stroke="#111" />
        <rect x="14" y="34" width="8" height="18" fill="#f5c400" stroke="#111" />
        <rect x="28" y="24" width="8" height="28" stroke="#111" />
        <rect x="42" y="14" width="8" height="38" fill="#f5c400" stroke="#111" />
      </svg>
    ),
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");

  useEffect(() => {
    let ignore = false;
    getPublicCourses()
      .then((res) => {
        if (!ignore) setCourses(res.data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (course) params.set("course", course);
    const qs = params.toString();
    navigate(`/students${qs ? `?${qs}` : ""}`);
  };

  const ctaTarget = !user ? "/signup" : can("reports:read") ? "/dashboard" : "/students";
  const ctaLabel = !user ? "Create an account" : can("reports:read") ? "Go to dashboard" : "View students";

  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <p className="hero-sticker">
            Which course are
            <br />
            you looking for?
          </p>
          <h1 id="hero-title">Find the Right Course for Every Student</h1>

          {courses.length > 0 && (
            <ul className="hero-categories" aria-label="Courses">
              {courses.slice(0, 6).map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    className={course === c._id ? "active" : undefined}
                    aria-pressed={course === c._id}
                    onClick={() => setCourse(course === c._id ? "" : c._id)}
                  >
                    <CapIcon />
                    <span>{c.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="hero-search" onSubmit={handleSearch} role="search">
            <label>
              Search students
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or email"
                maxLength={100}
              />
            </label>
            <label>
              Course
              <select value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="home-section" aria-labelledby="courses-title">
        <div className="section-inner">
          <div className="section-head">
            <h2 id="courses-title">Popular Courses</h2>
            <p>Programmes currently open for admission.</p>
          </div>

          {loading && (
            <p className="status" role="status">
              Loading courses...
            </p>
          )}
          {!loading && error && (
            <p className="error-box" role="alert">
              Courses could not be loaded right now.
            </p>
          )}
          {!loading && !error && courses.length === 0 && (
            <p className="empty-state">No courses are open for admission yet.</p>
          )}

          {courses.length > 0 && (
            <div className="course-grid">
              {courses.slice(0, 5).map((c, i) => (
                <article key={c._id} className="course-card" style={{ "--tone": CARD_TONES[i % CARD_TONES.length] }}>
                  <span className="card-badge">Admissions open</span>
                  <span className="card-art" aria-hidden="true">
                    {c.code}
                  </span>
                  <div className="card-info">
                    <h3>{c.name}</h3>
                    <p>{formatDuration(c.durationMonths)}</p>
                  </div>
                  <span className="card-price">{formatFee(c.fee)}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-section home-steps" aria-labelledby="steps-title">
        <div className="section-inner">
          <div className="section-head">
            <h2 id="steps-title">How It Works</h2>
            <p>From choosing a course to tracking progress in three steps.</p>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="step-number">{i + 1}</span>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cta-band" aria-label="Get started">
        <div className="section-inner cta-inner">
          <p>Ready to manage your students in one place?</p>
          <Link className="btn btn-light" to={ctaTarget}>
            {ctaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}