import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Calendar,
  Trophy,
  Lock,
  Eye,
} from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";
import ConfirmModal from "../../../components/ConfirmModal";

const API = "http://localhost:8080/api";

// Mismo orden que en curso/[id].tsx
const THEMES = [
  {
    header: "bg-blue-600",
    sub: "text-blue-100",
    btn: "bg-blue-600",
    btnOff: "bg-blue-300",
    selBg: "bg-blue-50",
    selBorder: "border-blue-300",
    bar: "#2563eb",
    hex: "#2563eb",
  },
  {
    header: "bg-purple-600",
    sub: "text-purple-100",
    btn: "bg-purple-600",
    btnOff: "bg-purple-300",
    selBg: "bg-purple-50",
    selBorder: "border-purple-300",
    bar: "#7c3aed",
    hex: "#7c3aed",
  },
  {
    header: "bg-amber-700",
    sub: "text-amber-100",
    btn: "bg-amber-700",
    btnOff: "bg-amber-300",
    selBg: "bg-amber-50",
    selBorder: "border-amber-300",
    bar: "#b45309",
    hex: "#b45309",
  },
  {
    header: "bg-emerald-700",
    sub: "text-emerald-100",
    btn: "bg-emerald-700",
    btnOff: "bg-emerald-300",
    selBg: "bg-emerald-50",
    selBorder: "border-emerald-300",
    bar: "#047857",
    hex: "#047857",
  },
  {
    header: "bg-rose-600",
    sub: "text-rose-100",
    btn: "bg-rose-600",
    btnOff: "bg-rose-300",
    selBg: "bg-rose-50",
    selBorder: "border-rose-300",
    bar: "#e11d48",
    hex: "#e11d48",
  },
];

type Opcion = { id: number; texto: string; correcta?: boolean };
type Pregunta = {
  id: number;
  enunciado: string;
  puntaje: number;
  opciones: Opcion[];
};
type Evaluacion = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaVencimiento: string;
  puntajeTotal?: number;
  preguntas: Pregunta[];
};
type Resultado = { puntajeObtenido: number; puntajeTotal: number };

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

const resultadoStyle = (pct: number) =>
  pct >= 70
    ? {
        ring: "bg-green-100",
        hex: "#15803d",
        text: "text-green-700",
        msg: "¡Excelente trabajo!",
      }
    : pct >= 50
      ? {
          ring: "bg-amber-100",
          hex: "#b45309",
          text: "text-amber-700",
          msg: "Buen intento",
        }
      : {
          ring: "bg-red-100",
          hex: "#b91c1c",
          text: "text-red-700",
          msg: "Sigue practicando",
        };

export default function EvaluacionDetalle() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const { accessToken, authFetch, role, ready } = useAuth();

  const theme =
    THEMES[Number(t) >= 0 && Number(t) < THEMES.length ? Number(t) : 0];
  const esEstudiante = role === "ESTUDIANTE";

  const [ev, setEv] = useState<Evaluacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [yaRespondida, setYaRespondida] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      if (!accessToken) {
        router.replace("/");
        return;
      }
      (async () => {
        try {
          const res = await authFetch(`${API}/evaluaciones/${id}`);
          const data = parse(await res.text());
          if (!res.ok)
            throw new Error(data?.message ?? `Error ${res.status} al cargar`);
          setEv(data);
          setError(null);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      })();
    }, [id, ready, accessToken]),
  );

  const preguntas = ev?.preguntas ?? [];
  const total =
    ev?.puntajeTotal ?? preguntas.reduce((s, p) => s + (p.puntaje ?? 0), 0);
  const contestadas = Object.keys(respuestas).length;
  const completa = preguntas.length > 0 && contestadas === preguntas.length;
  const vencida = ev
    ? new Date(ev.fechaVencimiento).getTime() < Date.now()
    : false;
  const bloqueada = !esEstudiante || vencida || yaRespondida;

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const res = await authFetch(`${API}/evaluaciones/${id}/responder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          respuestas: Object.entries(respuestas).map(([p, o]) => ({
            preguntaId: Number(p),
            opcionId: o,
          })),
        }),
      });
      const data = parse(await res.text());
      if (!res.ok)
        throw new Error(data?.message ?? `Error ${res.status} al enviar`);
      setResultado(data);
    } catch (e: any) {
      if (/ya respondiste/i.test(e.message)) setYaRespondida(true);
      else setError(e.message);
    } finally {
      setEnviando(false);
      setConfirmar(false);
    }
  };

  const header = (
    <View className={`${theme.header} px-6 pt-14 pb-8 rounded-b-[32px]`}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Volver"
        hitSlop={8}
        className="mb-4 self-start"
      >
        <ArrowLeft color="white" size={22} />
      </Pressable>
      <Text className="text-white text-xl font-bold" numberOfLines={2}>
        {ev?.titulo ?? "Evaluación"}
      </Text>
      {!!ev?.descripcion && (
        <Text className={`${theme.sub} text-sm mt-1`} numberOfLines={3}>
          {ev.descripcion}
        </Text>
      )}
      {ev && (
        <View className="flex-row items-center mt-3">
          <Calendar size={13} color="white" />
          <Text className="text-white/90 text-xs ml-1">
            Vence: {new Date(ev.fechaVencimiento).toLocaleString("es-CO")}
          </Text>
          {total > 0 && (
            <Text className="text-white/90 text-xs ml-3">{total} pts</Text>
          )}
        </View>
      )}
    </View>
  );

  if (loading)
    return (
      <View className="flex-1 bg-gray-50">
        {header}
        <ActivityIndicator className="mt-16" color={theme.hex} />
      </View>
    );

  // No se pudo cargar (no inscrito, no publicada, etc.)
  if (!ev)
    return (
      <View className="flex-1 bg-gray-50">
        {header}
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
            <Lock size={28} color="#6b7280" />
          </View>
          <Text className="text-gray-900 font-bold text-lg mt-4 text-center">
            No se pudo abrir la evaluación
          </Text>
          <Text className="text-gray-600 text-sm mt-1 text-center">
            {error ?? "Intenta de nuevo más tarde"}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className={`${theme.btn} h-11 px-8 items-center justify-center rounded-xl mt-6`}
          >
            <Text className="text-white font-bold">Volver</Text>
          </Pressable>
        </View>
      </View>
    );

  // Resultado final
  if (resultado) {
    const pct = resultado.puntajeTotal
      ? Math.round((resultado.puntajeObtenido / resultado.puntajeTotal) * 100)
      : 0;
    const s = resultadoStyle(pct);
    return (
      <View className="flex-1 bg-gray-50">
        {header}
        <View className="flex-1 items-center justify-center px-10">
          <View
            className={`w-24 h-24 rounded-full ${s.ring} items-center justify-center`}
          >
            <Trophy size={40} color={s.hex} />
          </View>
          <Text className="text-gray-900 text-4xl font-bold mt-5">
            {resultado.puntajeObtenido} / {resultado.puntajeTotal}
          </Text>
          <Text className={`${s.text} font-bold mt-1`}>
            {pct}% · {s.msg}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className={`${theme.btn} h-11 px-8 items-center justify-center rounded-xl mt-8`}
          >
            <Text className="text-white font-bold">Volver al curso</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Ya respondida (el backend permite un solo intento)
  if (yaRespondida)
    return (
      <View className="flex-1 bg-gray-50">
        {header}
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center">
            <CheckCircle2 size={30} color="#15803d" />
          </View>
          <Text className="text-gray-900 font-bold text-lg mt-4 text-center">
            Ya completaste esta evaluación
          </Text>
          <Text className="text-gray-600 text-sm mt-1 text-center">
            Solo se permite un intento por estudiante
          </Text>
          <Pressable
            onPress={() => router.back()}
            className={`${theme.btn} h-11 px-8 items-center justify-center rounded-xl mt-6`}
          >
            <Text className="text-white font-bold">Volver al curso</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-50">
      {header}

      {error && (
        <View className="mx-6 mt-4 bg-red-50 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      {!esEstudiante && (
        <View className="mx-6 mt-4 bg-gray-100 rounded-xl px-4 py-3 flex-row items-center">
          <Eye size={16} color="#4b5563" />
          <Text className="text-gray-700 text-xs ml-2 flex-1">
            Vista previa: solo los estudiantes pueden responder
          </Text>
        </View>
      )}
      {esEstudiante && vencida && (
        <View className="mx-6 mt-4 bg-red-50 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-xs">
            Esta evaluación ya venció y no admite respuestas
          </Text>
        </View>
      )}

      {!esEstudiante && (
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-100 flex-row">
          <View className="flex-1 items-center">
            <Text className="text-gray-900 text-xl font-bold">
              {preguntas.length}
            </Text>
            <Text className="text-gray-500 text-xs">Preguntas</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-gray-900 text-xl font-bold">{total}</Text>
            <Text className="text-gray-500 text-xs">Puntos</Text>
          </View>
          <View className="flex-1 items-center">
            <Text
              className={`text-xl font-bold ${vencida ? "text-red-600" : "text-green-700"}`}
            >
              {vencida ? "Cerrada" : "Abierta"}
            </Text>
            <Text className="text-gray-500 text-xs">Estado</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName={`p-6 ${esEstudiante && !bloqueada ? "pb-40" : "pb-10"}`}
        showsVerticalScrollIndicator={false}
      >
        {preguntas.length === 0 && (
          <Text className="text-gray-500 text-sm text-center mt-10">
            Esta evaluación no devolvió preguntas
          </Text>
        )}
        {preguntas.map((p, i) => (
          <View
            key={p.id}
            className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
            style={{ elevation: 1 }}
          >
            <View className="flex-row items-start justify-between mb-3">
              <Text className="text-gray-900 font-bold flex-1 mr-2">
                {i + 1}. {p.enunciado}
              </Text>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-gray-600 text-[11px] font-bold">
                  {p.puntaje} pts
                </Text>
              </View>
            </View>

            {p.opciones.map((o, idx) => {
              const sel = respuestas[p.id] === o.id;
              const correcta = !esEstudiante && o.correcta;
              return (
                <Pressable
                  key={o.id}
                  disabled={bloqueada}
                  onPress={() =>
                    setRespuestas((prev) => ({ ...prev, [p.id]: o.id }))
                  }
                  className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                    correcta
                      ? "bg-green-50 border-green-200"
                      : sel
                        ? `${theme.selBg} ${theme.selBorder}`
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {esEstudiante ? (
                    sel ? (
                      <CheckCircle2 size={20} color={theme.hex} />
                    ) : (
                      <Circle size={20} color="#9ca3af" />
                    )
                  ) : correcta ? (
                    <CheckCircle2 size={20} color="#16a34a" />
                  ) : (
                    <Text className="text-gray-400 font-bold w-5 text-center">
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  )}
                  <Text className="text-gray-800 ml-3 flex-1">{o.texto}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {esEstudiante && !bloqueada && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600 text-xs">
              {contestadas} de {preguntas.length} respondidas
            </Text>
            <Text className="text-gray-600 text-xs font-bold">
              {preguntas.length
                ? Math.round((contestadas / preguntas.length) * 100)
                : 0}
              %
            </Text>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.bar,
                width: `${
                  preguntas.length ? (contestadas / preguntas.length) * 100 : 0
                }%`,
              }}
            />
          </View>
          <Pressable
            onPress={() => setConfirmar(true)}
            disabled={!completa || enviando}
            className={`h-12 items-center justify-center rounded-xl ${
              completa && !enviando ? theme.btn : theme.btnOff
            }`}
          >
            {enviando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Enviar respuestas</Text>
            )}
          </Pressable>
        </View>
      )}

      <ConfirmModal
        visible={confirmar}
        title="Enviar evaluación"
        message="Una vez enviada no podrás cambiar tus respuestas. ¿Continuar?"
        confirmText="Enviar"
        onConfirm={enviar}
        onCancel={() => setConfirmar(false)}
      />
    </View>
  );
}
