import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Forbidden from "../pages/Forbidden";

export default function ProtectedRoute({ permission }) {
  const { user, checking, can } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <p className="status" role="status">
        Checking your session...
      </p>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (permission && !can(permission)) {
    return <Forbidden />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user, checking } = useAuth();
  if (checking) return null;
  if (user) return <Navigate to="/students" replace />;
  return <Outlet />;
}