import { router } from "expo-router";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function CrearInstructor() {
  const { accessToken } = useAuth();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [tier, setTier] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/instructores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nombre,
          correo: email,
          password,
          disciplina,
          tier: Number(tier),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.message || "Error al crear instructor");
      }

      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-blue-100 p-6">
      <Text className="text-2xl font-bold mb-8 mt-10">Nuevo instructor</Text>

      <Text className="font-bold text-gray-950 mb-2">Nombre</Text>
      <TextInput
        className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-4"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text className="font-bold text-gray-950 mb-2">Correo</Text>
      <TextInput
        keyboardType="email-address"
        className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-4"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="font-bold text-gray-950 mb-2">Contraseña</Text>
      <TextInput
        secureTextEntry
        className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-4"
        value={password}
        onChangeText={setPassword}
      />

      <Text className="font-bold text-gray-950 mb-2">Disciplina</Text>
      <TextInput
        className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-4"
        value={disciplina}
        onChangeText={setDisciplina}
      />

      <Text className="font-bold text-gray-950 mb-2">Tier</Text>
      <TextInput
        keyboardType="numeric"
        className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-6"
        value={tier}
        onChangeText={setTier}
      />

      <Pressable
        onPress={handleSubmit}
        className="h-12 bg-blue-600 items-center justify-center rounded-xl"
      >
        <Text className="text-white font-bold">Crear instructor</Text>
      </Pressable>
    </View>
  );
}
