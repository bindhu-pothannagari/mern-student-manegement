import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <section className="empty-state">
      <h1>Access denied</h1>
      <p>Your account does not have permission to view this page.</p>
      <Link className="btn" to="/students">
        Back to students
      </Link>
    </section>
  );
}