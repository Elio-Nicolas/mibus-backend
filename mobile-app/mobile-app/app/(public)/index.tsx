import { View, StyleSheet, TouchableOpacity, Text, Animated, Modal } from "react-native";
import MapView, { Marker } from "react-native-maps";
import AdminHeader from "@/components/AdminHeader";
import paradas from "@/data/paradas.json";
import * as Location from "expo-location";
import { useEffect, useState, useRef } from "react";

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
  const scaleAnim = useState(new Animated.Value(1))[0];
  const [showPopup, setShowPopup] = useState(false);
  const popupAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [closestStop, setClosestStop] = useState<{
    stop: any;
    distance: number;
  } | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState({
    latitude: -33.675,
    longitude: -65.458,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const getMarkerSize = () => {
    if (region.latitudeDelta > 0.1) return 6;
    if (region.latitudeDelta > 0.05) return 10;
    if (region.latitudeDelta > 0.02) return 14;
    return 18;
  };

  // ==================== UBICACION USUARIO ======================= //
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

  // ======================= PARADA MAS CERCANA ======================== //
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

    if (nearest) {
      setClosestStop({
        stop: nearest,
        distance: minDistance,
      });
    //  setShowPopup(true);
    }
  }, [userLocation, selectedLine]);

  // ======================= ANIMACION PULSE ======================== //
  useEffect(() => {
  Animated.loop(
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    })
  ).start();
}, []);

  // ======================= CALCULAR DISTANCIA ======================== //
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
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

  // ======================= ANIMACION TIPO GOOGLE ======================== //
  useEffect(() => {
  if (showPopup) {
    Animated.spring(popupAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  } else {
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }
}, [showPopup]);


  // ======================== RENDER ============================ //
  return (
    <View style={styles.container}>
     <AdminHeader city="Villa Mercedes" weatherCode={2} />
      <MapView
        ref={mapRef}
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
            const isClosest = closestStop?.stop?.id === feature.id;

            return (
  <Marker
  key={String(feature.id)}
  coordinate={{ latitude, longitude }}
  onPress={async () => {
    if (!isClosest) return;

    const map = mapRef.current;
    if (!map) return;

    const [longitude, latitude] = feature.geometry.coordinates;

    const point = await map.pointForCoordinate({
      latitude,
      longitude,
    });

    setPopupPos({ x: point.x, y: point.y });
    setShowPopup(true);
  }}
>
  <View style={styles.touchArea}>
    
    {/* MARKER CON PULSE */}
    {isClosest && (
      <Animated.View
        style={[
          styles.pulse,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 0],
            }),
          },
        ]}
      />
    )}

    <View
      style={[
        styles.marker,
        { backgroundColor: isClosest ? "red" : "green" },
      ]}
    />

  </View>
</Marker>

            );
          })}
      </MapView>

      {/* POPUP PEGADO AL MARKER */}
 {closestStop && popupPos && showPopup && (
  <Animated.View
    style={[
      styles.popupContainer,
      {
        left: popupPos.x - 100,
        top: popupPos.y - 110,
        opacity: popupAnim,
        transform: [
          {
            scale: popupAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
          {
            translateY: popupAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      },
    ]}
  >
    <View style={styles.popup}>
      <Text style={styles.popupTitle}>
        {closestStop.stop.properties.name || "Parada"}
      </Text>

      <Text style={styles.popupDistance}>
        📍 {(closestStop.distance * 1000).toFixed(0)} metros
      </Text>

      <TouchableOpacity
        style={styles.closePopupBtn}
        onPress={() => setShowPopup(false)}
      >
        <Text style={{ color: "white", fontSize: 12 }}>Cerrar</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.arrow} />
  </Animated.View>
)}

      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Líneas</Text>
      </TouchableOpacity>

      {/* Modal tipo drawer inferior */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Líneas disponibles</Text>

            <View style={styles.lineContainer}>
              {["A", "E", "Z E", "Z O"].map((linea) => (
                <TouchableOpacity
                  key={linea}
                  style={styles.lineButton}
                  onPress={() => {
                    setSelectedLine((prev) => (prev === linea ? null : linea));
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ color: "white" }}>{linea}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  bottom: 30,
  alignSelf: "center",
  backgroundColor: "#007AFF",
  paddingVertical: 14,
  paddingHorizontal: 30,
  borderRadius: 30,
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

popupContainer: {
  position: "absolute",
  alignItems: "center",
},

popup: {
  width: 200,
  backgroundColor: "#fff",
  borderRadius: 20,
  paddingVertical: 14,
  paddingHorizontal: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 12,
},

popupTitle: {
  fontSize: 15,
  fontWeight: "600",
  marginBottom: 6,
},

popupDistance: {
  fontSize: 13,
  color: "#666",
  marginBottom: 10,
},

closePopupBtn: {
  backgroundColor: "#34C759",
  paddingVertical: 6,
  borderRadius: 10,
  alignItems: "center",
},

arrow: {
  width: 18,
  height: 18,
  backgroundColor: "#fff",
  transform: [{ rotate: "45deg" }],
  marginTop: -9,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 6,
},

marker: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 3,
  borderColor: "white",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},

touchArea: {
  width: 60,
  height: 60,
  justifyContent: "center",
  alignItems: "center",
},

pulse: {
  position: "absolute",
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "red",
},

});
