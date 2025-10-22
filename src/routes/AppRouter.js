import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Logins";
import Home from "../pages/Home";
import Portada from "../pages/Portada";
import SignUp from "../pages/SignUp";
import MapContainerComponent from "../componentes/mapas/MapContainerComponent";
import { MapContainer } from "react-leaflet";

import React, { useState, useEffect } from 'react';


// Ruta protegida *solo deja pasar si está autenticado
const ProtectedRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem("username") || sessionStorage.getItem("username");
    if (username) {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) {
    return <div>Cargando...</div>; // o un spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Portada />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/home" element={<Home/>}/>
      
      {/* Ruta protegida: solo accedés si estás logueado */}
      <Route 
        path="/mapa" 
        element={
          <ProtectedRoute>
            <MapContainerComponent />
          </ProtectedRoute>
        } 
      />

      {/* Redirigir por defecto */}
      <Route path="*" element={<Navigate to="/signup" />} />
    </Routes>
  );
};

export default AppRouter;
