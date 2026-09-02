import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Admin() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-blue-100 p-6">
      <Text className="text-2xl font-bold mb-8 mt-10">Panel Admin</Text>

      <Pressable
        onPress={() => router.push("/adminPage/crear-instructor")}
        className="h-14 bg-blue-600 items-center justify-center rounded-xl mb-4"
      >
        <Text className="text-white font-bold text-lg">
          + Agregar instructor
        </Text>
      </Pressable>

      <Pressable
        onPress={handleLogout}
        className="h-12 bg-red-600 items-center justify-center rounded-xl mt-auto mb-6"
      >
        <Text className="text-white font-bold">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
