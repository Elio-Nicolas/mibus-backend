import React, { useEffect, useState } from "react";

const AdminPanel = () => {
  //const token = localStorage.getItem("token");
  //const role = localStorage.getItem("role");


  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingRole, setEditingRole] = useState("");
  const [editingUnit, setEditingUnit] = useState("");
  const [adding, setAdding] = useState(false);

  const stored = localStorage.getItem("user");
  const data = stored ? JSON.parse(stored) : null;

  const token = data?.token || null;
  const user = data;


  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "PASAJERO",
  });

  // ================= SESIÓN =================
  //const stored = localStorage.getItem("user");
  //const user = stored ? JSON.parse(stored) : null;
  //const token = user?.token || null;

  // ================= FETCH =================
  useEffect(() => {
  fetch("http://localhost:4001/api/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("No autorizado");
      }
      return res.json();
    })
    .then(data => {
      console.log("USERS DESDE API:", data);
      setUsers(data);
    })
    .catch(err => {
      console.error("Error cargando usuarios:", err);
    });
}, [token]);



  /* ================= FILTRO ================= */
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= EDITAR ================= */
  const startEdit = (u) => {
  setEditingId(u._id);
  setEditingRole(u.role);
  setEditingUnit(u.assignedUnit || "");
};

  const cancelEdit = () => {
    setEditingId(null);
    setEditingRole("");
  };

  const saveUnit = async (id) => {
  await fetch( `http://localhost:4001/api/admin/users/${id}/unit`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ unit: editingUnit }),
    }
  );

  setUsers(prev =>
    prev.map(u =>
      u._id === id ? { ...u, assignedUnit: editingUnit } : u
    )
  );
};

  const saveRole = async (id) => {
    await fetch(`http://localhost:4001/api/admin/users/${id}/role`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: editingRole }),
      }
    );

    setUsers(prev =>
      prev.map(u => u._id === id ? { ...u, role: editingRole } : u)
    );

    cancelEdit();
  };

  /* ================= ELIMINAR ================= */
  const deleteUser = async (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;

    await fetch(`http://localhost:4001/api/admin/users/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setUsers(prev => prev.filter(u => u._id !== id));
  };

  /* ================= AGREGAR ================= */
  const addUser = async () => {
    const res = await fetch("http://localhost:4001/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newUser),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }

    setUsers(prev => [...prev, data]);
    setAdding(false);
    setNewUser({ username: "", password: "", role: "PASAJERO" });
  };


   if (!user || !token) {
    return <h3>No autorizado</h3>;
  }

  /* ================= UI ================= */
  return (
    <div style={{ padding: 20 }}>
      <h2>Panel Administrador</h2>

      <input
        placeholder="Buscar..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12, padding: 8, width: 300 }}
      />
      <div style={{ marginBottom: 12 }}>
          <button onClick={() => setAdding(true)}>➕ Agregar usuario</button>
      </div>

      <table border="1" cellPadding="8" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Unidad</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {adding && (
            <tr>
              <td>
                <input
                  placeholder="Usuario"
                  value={newUser.username}
                  onChange={e =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                />
              </td>

              <td>
                <select
                   value={newUser.role}
                   onChange={e =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option>ADMIN</option>
                  <option>INSPECTOR</option>
                  <option>USUARIO</option>
                  <option>CHOFER</option>
                  <option>PASAJERO</option>
                </select>

              </td>

              <td>
                {newUser.role === "CHOFER" ? (
                 <input
                   placeholder="Unidad"
                   value={newUser.assignedUnit || ""}
                   onChange={e =>
                   setNewUser({ ...newUser, assignedUnit: e.target.value })
                   }
                   style={{ width: 60 }}
                 />
                 ) : (
                  "-"
                  )}
              </td>

              <td>
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={e =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
                <button onClick={addUser}>💾</button>
                <button onClick={() => setAdding(false)}>❌</button>
              </td>
            </tr>
          )}

          {filteredUsers.map(u => {
            const editing = editingId === u._id;

            return (
              <tr key={u._id}>
                <td>{u.username}</td>

                <td>
                 {editing ? (
                 <select
                  value={editingRole}
                  onChange={e => setEditingRole(e.target.value)}
                 >
                  <option>ADMIN</option>
                  <option>INSPECTOR</option>
                  <option>USUARIO</option>
                  <option>CHOFER</option>
                  <option>PASAJERO</option>
                </select>
              ) : u.role}
           </td>

           <td>
            {u.role === "CHOFER" ? (
             editing ? (
             <input
             value={editingUnit}
             placeholder="Ej: 13"
             onChange={e => setEditingUnit(e.target.value)}
             style={{ width: 60 }}
            />
           ) : (
            u.assignedUnit || "-"
           )
          ) : (
          "-"
         )}
         </td>

          <td>
          {editing ? (
            <>
             <button onClick={() => { saveRole(u._id);
               if (editingRole === "CHOFER") { saveUnit(u._id);} }}
             > 💾 </button>
             <button onClick={cancelEdit}>❌</button>
           </>
          ) : (
           <>
             <button onClick={() => startEdit(u)}>✏️</button>
             <button onClick={() => deleteUser(u._id)}>🗑</button>
            </>
           )}
          </td>
         </tr>

            );
          })}

        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
