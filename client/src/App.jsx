import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute, { GuestRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import StudentList from "./pages/StudentList";
import StudentDetails from "./pages/StudentDetails";
import StudentRegistration from "./pages/StudentRegistration";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<ProtectedRoute permission="students:read" />}>
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/:id" element={<StudentDetails />} />
        </Route>

        <Route element={<ProtectedRoute permission="students:create" />}>
          <Route path="/register" element={<StudentRegistration key="create" />} />
        </Route>

        <Route element={<ProtectedRoute permission="students:update" />}>
          <Route path="/students/:id/edit" element={<StudentRegistration key="edit" />} />
        </Route>

        <Route element={<ProtectedRoute permission="users:manage" />}>
          <Route path="/users" element={<Users />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}