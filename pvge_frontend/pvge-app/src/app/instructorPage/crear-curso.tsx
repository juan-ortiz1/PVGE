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
import { router } from "expo-router";
import { ArrowLeft, BookOpen, AlignLeft } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

type Errors = Partial<Record<"titulo" | "descripcion", string>>;

const fieldClass = (err?: string) =>
  `w-full p-3 pl-11 bg-white border rounded-xl text-gray-900 ${
    err ? "border-red-400" : "border-gray-200"
  }`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <Text className="text-red-600 text-xs mt-1">{msg}</Text> : null;

export default function CrearCurso() {
  const { accessToken } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: Errors = {};
    if (!titulo.trim()) e.titulo = "Ingresa un título";
    if (!descripcion.trim()) e.descripcion = "Ingresa una descripción";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/cursos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          data?.message || `Error ${res.status} al crear el curso`,
        );
      }
      router.back();
    } catch (e: any) {
      console.error(e);
      setServerError(e.message ?? "No se pudo crear el curso");
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
      <View className="bg-blue-600 px-6 pt-14 pb-8 rounded-b-[32px]">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Nuevo curso</Text>
        <Text className="text-blue-100 text-sm mt-1">
          Comparte tu conocimiento con tus estudiantes
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="p-6 pb-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-bold text-gray-700 mb-2 text-sm">
          Título del curso
        </Text>
        <View className="relative">
          <TextInput
            placeholder="Ej. Introducción a Bases de Datos"
            placeholderTextColor="#9ca3af"
            className={fieldClass(errors.titulo)}
            value={titulo}
            onChangeText={setTitulo}
          />
          <BookOpen
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
            placeholder="¿Qué aprenderán los estudiantes en este curso?"
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
            <Text className="text-white font-bold">Crear curso</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
