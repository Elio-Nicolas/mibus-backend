import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("⚠️ Tenés que iniciar sesión para acceder.");
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
