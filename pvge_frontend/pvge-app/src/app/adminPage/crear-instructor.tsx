import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Award,
  ChevronDown,
  Check,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

const TIERS = [1, 2, 3, 4, 5];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<
  Record<"nombre" | "email" | "password" | "disciplina" | "tier", string>
>;

export default function CrearInstructor() {
  const { accessToken } = useAuth();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [tier, setTier] = useState<number | null>(null);

  const [show, setShow] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: Errors = {};
    if (!nombre.trim()) e.nombre = "Ingresa el nombre completo";
    if (!EMAIL_RE.test(email.trim())) e.email = "Ingresa un correo válido";
    if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!disciplina.trim()) e.disciplina = "Ingresa la disciplina";
    if (tier === null) e.tier = "Selecciona un tier";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/instructores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: email.trim(),
          password,
          disciplina: disciplina.trim(),
          tier,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          data?.message || `Error ${res.status} al crear el instructor`,
        );
      }
      router.back();
    } catch (e: any) {
      console.error(e);
      setServerError(e.message ?? "No se pudo crear el instructor");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (err?: string) =>
    `flex-row items-center bg-white border rounded-xl px-3 h-12 ${
      err ? "border-red-400" : "border-gray-200"
    }`;

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <Text className="text-red-600 text-xs mt-1">{msg}</Text> : null;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-14 pb-8 rounded-b-[32px]">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Nuevo instructor</Text>
        <Text className="text-blue-200 text-sm mt-1">
          Crea la cuenta y define su nivel en la plataforma
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="p-6 pb-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nombre */}
        <Text className="font-bold text-gray-700 mb-2 text-sm">
          Nombre completo
        </Text>
        <View className={fieldClass(errors.nombre)}>
          <User size={18} color="#9ca3af" />
          <TextInput
            placeholder="Miguel David Torres Verano"
            placeholderTextColor="#9ca3af"
            value={nombre}
            onChangeText={setNombre}
            className="flex-1 ml-3 text-gray-900"
          />
        </View>
        <FieldError msg={errors.nombre} />

        {/* Correo */}
        <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
          Correo
        </Text>
        <View className={fieldClass(errors.email)}>
          <Mail size={18} color="#9ca3af" />
          <TextInput
            placeholder="miguel_torres@mentum.edu.co"
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

        {/* Contraseña */}
        <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
          Contraseña temporal
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

        {/* Disciplina */}
        <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
          Disciplina
        </Text>
        <View className={fieldClass(errors.disciplina)}>
          <Briefcase size={18} color="#9ca3af" />
          <TextInput
            placeholder="Ingeniería de Sistemas"
            placeholderTextColor="#9ca3af"
            value={disciplina}
            onChangeText={setDisciplina}
            className="flex-1 ml-3 text-gray-900"
          />
        </View>
        <FieldError msg={errors.disciplina} />

        {/* Tier */}
        <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">Tier</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          className={fieldClass(errors.tier)}
        >
          <Award size={18} color="#9ca3af" />
          <Text
            className={`flex-1 ml-3 ${tier ? "text-gray-900" : "text-gray-400"}`}
          >
            {tier ? `Tier ${tier}` : "Seleccionar tier..."}
          </Text>
          <ChevronDown size={18} color="#6b7280" />
        </Pressable>
        <FieldError msg={errors.tier} />

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
            <Text className="text-white font-bold">Crear instructor</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Selector de tier */}
      <Modal visible={pickerOpen} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setPickerOpen(false)}
        >
          <Pressable className="bg-white rounded-t-3xl pt-5 pb-8">
            <Text className="text-lg font-bold text-gray-900 px-6 mb-2">
              Selecciona el tier
            </Text>
            {TIERS.map((t) => {
              const selected = tier === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    setTier(t);
                    setErrors((prev) => ({ ...prev, tier: undefined }));
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
                    Tier {t}
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
