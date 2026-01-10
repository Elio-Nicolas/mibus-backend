import React, { useEffect, useState } from "react";

const InspectorPanel = () => {
  const token = localStorage.getItem("token");
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4001/api/inspector/drivers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setDrivers(Array.isArray(data) ? data : []));
  }, [token]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel Inspector</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Chofer</th>
            <th>Unidad</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr key={d._id}>
              <td>{d.username}</td>
              <td>{d.assignedUnit || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InspectorPanel;
