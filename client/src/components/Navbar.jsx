import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact Us" },
  { to: "/privacy", label: "Privacy Policy" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
          <NavLink key={link.to} to={link.to} end onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}