import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import BrandFooter from "./componentes/BrandFooter";

function App() {
  return (
    <>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>

      <BrandFooter />
    </>
  );
}

export default App;

