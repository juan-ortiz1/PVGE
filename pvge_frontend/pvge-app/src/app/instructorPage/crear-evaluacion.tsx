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
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import DateTimeField from "../../components/DateTimeField";

const THEMES = [
  {
    header: "bg-blue-600",
    sub: "text-blue-100",
    btn: "bg-blue-600",
    btnOff: "bg-blue-300",
    text: "text-blue-700",
    dashed: "border-blue-300",
    hex: "#2563eb",
  },
  {
    header: "bg-purple-600",
    sub: "text-purple-100",
    btn: "bg-purple-600",
    btnOff: "bg-purple-300",
    text: "text-purple-700",
    dashed: "border-purple-300",
    hex: "#7c3aed",
  },
  {
    header: "bg-amber-700",
    sub: "text-amber-100",
    btn: "bg-amber-700",
    btnOff: "bg-amber-300",
    text: "text-amber-800",
    dashed: "border-amber-300",
    hex: "#b45309",
  },
  {
    header: "bg-emerald-700",
    sub: "text-emerald-100",
    btn: "bg-emerald-700",
    btnOff: "bg-emerald-300",
    text: "text-emerald-800",
    dashed: "border-emerald-300",
    hex: "#047857",
  },
  {
    header: "bg-rose-600",
    sub: "text-rose-100",
    btn: "bg-rose-600",
    btnOff: "bg-rose-300",
    text: "text-rose-700",
    dashed: "border-rose-300",
    hex: "#e11d48",
  },
];

type Opcion = { texto: string; correcta: boolean };
type Pregunta = { enunciado: string; puntaje: string; opciones: Opcion[] };

const nuevaPregunta = (): Pregunta => ({
  enunciado: "",
  puntaje: "1",
  opciones: [
    { texto: "", correcta: true },
    { texto: "", correcta: false },
  ],
});

const pad = (n: number) => n.toString().padStart(2, "0");

// Sin "Z": el backend espera LocalDateTime
const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

const inputCls =
  "w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-900";

export default function CrearEvaluacion() {
  const { authFetch } = useAuth();
  const { cursoId, t } = useLocalSearchParams<{
    cursoId: string;
    t?: string;
  }>();
  const theme =
    THEMES[Number(t) >= 0 && Number(t) < THEMES.length ? Number(t) : 0];

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [vencimiento, setVencimiento] = useState<Date | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([nuevaPregunta()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const puntajeTotal = preguntas.reduce(
    (s, p) => s + (/^\d+$/.test(p.puntaje) ? Number(p.puntaje) : 0),
    0,
  );

  const updatePregunta = (i: number, patch: Partial<Pregunta>) =>
    setPreguntas((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    );

  const updateOpcion = (i: number, j: number, patch: Partial<Opcion>) =>
    setPreguntas((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? {
              ...p,
              opciones: p.opciones.map((o, k) =>
                k === j ? { ...o, ...patch } : o,
              ),
            }
          : p,
      ),
    );

  const marcarCorrecta = (i: number, j: number) =>
    setPreguntas((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? {
              ...p,
              opciones: p.opciones.map((o, k) => ({ ...o, correcta: k === j })),
            }
          : p,
      ),
    );

  const addOpcion = (i: number) =>
    updatePregunta(i, {
      opciones: [...preguntas[i].opciones, { texto: "", correcta: false }],
    });

  const removeOpcion = (i: number, j: number) => {
    const opciones = preguntas[i].opciones.filter((_, k) => k !== j);
    if (!opciones.some((o) => o.correcta) && opciones.length)
      opciones[0] = { ...opciones[0], correcta: true };
    updatePregunta(i, { opciones });
  };

  const validar = (): string => {
    if (!titulo.trim() || !descripcion.trim())
      return "Completa título y descripción";
    if (!vencimiento) return "Elige la fecha de vencimiento";
    if (vencimiento <= new Date())
      return "El vencimiento debe ser posterior a la fecha actual";
    if (preguntas.length === 0) return "Agrega al menos una pregunta";
    for (const [i, p] of preguntas.entries()) {
      if (!p.enunciado.trim()) return `Pregunta ${i + 1}: falta el enunciado`;
      if (!/^\d+$/.test(p.puntaje) || Number(p.puntaje) < 1)
        return `Pregunta ${i + 1}: el puntaje debe ser un entero mayor a 0`;
      if (p.opciones.length < 2) return `Pregunta ${i + 1}: mínimo 2 opciones`;
      if (p.opciones.some((o) => !o.texto.trim()))
        return `Pregunta ${i + 1}: hay opciones vacías`;
    }
    return "";
  };

  const handleSubmit = async () => {
    const msg = validar();
    setError(msg);
    if (msg) return;

    setLoading(true);
    try {
      const res = await authFetch("http://localhost:8080/api/evaluaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          cursoId: Number(cursoId),
          fechaPublicacion: toLocalISO(new Date()),
          fechaVencimiento: toLocalISO(vencimiento!),
          preguntas: preguntas.map((p) => ({
            enunciado: p.enunciado.trim(),
            puntaje: Number(p.puntaje),
            opciones: p.opciones.map((o) => ({
              texto: o.texto.trim(),
              correcta: o.correcta,
            })),
          })),
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok)
        throw new Error(
          data?.message || `Error ${res.status} al crear la evaluación`,
        );

      router.back();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudo crear la evaluación");
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
        <Text className="text-white text-2xl font-bold">Nueva evaluación</Text>
        <Text className={`${theme.sub} text-sm mt-1`}>
          Preguntas de selección única. Se publica al crearla y cada estudiante
          responde una sola vez
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="p-6 pb-16"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-bold text-gray-700 mb-2 text-sm">Título</Text>
        <TextInput
          placeholder="Ej. Parcial 1"
          placeholderTextColor="#9ca3af"
          maxLength={255}
          className={`${inputCls} mb-4`}
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text className="font-bold text-gray-700 mb-2 text-sm">
          Descripción
        </Text>
        <TextInput
          placeholder="¿Qué evalúa?"
          placeholderTextColor="#9ca3af"
          maxLength={255}
          multiline
          textAlignVertical="top"
          className={`${inputCls} h-24`}
          value={descripcion}
          onChangeText={setDescripcion}
        />
        <Text className="text-gray-400 text-xs text-right mt-1 mb-4">
          {descripcion.length}/255
        </Text>

        <View className="flex-row mb-6">
          <DateTimeField
            label="Vencimiento"
            value={vencimiento}
            onChange={setVencimiento}
            minimumDate={new Date()}
          />
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-900 font-bold text-base">
            Preguntas ({preguntas.length})
          </Text>
          <View className="bg-white border border-gray-200 px-3 py-1 rounded-full">
            <Text className="text-gray-700 text-xs font-bold">
              Total: {puntajeTotal} pts
            </Text>
          </View>
        </View>

        {preguntas.map((p, i) => (
          <View
            key={i}
            className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
            style={{ elevation: 1 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${theme.text} font-bold`}>
                Pregunta {i + 1}
              </Text>
              {preguntas.length > 1 && (
                <Pressable
                  onPress={() =>
                    setPreguntas((prev) => prev.filter((_, k) => k !== i))
                  }
                  accessibilityLabel={`Eliminar pregunta ${i + 1}`}
                  hitSlop={10}
                >
                  <Trash2 size={18} color="#dc2626" />
                </Pressable>
              )}
            </View>

            <TextInput
              placeholder="Enunciado"
              placeholderTextColor="#9ca3af"
              maxLength={255}
              multiline
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-3 text-gray-900"
              value={p.enunciado}
              onChangeText={(v) => updatePregunta(i, { enunciado: v })}
            />

            <View className="flex-row items-center mb-3">
              <Text className="text-gray-600 text-sm mr-2">Puntaje:</Text>
              <TextInput
                keyboardType="numeric"
                className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-900"
                value={p.puntaje}
                onChangeText={(v) => updatePregunta(i, { puntaje: v })}
              />
            </View>

            <Text className="text-gray-600 text-xs mb-2">
              Toca el círculo para marcar la opción correcta
            </Text>

            {p.opciones.map((o, j) => (
              <View key={j} className="flex-row items-center mb-2">
                <Pressable
                  onPress={() => marcarCorrecta(i, j)}
                  accessibilityLabel={`Marcar opción ${j + 1} como correcta`}
                  hitSlop={8}
                  className="mr-2"
                >
                  {o.correcta ? (
                    <CheckCircle2 size={22} color="#16a34a" />
                  ) : (
                    <Circle size={22} color="#9ca3af" />
                  )}
                </Pressable>
                <TextInput
                  placeholder={`Opción ${j + 1}`}
                  placeholderTextColor="#9ca3af"
                  maxLength={255}
                  className={`flex-1 p-2.5 border rounded-xl text-gray-900 ${
                    o.correcta
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  value={o.texto}
                  onChangeText={(v) => updateOpcion(i, j, { texto: v })}
                />
                {p.opciones.length > 2 && (
                  <Pressable
                    onPress={() => removeOpcion(i, j)}
                    accessibilityLabel={`Quitar opción ${j + 1}`}
                    hitSlop={8}
                    className="ml-2"
                  >
                    <Trash2 size={16} color="#9ca3af" />
                  </Pressable>
                )}
              </View>
            ))}

            <Pressable
              onPress={() => addOpcion(i)}
              className="flex-row items-center mt-1 self-start"
            >
              <Plus size={16} color={theme.hex} />
              <Text className={`${theme.text} text-sm font-bold ml-1`}>
                Agregar opción
              </Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={() => setPreguntas((prev) => [...prev, nuevaPregunta()])}
          className={`h-11 border-2 border-dashed ${theme.dashed} items-center justify-center rounded-xl flex-row mb-6`}
        >
          <Plus size={18} color={theme.hex} />
          <Text className={`${theme.text} font-bold ml-1`}>
            Agregar pregunta
          </Text>
        </Pressable>

        {!!error && (
          <View className="bg-red-50 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`h-12 items-center justify-center rounded-xl ${
            loading ? theme.btnOff : theme.btn
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Crear evaluación</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
