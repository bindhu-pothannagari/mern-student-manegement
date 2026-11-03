import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/services", label: "Services" },
];

const memberLinks = [
  { to: "/students", label: "Students", permission: "students:read" },
  { to: "/register", label: "Add student", permission: "students:create" },
    { to: "/courses", label: "Courses", permission: "courses:read" },
  { to: "/users", label: "Users", permission: "users:manage" },
];

const footerLinks = [
  { to: "/contact", label: "Contact Us" },
  { to: "/privacy", label: "Privacy Policy" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, checking, can, logout } = useAuth();
  const navigate = useNavigate();

  const allowed = memberLinks.filter((link) => can(link.permission));
  const links = [...publicLinks, ...allowed, ...footerLinks];
  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
    navigate("/login", { replace: true, state: { message: "You have been logged out." } });
  };

  return (
    <header className="navbar">
      <span className="brand">Student Management</span>
      <button
        className="menu-toggle"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      <nav className={open ? "nav-links open" : "nav-links"}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end onClick={close}>
            {link.label}
          </NavLink>
        ))}

        {!checking && user && (
          <>
            <NavLink to="/profile" onClick={close}>
              {user.username} ({user.role})
            </NavLink>
            <button type="button" className="nav-button" onClick={handleLogout}>
              Log out
            </button>
          </>
        )}

        {!checking && !user && (
          <>
            <NavLink to="/login" onClick={close}>
              Log in
            </NavLink>
            <NavLink to="/signup" onClick={close}>
              Sign up
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}