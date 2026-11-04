import { useEffect, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { KeyRound, MailCheck } from "lucide-react-native";

const API = "http://localhost:8080/api/auth";
const RUTA_VERIFICAR = "verificar-correo";
const RUTA_REENVIAR = "reenviar-verificacion";

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

export default function Verificar() {
  const { correo } = useLocalSearchParams<{ correo: string }>();
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [espera, setEspera] = useState(30);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const post = async (ruta: string, body: object) => {
    const res = await fetch(`${API}/${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = parse(await res.text());
    if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
    return data;
  };

  const verificar = async () => {
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(codigo)) {
      setError("El código debe tener 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      await post(RUTA_VERIFICAR, { correo, codigo });
      setOk(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setError(null);
    setInfo(null);
    try {
      await post(RUTA_REENVIAR, { correo });
      setInfo("Te enviamos un nuevo código");
      setEspera(30);
    } catch (e: any) {
      setError(e.message);
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
        <View className="items-center pt-14 pb-8">
          <Image
            style={{ width: 90, height: 90 }}
            source={require("../../assets/images/logo.png")}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-950 mt-1">Mentum</Text>
        </View>

        <View className="flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-10">
          {ok ? (
            <View className="items-center mt-4">
              <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center">
                <MailCheck size={30} color="#15803d" />
              </View>
              <Text className="text-xl font-bold text-gray-950 mt-4">
                ¡Cuenta verificada!
              </Text>
              <Text className="text-sm text-gray-700 text-center mt-1 mb-6">
                Ya puedes iniciar sesión
              </Text>
              <Pressable
                onPress={() => router.replace("/")}
                className="h-12 px-10 bg-blue-600 items-center justify-center rounded-xl"
              >
                <Text className="text-white font-bold">
                  Ir a iniciar sesión
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text className="text-xl font-bold text-gray-950 text-center">
                Verifica tu cuenta
              </Text>
              <Text className="text-sm text-gray-700 text-center mt-1 mb-6">
                Escribe el código de 6 dígitos enviado a {correo}
              </Text>

              <Text className="font-bold text-gray-700 mb-2 text-sm">
                Código
              </Text>
              <View
                className={`flex-row items-center bg-gray-50 border rounded-xl px-3 h-12 ${error ? "border-red-400" : "border-gray-200"}`}
              >
                <KeyRound size={18} color="#9ca3af" />
                <TextInput
                  placeholder="123456"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={codigo}
                  onChangeText={(t) => setCodigo(t.replace(/\D/g, ""))}
                  onSubmitEditing={verificar}
                  className="flex-1 ml-3 text-gray-900 tracking-widest"
                />
              </View>

              {!!info && (
                <View className="bg-blue-50 rounded-xl px-4 py-3 mt-4">
                  <Text className="text-blue-800 text-xs">{info}</Text>
                </View>
              )}
              {!!error && (
                <View className="bg-red-50 rounded-xl px-4 py-3 mt-4">
                  <Text className="text-red-700 text-sm">{error}</Text>
                </View>
              )}

              <Pressable
                onPress={verificar}
                disabled={loading}
                className={`h-12 items-center justify-center rounded-xl mt-6 ${loading ? "bg-blue-300" : "bg-blue-600"}`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Verificar</Text>
                )}
              </Pressable>

              <Pressable
                onPress={reenviar}
                disabled={espera > 0}
                className="self-center mt-4"
                hitSlop={8}
              >
                <Text
                  className={`text-sm font-bold ${espera > 0 ? "text-gray-400" : "text-blue-700"}`}
                >
                  {espera > 0
                    ? `Reenviar código en ${espera}s`
                    : "Reenviar código"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace("/")}
                className="self-center mt-3"
                hitSlop={8}
              >
                <Text className="text-gray-600 text-sm">
                  Verificar más tarde
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
