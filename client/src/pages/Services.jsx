import Card from"../components/Card";
export default function Services(){
    return(
        <section>
            <h1>Services</h1>
            <div className="grid">
                <Card title="Registration">Add new students with validated details.</Card>
                <Card title ="Records">Search, edit and delete student records.</Card>
                <Card title="Courses">Link students to the courses they take.</Card>

            </div>
        </section>
    );
}