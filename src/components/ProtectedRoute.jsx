// components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router";
import Cookies from "js-cookie";

const ProtectedRoute = () => {
    // Read the token cookie (or replace with your auth state/context)
    const token = Cookies.get("token");

    if (!token) {
        // Redirect unauthenticated users to login
        return <Navigate to="/login" replace />;
    }

    // Render protected child routes
    return <Outlet />;
};

export default ProtectedRoute;