import { View, Text, Button } from "react-native";
import { useAuth } from "../../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function DriverScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(public)"); // vuelve al mapa
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Panel Chofer</Text>
      <Button title="Cerrar sesión Inspector" onPress={handleLogout} />
    </View>
  );
}
