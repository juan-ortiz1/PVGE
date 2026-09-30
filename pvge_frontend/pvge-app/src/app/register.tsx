import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Globe,
  ChevronDown,
  Check,
} from "lucide-react-native";

const countries = [
  { name: "Argentina", code: "AR" },
  { name: "Chile", code: "CL" },
  { name: "Colombia", code: "CO" },
  { name: "México", code: "MX" },
  { name: "Perú", code: "PE" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Pais = { name: string; code: string };
type Errors = Partial<
  Record<
    | "nickname"
    | "nombre"
    | "apellido"
    | "email"
    | "password"
    | "confirm"
    | "pais",
    string
  >
>;

const fieldClass = (err?: string) =>
  `flex-row items-center bg-gray-50 border rounded-xl px-3 h-12 ${
    err ? "border-red-400" : "border-gray-200"
  }`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <Text className="text-red-600 text-xs mt-1">{msg}</Text> : null;

export default function Register() {
  const [nickname, setNickname] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pais, setPais] = useState<Pais | null>(null);

  const [show, setShow] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: Errors = {};
    if (!nickname.trim()) e.nickname = "Elige un nombre de usuario";
    if (!nombre.trim()) e.nombre = "Ingresa tus nombres";
    if (!apellido.trim()) e.apellido = "Ingresa tus apellidos";
    if (!EMAIL_RE.test(email.trim())) e.email = "Ingresa un correo válido";
    if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (confirm !== password) e.confirm = "Las contraseñas no coinciden";
    if (!pais) e.pais = "Selecciona tu país";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/estudiantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          correo: email.trim(),
          password,
          pais: pais?.name,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.message || `Error ${res.status} al registrarse`);
      }
      router.replace("/");
    } catch (err: any) {
      console.error(err);
      setServerError(err.message ?? "No se pudo completar el registro");
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
        <View className="items-center pt-12 pb-8">
          <Image
            style={{ width: 80, height: 80 }}
            source={require("../../assets/images/logo.png")}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-950 mt-1">Mentum</Text>
          <Text className="text-sm text-gray-700 font-medium mt-1">
            Cada clase, cada logro, cada paso
          </Text>
        </View>

        {/* Formulario */}
        <View className="flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-10">
          <Text className="text-xl font-bold text-gray-950 text-center">
            Crea tu cuenta
          </Text>
          <Text className="text-sm text-gray-700 text-center mt-1 mb-6">
            ¿Ya tienes cuenta?{" "}
            <Text
              onPress={() => router.replace("/")}
              className="text-blue-700 font-bold"
            >
              Inicia sesión
            </Text>
          </Text>

          <Text className="font-bold text-gray-700 mb-2 text-sm">
            Nombre de usuario
          </Text>
          <View className={fieldClass(errors.nickname)}>
            <AtSign size={18} color="#9ca3af" />
            <TextInput
              placeholder="alexito_morgan"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              value={nickname}
              onChangeText={setNickname}
              className="flex-1 ml-3 text-gray-900"
            />
          </View>
          <FieldError msg={errors.nickname} />

          <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
            Nombres
          </Text>
          <View className={fieldClass(errors.nombre)}>
            <User size={18} color="#9ca3af" />
            <TextInput
              placeholder="Alex David"
              placeholderTextColor="#9ca3af"
              value={nombre}
              onChangeText={setNombre}
              className="flex-1 ml-3 text-gray-900"
            />
          </View>
          <FieldError msg={errors.nombre} />

          <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
            Apellidos
          </Text>
          <View className={fieldClass(errors.apellido)}>
            <User size={18} color="#9ca3af" />
            <TextInput
              placeholder="Morgan Rogers"
              placeholderTextColor="#9ca3af"
              value={apellido}
              onChangeText={setApellido}
              className="flex-1 ml-3 text-gray-900"
            />
          </View>
          <FieldError msg={errors.apellido} />

          <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
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
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!show}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
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

          <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
            Confirmar contraseña
          </Text>
          <View className={fieldClass(errors.confirm)}>
            <Lock size={18} color="#9ca3af" />
            <TextInput
              placeholder="Repite la contraseña"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!show}
              autoCapitalize="none"
              value={confirm}
              onChangeText={setConfirm}
              className="flex-1 ml-3 text-gray-900"
            />
          </View>
          <FieldError msg={errors.confirm} />

          <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
            País
          </Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            className={fieldClass(errors.pais)}
          >
            <Globe size={18} color="#9ca3af" />
            <Text
              className={`flex-1 ml-3 ${pais ? "text-gray-900" : "text-gray-400"}`}
            >
              {pais ? pais.name : "Seleccionar país..."}
            </Text>
            <ChevronDown size={18} color="#6b7280" />
          </Pressable>
          <FieldError msg={errors.pais} />

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
              <Text className="text-white font-bold">Crear cuenta</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Selector de país */}
      <Modal visible={pickerOpen} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setPickerOpen(false)}
        >
          <Pressable className="bg-white rounded-t-3xl pt-5 pb-8">
            <Text className="text-lg font-bold text-gray-900 px-6 mb-2">
              Selecciona tu país
            </Text>
            {countries.map((c) => {
              const selected = pais?.code === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setPais(c);
                    setErrors((prev) => ({ ...prev, pais: undefined }));
                    setPickerOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-6 h-12 ${
                    selected ? "bg-blue-50" : ""
                  }`}
                >
                  <Text
                    className={`text-base ${
                      selected ? "text-blue-700 font-bold" : "text-gray-800"
                    }`}
                  >
                    {c.name}
                  </Text>
                  {selected && <Check size={18} color="#1d4ed8" />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
