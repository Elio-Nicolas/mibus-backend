import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import busImage from "../assets/image.png";

const Login = () => {
  const navigate = useNavigate();
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("https://mibus-frontend.onrender.com/api/users/signin", { // se cambio de 3001 a 4001

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        username: form.username // si o si por que no me traia el nombre del usuario
      });

      const data = await res.json();
      console.log("Data recibida:", data);

      if (res.ok) {
        alert(` Usuario encontrado: ${data.username}`);
        // Guardar token
        if (remember) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          localStorage.setItem("image", data.image); 
          localStorage.setItem("userId", data.userId);

        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("username", data.username);
          sessionStorage.setItem("image", data.image);
          sessionStorage.setItem("userId", data.userId); 
        }

        //alert("Inicio de sesión exitoso");
        navigate("/mapa");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      alert("Error en el servidor");
    }
  };

  return (
    <div className="login-container">
      <h2 className="titulo">MiBus</h2>

      <img src={busImage} alt="Bus" className="bus-image" />

      <form onSubmit={handleLogin} className="login-form">
        <div className="input-group">
          <label> </label>
          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label> </label>
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={() => setRemember(!remember)}
          />
          <label htmlFor="remember">Recordar Contraseña</label>
        </div>

        <button type="submit" className="btn-login">
          CONTINUAR
        </button>

         {/* BOTÓN PARA IR A SIGNIN */}
        <button
         type="button"
         className="btn-sigin"
         onClick={() => navigate("/signin")}
        >
         CREAR CUENTA
        </button>

      </form>
    </div>
  );
};

export default Login;
