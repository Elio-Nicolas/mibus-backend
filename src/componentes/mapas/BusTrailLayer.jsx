import { Marker } from "react-leaflet";
import L from "leaflet";

const BusTrailLayer = ({ unitId, points, color }) => {
  if (!points || points.length === 0) return null;

  return (
    <>
      {points.map((pos, idx) => (
        <Marker
          key={`${unitId}-trail-${idx}`}
          position={pos}
          icon={L.divIcon({
            className: "",
            html: `<div style="
              width: 8px;
              height: 8px;
              background: ${color};
              opacity: ${0.2 + idx * 0.15};
              border-radius: 50%;
            "></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          })}
          interactive={false}
        />
      ))}
    </>
  );
};

export default BusTrailLayer;
