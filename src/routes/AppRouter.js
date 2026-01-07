import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Logins";
import Home from "../pages/Home";
import SignUp from "../pages/SignUp";
import MapContainerComponent from "../componentes/mapas/MapContainerComponent";
import React, { useState, useEffect } from "react";
import AdminPanel from "../pages/AdminPanel";


/* ================= PROTECTED ROUTE ================= */
const ProtectedRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) setIsAuthenticated(true);
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

const isAdmin = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
};

const AdminRoute = ({ children }) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.role !== "ADMIN") {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch {
    return <Navigate to="/login" replace />;
  }
};


/* ================= ROUTER ================= */
const AppRouter = () => {
  return (
    
    <Routes>
      console.log("🔥 APP ROUTER CARGADO");

         {/* 🔐 AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

        {/* 🔒 INTERNO */}

        <Route
        path="/admin"
          element={
          // <AdminRoute>
            <AdminPanel />
         // </AdminRoute>
         }
     />

      
         {/* 🌍 PUBLICO */}
      <Route path="/" element={<MapContainerComponent />} />
      <Route path="/mapa-publico" element={<MapContainerComponent />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;
