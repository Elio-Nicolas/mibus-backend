import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignIn.css";
import googleIcon from "../assets/Google.png";
import facebookIcon from "../assets/Facebook.png";
import imageIcon from "../assets/image.png";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [image, setImage] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formPayload = new FormData();
    formPayload.append("username", formData.username);
    formPayload.append("password", formData.password);
    if (image) {
      formPayload.append("image", image);
    }

    try {
      const res = await fetch("http://localhost:4001/api/users/signup", { // se cambio de 3001 a 4001
        method: "POST",
        body: formPayload,
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Usuario registrado");
        navigate("/signin");
      } else {
        if (data.error === "El usuario ya existe") {
          alert("⚠️ Ya existe un usuario con ese nombre");
        } else {
          alert("❌ Error: " + data.error);
        }
      }
    } catch (err) {
      console.error("Error al registrarse:", err);
      alert("❌ Error en el servidor");
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">MiBus</h1>

      <img src={imageIcon} alt="Bus" className="signup-image" />

      <form onSubmit={handleSubmit} className="signup-form" encType="multipart/form-data">
        <div className="input-group">
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            value={formData.username}
            onChange={handleChange}
            className="signup-input"
            required
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            className="signup-input"
            required
          />
        </div>

        <div className="input-group">
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleImageChange}
            className="signup-input"
          />
        </div>

        <button type="submit" className="signup-button">REGISTRARSE</button>

        <div className="divider">
          <hr />
          <span>o registrate con</span>
          <hr />
        </div>

        <div className="social-icons">
          <img src={googleIcon} alt="Google" />
          <img src={facebookIcon} alt="Facebook" />
        </div>

        <p style={{ marginTop: "1rem" }}>
          ¿Ya tenés cuenta? <Link to="/signin">Iniciá sesión</Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
