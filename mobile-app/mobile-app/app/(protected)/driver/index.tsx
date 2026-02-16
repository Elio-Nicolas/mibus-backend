import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ScrollView 
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";

export default function DriverScreen() {
  const { logout } = useAuth();

  // 🔹 Estos vendrían de tu backend después
  const [chofer, setChofer] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sharing, setSharing] = useState(false);

  // ⬇️ SIMULACIÓN (después lo conectamos al backend)
  useEffect(() => {
    const fakeChofer = {
      username: "elo",
      assignedUnit: "3",
      assignedLine: "A",
    };

    const fakeEvents = [
      { type: "INICIO", time: new Date().toISOString() },
      { type: "CIERRE", time: new Date(Date.now() - 3600000).toISOString() },
    ];

    setChofer(fakeChofer);
    setEvents(fakeEvents);
  }, []);

  const unitStatus =
    activeSession && !activeSession?.endTime
      ? "EN SERVICIO"
      : "SIN SERVICIO";

  if (!chofer) {
    return (
      <View style={styles.center}>
        <Text>Cargando chofer...</Text>
      </View>
    );
  }

  return (
  <FlatList
    style={styles.container}
    data={events}
    keyExtractor={(_, index) => index.toString()}
    renderItem={({ item }) => (
      <View style={styles.row}>
        <Text style={styles.eventType}>{item.type}</Text>
        <Text>{new Date(item.time).toLocaleTimeString()}</Text>
        <Text>{new Date(item.time).toLocaleDateString()}</Text>
      </View>
    )}
    ListHeaderComponent={
      <>
        {/* HEADER SIMPLE */}
        <Text style={styles.title}>Panel Chofer</Text>

        {/* INFO */}
        <View style={styles.card}>
          <Text>
            <Text style={styles.bold}>Nombre:</Text> {chofer.username}
          </Text>
          <Text>
            <Text style={styles.bold}>Unidad:</Text> {chofer.assignedUnit}
          </Text>
          <Text>
            <Text style={styles.bold}>Línea:</Text> {chofer.assignedLine}
          </Text>

          <Text>
            <Text style={styles.bold}>Estado: </Text>
            <Text
              style={{
                color:
                  unitStatus === "EN SERVICIO" ? "#4ade80" : "#f87171",
                fontWeight: "bold",
              }}
            >
              {unitStatus}
            </Text>
          </Text>

          <Text>
            <Text style={styles.bold}>Tiempo en recorrido: </Text>
            {elapsedTime ? `${elapsedTime}s` : "00:00"}
          </Text>
        </View>

        {/* BOTONES */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setSharing(!sharing)}
          >
            <Text style={styles.buttonText}>
              {sharing ? "Detener ubicación" : "Compartir ubicación"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Iniciar recorrido</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonDanger}>
            <Text style={styles.buttonText}>Finalizar recorrido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
          >
            <Text style={styles.buttonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* TÍTULO EVENTOS */}
        <Text style={styles.sectionTitle}>Últimos eventos</Text>
      </>
    }
  />
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDanger: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  eventType: {
    fontWeight: "bold",
  },
});
