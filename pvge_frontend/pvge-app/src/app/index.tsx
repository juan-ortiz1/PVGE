import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const fieldClass = (err?: string) =>
  `flex-row items-center bg-gray-50 border rounded-xl px-3 h-12 ${
    err ? "border-red-400" : "border-gray-200"
  }`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <Text className="text-red-600 text-xs mt-1">{msg}</Text> : null;

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setServerError(null);
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Ingresa tu correo";
    if (!password) e.password = "Ingresa tu contraseña";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email.trim(), password }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Correo o contraseña incorrectos"
            : data?.message || "Error al iniciar sesión",
        );
      }

      await login(data.accessToken, data.refreshToken, data.rol);
      router.replace(data.rol === "ADMIN" ? "/admin" : "/home");
    } catch (err: any) {
      console.error(err);
      setServerError(err.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-blue-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Marca */}
        <View className="items-center pt-14 pb-10">
          <Image
            style={{ width: 110, height: 110 }}
            source={require("../../assets/images/logo.png")}
            resizeMode="contain"
          />
          <Text className="text-4xl font-bold text-gray-950 mt-1">Mentum</Text>
          <Text className="text-sm text-gray-700 font-medium mt-1">
            Cada clase, cada logro, cada paso
          </Text>
        </View>

        {/* Formulario */}
        <View className="flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-10">
          <Text className="text-xl font-bold text-gray-950 text-center">
            Inicia sesión
          </Text>
          <Text className="text-sm text-gray-700 text-center mt-1 mb-6">
            ¿No tienes cuenta?{" "}
            <Text
              onPress={() => router.replace("/register")}
              className="text-blue-700 font-bold"
            >
              Regístrate aquí
            </Text>
          </Text>

          <Text className="font-bold text-gray-700 mb-2 text-sm">
            Correo electrónico
          </Text>
          <View className={fieldClass(errors.email)}>
            <Mail size={18} color="#9ca3af" />
            <TextInput
              placeholder="alex.morgan@mentum.edu"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              className="flex-1 ml-3 text-gray-900"
            />
          </View>
          <FieldError msg={errors.email} />

          <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
            Contraseña
          </Text>
          <View className={fieldClass(errors.password)}>
            <Lock size={18} color="#9ca3af" />
            <TextInput
              placeholder="Tu contraseña"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!show}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
              className="flex-1 ml-3 text-gray-900"
            />
            <Pressable
              onPress={() => setShow(!show)}
              accessibilityLabel={
                show ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              hitSlop={10}
            >
              {show ? (
                <EyeOff size={18} color="#6b7280" />
              ) : (
                <Eye size={18} color="#6b7280" />
              )}
            </Pressable>
          </View>
          <FieldError msg={errors.password} />

          {serverError && (
            <View className="bg-red-50 rounded-xl px-4 py-3 mt-5">
              <Text className="text-red-700 text-sm">{serverError}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`h-12 items-center justify-center rounded-xl mt-6 ${
              loading ? "bg-blue-300" : "bg-blue-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Iniciar sesión</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
