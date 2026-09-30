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
import { ArrowLeft, Calendar, FileText, AlignLeft } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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

type Errors = Partial<Record<"titulo" | "descripcion" | "fecha", string>>;

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Hora local, sin conversión a UTC: entrega a las 23:59 del día elegido
const toLocalIso = (d: Date) => `${toDateInput(d)}T23:59:00`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const fieldClass = (err?: string) =>
  `w-full p-3 pl-11 bg-white border rounded-xl text-gray-900 ${
    err ? "border-red-400" : "border-gray-200"
  }`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <Text className="text-red-600 text-xs mt-1">{msg}</Text> : null;

export default function CrearTarea() {
  const { accessToken } = useAuth();
  const { cursoId, t } = useLocalSearchParams<{
    cursoId: string;
    t?: string;
  }>();
  const theme =
    THEMES[Number(t) >= 0 && Number(t) < THEMES.length ? Number(t) : 0];

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: Errors = {};
    if (!titulo.trim()) e.titulo = "Ingresa un título";
    if (!descripcion.trim()) e.descripcion = "Ingresa una descripción";
    if (!fecha) e.fecha = "Selecciona la fecha de entrega";
    else if (fecha < startOfToday())
      e.fecha = "La fecha no puede ser anterior a hoy";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validate() || !fecha) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/tareas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fechaEntrega: toLocalIso(fecha),
          cursoId: Number(cursoId),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          data?.message || `Error ${res.status} al crear la tarea`,
        );
      }
      router.back();
    } catch (e: any) {
      console.error(e);
      setServerError(e.message ?? "No se pudo crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  const dateBox = `flex-row items-center bg-white border rounded-xl px-3 h-12 ${
    errors.fecha ? "border-red-400" : "border-gray-200"
  }`;

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
        <Text className="text-white text-2xl font-bold">Nueva tarea</Text>
        <Text className={`${theme.sub} text-sm mt-1`}>
          Define qué deben entregar tus estudiantes y cuándo
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
            placeholder="Ej. Taller de componentes"
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
            placeholder="Explica qué debe entregar el estudiante"
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
          Fecha de entrega
        </Text>

        {Platform.OS === "web" ? (
          <View className={dateBox}>
            <Calendar size={18} color="#9ca3af" />
            <input
              type="date"
              value={fecha ? toDateInput(fecha) : ""}
              min={toDateInput(new Date())}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split("-").map(Number);
                setFecha(y && m && d ? new Date(y, m - 1, d, 23, 59) : null);
              }}
              style={{
                flex: 1,
                marginLeft: 12,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 16,
                color: fecha ? "#111827" : "#6b7280",
              }}
            />
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => setShowPicker(!showPicker)}
              className={dateBox}
            >
              <Calendar size={18} color="#9ca3af" />
              <Text
                className={`ml-3 ${fecha ? "text-gray-900" : "text-gray-400"}`}
              >
                {fecha
                  ? fecha.toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Seleccionar fecha..."}
              </Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={fecha ?? new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowPicker(Platform.OS === "ios");
                  if (date) {
                    date.setHours(23, 59, 0, 0);
                    setFecha(date);
                  }
                }}
              />
            )}
          </>
        )}
        {errors.fecha ? (
          <FieldError msg={errors.fecha} />
        ) : (
          <Text className="text-gray-600 text-xs mt-1">
            Los estudiantes pueden entregar hasta las 11:59 p. m.
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
            <Text className="text-white font-bold">Crear tarea</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
