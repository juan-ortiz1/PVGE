import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  FileText,
  AlignLeft,
  ListOrdered,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

const THEMES = [
  {
    header: "bg-blue-600",
    sub: "text-blue-100",
    btn: "bg-blue-600",
    btnOff: "bg-blue-300",
  },
  {
    header: "bg-purple-600",
    sub: "text-purple-100",
    btn: "bg-purple-600",
    btnOff: "bg-purple-300",
  },
  {
    header: "bg-amber-700",
    sub: "text-amber-100",
    btn: "bg-amber-700",
    btnOff: "bg-amber-300",
  },
  {
    header: "bg-emerald-700",
    sub: "text-emerald-100",
    btn: "bg-emerald-700",
    btnOff: "bg-emerald-300",
  },
  {
    header: "bg-rose-600",
    sub: "text-rose-100",
    btn: "bg-rose-600",
    btnOff: "bg-rose-300",
  },
];

type Errors = Partial<Record<"titulo" | "descripcion" | "orden", string>>;

const fieldClass = (err?: string) =>
  `w-full p-3 pl-11 bg-white border rounded-xl text-gray-900 ${
    err ? "border-red-400" : "border-gray-200"
  }`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <Text className="text-red-600 text-xs mt-1">{msg}</Text> : null;

export default function CrearContenido() {
  const { accessToken } = useAuth();
  const { cursoId, t } = useLocalSearchParams<{
    cursoId: string;
    t?: string;
  }>();
  const theme =
    THEMES[Number(t) >= 0 && Number(t) < THEMES.length ? Number(t) : 0];

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: Errors = {};
    if (!titulo.trim()) e.titulo = "Ingresa un título";
    if (!descripcion.trim()) e.descripcion = "Ingresa una descripción";
    if (orden && (!/^\d+$/.test(orden) || Number(orden) < 1))
      e.orden = "Usa un número entero mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/contenidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          cursoId: Number(cursoId),
          orden: orden ? Number(orden) : undefined,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          data?.message || `Error ${res.status} al crear el contenido`,
        );
      }
      router.back();
    } catch (e: any) {
      console.error(e);
      setServerError(e.message ?? "No se pudo crear el contenido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View className={`${theme.header} px-6 pt-14 pb-8 rounded-b-[32px]`}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Nuevo contenido</Text>
        <Text className={`${theme.sub} text-sm mt-1`}>
          Agrega material de estudio a tu curso
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="p-6 pb-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-bold text-gray-700 mb-2 text-sm">Título</Text>
        <View className="relative">
          <TextInput
            placeholder="Ej. Fundamentos de componentes"
            placeholderTextColor="#9ca3af"
            className={fieldClass(errors.titulo)}
            value={titulo}
            onChangeText={setTitulo}
          />
          <FileText
            size={18}
            color="#9ca3af"
            style={{ position: "absolute", left: 12, top: 14 }}
          />
        </View>
        <FieldError msg={errors.titulo} />

        <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
          Descripción
        </Text>
        <View className="relative">
          <TextInput
            placeholder="Resume de qué trata este contenido"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            className={`${fieldClass(errors.descripcion)} h-32 pt-3`}
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <AlignLeft
            size={18}
            color="#9ca3af"
            style={{ position: "absolute", left: 12, top: 14 }}
          />
        </View>
        <FieldError msg={errors.descripcion} />

        <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
          Orden (opcional)
        </Text>
        <View className="relative">
          <TextInput
            placeholder="1, 2, 3..."
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            className={fieldClass(errors.orden)}
            value={orden}
            onChangeText={setOrden}
          />
          <ListOrdered
            size={18}
            color="#9ca3af"
            style={{ position: "absolute", left: 12, top: 14 }}
          />
        </View>
        {errors.orden ? (
          <FieldError msg={errors.orden} />
        ) : (
          <Text className="text-gray-600 text-xs mt-1">
            Si lo dejas vacío, se agrega al final
          </Text>
        )}

        {serverError && (
          <View className="bg-red-50 rounded-xl px-4 py-3 mt-5">
            <Text className="text-red-700 text-sm">{serverError}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`h-12 items-center justify-center rounded-xl mt-6 ${
            loading ? theme.btnOff : theme.btn
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Crear contenido</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
