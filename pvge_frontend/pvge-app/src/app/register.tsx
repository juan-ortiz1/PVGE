import { router } from "expo-router";
import { ScrollView } from "react-native";
import {
  Modal,
  FlatList,
  View,
  Text,
  Pressable,
  TextInput,
} from "react-native";
import { useState } from "react";
import {
  Eye,
  EyeClosedIcon,
  GraduationCap,
  Mail,
  AtSign,
  Lock,
} from "lucide-react-native";

const countries = [
  { name: "Argentina", code: "AR" },
  { name: "Chile", code: "CL" },
  { name: "Colombia", code: "CO" },
  { name: "México", code: "MX" },
  { name: "Perú", code: "PE" },
];

export default function Register() {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  const [nickname, setNickname] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  type Pais = { name: string; code: string };
  const [pais, setPais] = useState<Pais | null>(null);

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/estudiantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          nombre,
          apellido,
          correo: email,
          password,
          pais: pais?.name,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al registrarse");
      }

      const data = await res.json();
      router.replace("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView className="flex-1 bg-blue-100 ">
      <View className="py-6 pb-10 h-auto items-center">
        <GraduationCap className="text-blue-900" size={90} />
        <Text className="text-4xl font-bold mt-1 mb-4">PVGE</Text>
        <Text className="text-sm text-gray-700 font-medium">
          Plataforma Virtual de Gestión Educativa
        </Text>
      </View>
      <View className="p-6 h-auto w-full bg-blue-50 shadow-sm">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-950 mb-2">
            Regístrate en PVGE
          </Text>
          <Text className="text-sm text-gray-700 mb-5">
            Si ya tienes cuenta,{" "}
            <Pressable onPress={() => router.replace("/")}>
              <Text className="underline">inicia sesión aquí.</Text>
            </Pressable>
          </Text>
        </View>
        <>
          <Text className="font-bold text-gray-950 mb-2">
            Nombre de usuario
          </Text>
          <View className="relative">
            <TextInput
              className="w-full p-3 pl-11 bg-white border border-gray-200 rounded-xl mb-4"
              placeholder="alexito_morgan"
              value={nickname}
              onChangeText={setNickname}
            />
            <AtSign className="absolute left-3 top-1/2 -translate-y-5 text-gray-400" />
          </View>
          <Text className="font-bold text-gray-950 mb-2">Nombres</Text>
          <TextInput
            className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-4"
            placeholder="Alex David"
            value={nombre}
            onChangeText={setNombre}
          />
          <Text className="font-bold text-gray-950 mb-2">Apellidos</Text>
          <TextInput
            className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-4"
            placeholder="Morgan Rogers"
            value={apellido}
            onChangeText={setApellido}
          />
          <Text className="font-bold text-gray-950 mb-2">
            Correo electrónico
          </Text>
          <View className="relative">
            <TextInput
              keyboardType="email-address"
              className="w-full p-3 pl-11 bg-white border border-gray-200 rounded-xl mb-4"
              placeholder="alex.morgan@pvge.edu"
              value={email}
              onChangeText={setEmail}
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-5 text-gray-400" />
          </View>
          <Text className="font-bold text-gray-950 mb-2">Contraseña</Text>
          <View className="relative">
            <TextInput
              secureTextEntry={!show}
              className="w-full p-3 pl-11 bg-white border border-gray-200 rounded-xl mb-4"
              placeholder="*******"
              value={password}
              onChangeText={setPassword}
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-5 text-gray-400" />
            <Pressable
              onPress={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-5 text-gray-400"
            >
              {show ? <EyeClosedIcon /> : <Eye />}
            </Pressable>
          </View>
          <Text className="font-bold text-gray-950 mb-2">País</Text>
          <View className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-6">
            <Pressable onPress={() => setVisible(true)}>
              <Text>
                {pais ? (
                  pais.name
                ) : (
                  <Text className="text-gray-500">Seleccionar país...</Text>
                )}
              </Text>
            </Pressable>

            <Modal visible={visible} transparent animationType="slide">
              <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-2xl max-h-96">
                  <FlatList
                    data={countries}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          setPais(item);
                          setVisible(false);
                        }}
                        className="p-4 border-b border-gray-100"
                      >
                        <Text>{item.name}</Text>
                      </Pressable>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </View>
          <View className="items-center mb-1">
            <Pressable
              onPress={handleSubmit}
              className="h-12 w-3/4 bg-blue-600 items-center justify-center rounded shadow-md"
            >
              <Text className="text-white font-bold text-xl">Registrarse</Text>
            </Pressable>
          </View>
        </>
      </View>
    </ScrollView>
  );
}
