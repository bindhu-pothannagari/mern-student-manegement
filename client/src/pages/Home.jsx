import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";

export default function Home() {
  return (
    <section>
      <h1>Student Management System</h1>
      <p>Manage students, courses and instructors in one place.</p>
      <Link to="/services"><Button>View Services</Button></Link>
      <div className="grid">
        
<Card title="Students">
  Register and manage student records.
  <br />
  <Link to="/register">Register Student</Link>
</Card>

        <Card title="Courses">Organise courses and enrolments.</Card>
        <Card title="Reports">See statistics at a glance.</Card>
      </div>
    </section>
  );
}