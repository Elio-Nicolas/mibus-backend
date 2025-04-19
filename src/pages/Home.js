import Navbar from '../componentes/UI/Navbar';
import MapContainerComponent from '../componentes/mapas/MapContainerComponent';
import '../App.css';
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <Navbar />
      {/*<main className="map-section">
        <MapContainerComponent />
      </main>*/}

      <div>
      <button
         type="button"
         className="btn-sigin"
         onClick={() => navigate("/mapa")}
        >
         MAPA
        </button>

      </div>
      <div>
      <button
         type="button"
         className="btn-sigin"
         onClick={() => navigate("/signin")}
        >
         DATOS
        </button>

      </div>
    </div>
  );
};

export default Home;
