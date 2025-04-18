
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
//import Signup from "../pages/Signup";
import Home from "../pages/Home";
import Portada from "../pages/Portada";
import SignUp from "../pages/SignUp";
import MapContainerComponent from "../componentes/mapas/MapContainerComponent";
import { MapContainer } from "react-leaflet";

// Ruta protegida: solo deja pasar si está autenticado
const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem("auth") === "true";
  return isAuth ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Portada />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/mapa" element={<MapContainerComponent />} />
      {/* Ruta protegida: solo accedés si estás logueado */}
      {/*<Route 
        path="/mapa" 
        element={
          <ProtectedRoute>
            <MapContainerComponent />
          </ProtectedRoute>
        } 
      />

      {/* Redirigir por defecto */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRouter;
