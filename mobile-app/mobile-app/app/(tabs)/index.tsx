import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView from "react-native-maps";
//import { useState } from "react";
import { Modal } from "react-native";
import AdminHeader from "@/components/AdminHeader";
import paradas from "@/data/paradas.json";
import { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

type Stop = {
  id: string;
  latitude: number;
  longitude: number;
  line: string;
};

export default function MapScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [closestStop, setClosestStop] = useState<any | null>(null);

  
  const [region, setRegion] = useState({
    latitude: -33.675,
    longitude: -65.458,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const getMarkerSize = () => {
    if (region.latitudeDelta > 0.1) return 6;   // lejos
    if (region.latitudeDelta > 0.05) return 10; // medio
    if (region.latitudeDelta > 0.02) return 14; // cerca
    return 18; // muy cerca
  };

  // ==================== MI UBICACION/ UBICACION USUARIO ======================= //
  useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("Permiso denegado");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);
  })();
}, []);

// ======================= ENCUENTRA LA PARADA MAS CERCANA ======================== //
useEffect(() => {
  if (!userLocation || !selectedLine) return;

  const stops = paradas.features.filter(
    (f: any) => f.properties.network === selectedLine
  );

  let minDistance = Infinity;
  let nearest = null;

  stops.forEach((stop: any) => {
    const [lon, lat] = stop.geometry.coordinates;

    const distance = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = stop;
    }
  });

  setClosestStop(nearest);
}, [userLocation, selectedLine]);

// ======================= FUNCION PARA CALCULAR DISTANCIA ======================== //
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


  return (
    <View style={styles.container}>
      <AdminHeader city="Villa Mercedes" weatherCode={2} />
      <MapView
  style={styles.map}
  initialRegion={region}
  onRegionChangeComplete={(reg) => setRegion(reg)}
  showsUserLocation={true}
>

  {paradas.features
  .filter((feature: any) => {
    if (!selectedLine) return false;
    return feature.properties.network === selectedLine;
  })
  .map((feature: any) => {
    const [longitude, latitude] = feature.geometry.coordinates;

    return (
      <Marker
  key={feature.id}
  coordinate={{ latitude, longitude }}
>
  <View
    style={{
      width: getMarkerSize(),
      height: getMarkerSize(),
      borderRadius: 50,
      backgroundColor:
        closestStop?.id === feature.id
          ? "#2563eb"   // azul parada más cercana
          : "#16a34a",  // verde normal
      borderWidth: 1,
      borderColor: "white",
    }}
  />
</Marker>

    );
  })}

</MapView>


      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Líneas</Text>
      </TouchableOpacity>

      {/* Paradas lineas */}
     
      {/* Modal tipo drawer inferior */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Líneas disponibles</Text>

            <View style={styles.lineContainer}>
              {["A", "E", "Z E", "Z O"].map((linea) => (
                <TouchableOpacity
                  key={linea}
                  style={styles.lineButton}
                  onPress={() => {
                   setSelectedLine(prev => prev === linea ? null : linea);
                   setModalVisible(false);
                  }}

                >
                  <Text style={{ color: "white" }}>{linea}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={{ color: "white" }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  floatingButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  lineContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  lineButton: {
    backgroundColor: "green",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  closeBtn: {
    marginTop: 20,
    alignItems: "center",
  },
});
