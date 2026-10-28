import { NavLink } from "react-router-dom";

const links = [
    {to: "/", label: "Home"},
    {to: "/about",label: "About us"},
    {to: "/services",label: "Services"},
    {to: "/contact", label: "Contact Us"},
    {to: "/privacy", label: "Privacy Policy"},
];
export default function Navbar() {
    return(
        <header className ="navbar">
            <span className="brand"> Student Managment</span>
<nav>
    {links.map((l) => (
        <NavLink key={l.to} to={l.to} end>
            {l.label}
        </NavLink>
    ))}
</nav>
        </header>
    );
}