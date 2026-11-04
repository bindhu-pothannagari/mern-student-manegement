const YEAR = new Date().getFullYear();

export default function Footer(){
    return(
        <footer className="footer">
            <p> © {YEAR} Student Management System</p>
        </footer>
    );
}