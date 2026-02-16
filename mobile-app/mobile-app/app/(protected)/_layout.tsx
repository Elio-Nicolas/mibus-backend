import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function ProtectedLayout() {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userRole) {
      router.replace("/");
    }
  }, [userRole, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
