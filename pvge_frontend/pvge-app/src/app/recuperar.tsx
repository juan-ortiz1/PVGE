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
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react-native";

const API = "http://localhost:8080/api/auth";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Paso = 1 | 2 | 3 | 4;

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

const box = (err?: string) =>
  `flex-row items-center bg-gray-50 border rounded-xl px-3 h-12 ${
    err ? "border-red-400" : "border-gray-200"
  }`;

export default function Recuperar() {
  const [paso, setPaso] = useState<Paso>(1);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const post = async (ruta: string, body: object) => {
    const res = await fetch(`${API}/${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = parse(await res.text());
    if (!res.ok)
      throw new Error(
        res.status === 403
          ? "No se pudo completar la solicitud (403)"
          : (data?.message ?? `Error ${res.status}`),
      );
    return data;
  };

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const enviarCodigo = () =>
    run(async () => {
      if (!EMAIL_RE.test(correo.trim()))
        throw new Error("Ingresa un correo válido");
      await post("olvide-password", { correo: correo.trim() });
      setPaso(2);
      setInfo(
        "Si el correo está registrado, te enviamos un código de 6 dígitos",
      );
    });

  const verificar = () =>
    run(async () => {
      if (!/^\d{6}$/.test(codigo))
        throw new Error("El código debe tener 6 dígitos");
      await post("verificar-codigo", { correo: correo.trim(), codigo });
      setPaso(3);
    });

  const restablecer = () =>
    run(async () => {
      if (pass.length < 6) throw new Error("Mínimo 6 caracteres");
      if (pass !== confirm) throw new Error("Las contraseñas no coinciden");
      await post("restablecer-password", {
        correo: correo.trim(),
        codigo,
        nuevaPassword: pass,
      });
      setPaso(4);
    });

  const titulos: Record<Paso, string> = {
    1: "¿Olvidaste tu contraseña?",
    2: "Revisa tu correo",
    3: "Crea una nueva contraseña",
    4: "¡Listo!",
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
          {paso < 4 && (
            <Pressable
              onPress={() =>
                paso === 1 ? router.replace("/") : setPaso((paso - 1) as Paso)
              }
              accessibilityLabel="Volver"
              hitSlop={8}
              className="mb-3 self-start"
            >
              <ArrowLeft size={22} color="#374151" />
            </Pressable>
          )}

          <Text className="text-xl font-bold text-gray-950 text-center">
            {titulos[paso]}
          </Text>

          {paso === 1 && (
            <>
              <Text className="text-sm text-gray-700 text-center mt-1 mb-6">
                Ingresa tu correo y te enviaremos un código para restablecerla
              </Text>
              <Text className="font-bold text-gray-700 mb-2 text-sm">
                Correo electrónico
              </Text>
              <View className={box()}>
                <Mail size={18} color="#9ca3af" />
                <TextInput
                  placeholder="alex.morgan@mentum.edu"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={correo}
                  onChangeText={setCorreo}
                  onSubmitEditing={enviarCodigo}
                  className="flex-1 ml-3 text-gray-900"
                />
              </View>
            </>
          )}

          {paso === 2 && (
            <>
              <Text className="text-sm text-gray-700 text-center mt-1 mb-6">
                Escribe el código de 6 dígitos enviado a {correo.trim()}
              </Text>
              <Text className="font-bold text-gray-700 mb-2 text-sm">
                Código
              </Text>
              <View className={box()}>
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
              <Pressable
                onPress={enviarCodigo}
                disabled={loading}
                className="self-center mt-3"
              >
                <Text className="text-blue-700 text-sm font-bold">
                  Reenviar código
                </Text>
              </Pressable>
            </>
          )}

          {paso === 3 && (
            <>
              <Text className="text-sm text-gray-700 text-center mt-1 mb-6">
                Elige una contraseña de al menos 6 caracteres
              </Text>
              <Text className="font-bold text-gray-700 mb-2 text-sm">
                Nueva contraseña
              </Text>
              <View className={box()}>
                <Lock size={18} color="#9ca3af" />
                <TextInput
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  value={pass}
                  onChangeText={setPass}
                  className="flex-1 ml-3 text-gray-900"
                />
                <Pressable
                  onPress={() => setShow(!show)}
                  hitSlop={10}
                  accessibilityLabel="Mostrar u ocultar contraseña"
                >
                  {show ? (
                    <EyeOff size={18} color="#6b7280" />
                  ) : (
                    <Eye size={18} color="#6b7280" />
                  )}
                </Pressable>
              </View>

              <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
                Confirmar contraseña
              </Text>
              <View className={box()}>
                <Lock size={18} color="#9ca3af" />
                <TextInput
                  placeholder="Repite la contraseña"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  value={confirm}
                  onChangeText={setConfirm}
                  onSubmitEditing={restablecer}
                  className="flex-1 ml-3 text-gray-900"
                />
              </View>
            </>
          )}

          {paso === 4 && (
            <View className="items-center mt-4">
              <Text className="text-sm text-gray-700 text-center mb-6">
                Tu contraseña se actualizó. Ya puedes iniciar sesión
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
          )}

          {!!info && paso === 2 && (
            <View className="bg-blue-50 rounded-xl px-4 py-3 mt-5">
              <Text className="text-blue-800 text-xs">{info}</Text>
            </View>
          )}
          {!!error && (
            <View className="bg-red-50 rounded-xl px-4 py-3 mt-5">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {paso < 4 && (
            <Pressable
              onPress={
                paso === 1 ? enviarCodigo : paso === 2 ? verificar : restablecer
              }
              disabled={loading}
              className={`h-12 items-center justify-center rounded-xl mt-6 ${loading ? "bg-blue-300" : "bg-blue-600"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">
                  {paso === 1
                    ? "Enviar código"
                    : paso === 2
                      ? "Verificar código"
                      : "Cambiar contraseña"}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
