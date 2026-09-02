import { router } from "expo-router";
import { View, Text, Pressable, TextInput } from "react-native";
import { Check } from "lucide-react-native";
import { useState } from "react";
import {
  Eye,
  EyeClosedIcon,
  GraduationCap,
  Mail,
  Lock,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [checked, setChecked] = useState(false);
  const [show, setShow] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email,
          password,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al iniciar sesión");
      }

      const data = await res.json();
      await login(data.accessToken, data.refreshToken);
      router.replace("/home");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-blue-100 ">
      <View className="py-6 pb-10 h-auto items-center">
        <GraduationCap className="text-blue-900" size={90} />
        <Text className="text-4xl font-bold mt-1 mb-4">PVGE</Text>
        <Text className="text-sm text-gray-700 font-medium">
          Plataforma Virtual de Gestión Educativa
        </Text>
      </View>
      <View className="p-6 h-full w-full bg-blue-50 shadow-sm">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-950 mb-2">
            Inicia sesión en PVGE
          </Text>
          <Text className="text-sm text-gray-700 mb-5">
            Si no tienes cuenta,{" "}
            <Pressable onPress={() => router.replace("/register")}>
              <Text className="underline">regístrate aquí.</Text>
            </Pressable>
          </Text>
        </View>
        <View>
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
          <View className="relative mb-2">
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
          <View className="mb-10 relative">
            <Pressable
              onPress={() => setChecked(!checked)}
              className="flex-row gap-2"
            >
              <Text className="text-sm text-gray-700">
                ¿Recordar mi contraseña?
              </Text>
              <View
                className={`w-5 h-5 rounded border items-center justify-center ${
                  checked
                    ? "bg-blue-700 border-blue-700"
                    : "bg-white border-gray-300"
                }`}
              >
                {checked && <Check size={14} color="white" />}
              </View>
            </Pressable>
            <Text className="absolute right-0 text-blue-700">
              ¿Olvidaste la contraseña?
            </Text>
          </View>
          <View className="items-center">
            <Pressable
              onPress={handleSubmit}
              className="h-12 w-3/4 bg-blue-600 items-center justify-center rounded shadow-md"
            >
              <Text className="text-white font-bold text-xl">
                Iniciar sesión
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
