import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View className="flex-1 items-center justify-center bg-blue-100">
      <Pressable
        onPress={handleLogout}
        className="h-12 px-6 bg-red-600 items-center justify-center rounded shadow-md"
      >
        <Text className="text-white font-bold text-xl">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
