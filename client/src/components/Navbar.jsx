import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
];

const memberLinks = [
  { to: "/dashboard", label: "Dashboard", permission: "reports:read" },
  { to: "/students", label: "Students", permission: "students:read" },
  { to: "/courses", label: "Courses", permission: "courses:read" },
  { to: "/instructors", label: "Instructors", permission: "instructors:read" },
  { to: "/users", label: "Users", permission: "users:manage" },
];

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, checking, can, logout } = useAuth();
  const navigate = useNavigate();

  const links = [...publicLinks, ...memberLinks.filter((link) => can(link.permission))];
  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
    navigate("/login", { replace: true, state: { message: "You have been logged out." } });
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" className="brand" onClick={close}>
          <span className="brand-accent">STUDENT</span>MANAGEMENT
        </NavLink>

        <button
          type="button"
          className="site-menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="site-nav" className={open ? "site-nav open" : "site-nav"} aria-label="Main">
          <ul className="site-links">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end onClick={close}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {!checking && (
            <div className="site-actions">
              {user ? (
                <>
                  {can("students:create") && (
                    <NavLink to="/register" className="header-btn" onClick={close}>
                      Add student <span aria-hidden="true">+</span>
                    </NavLink>
                  )}
                  <NavLink to="/profile" className="header-btn" onClick={close} title={`${user.username} (${user.role})`}>
                    <UserIcon />
                    <span>{user.username}</span>
                  </NavLink>
                  <button type="button" className="header-btn" onClick={handleLogout}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="header-btn" onClick={close}>
                    <UserIcon />
                    <span>Log in</span>
                  </NavLink>
                  <NavLink to="/signup" className="header-btn header-btn-accent" onClick={close}>
                    Sign up
                  </NavLink>
                </>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}