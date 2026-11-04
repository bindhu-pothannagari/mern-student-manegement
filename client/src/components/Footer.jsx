import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <p className="brand">
            <span className="brand-accent">STUDENT</span>MANAGEMENT
          </p>
          <p>Students, courses, instructors and enrolments, managed in one place.</p>
        </div>

        <nav aria-label="Explore">
          <h2>Explore</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/services">Services</Link></li>
          </ul>
        </nav>

        <nav aria-label="Support">
          <h2>Support</h2>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/login">Log in</Link></li>
          </ul>
        </nav>

        <div>
          <h2>Contact</h2>
          <p>Hyderabad, Telangana</p>
          <p>support@example.com</p>
        </div>
      </div>
      <p className="footer-bottom">© {YEAR} Student Management System</p>
    </footer>
  );
}