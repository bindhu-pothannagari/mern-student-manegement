import {Link} from "react-router-dom";
import Button from "../components/Button";
import Card from"../components/Card";

export default function Home() {
    return (
        <section>
            <h1>Student Managment System</h1>
            <p>Manage students,courses and instructions in one place.</p>
            <Link to="/services"><Button>View Services</Button></Link>
        </section>
    );
}