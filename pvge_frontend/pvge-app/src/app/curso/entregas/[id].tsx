import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  Linking,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Search,
  X,
  FileText,
  Download,
  Star,
  ClipboardCheck,
} from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";

const API = "http://localhost:8080/api";

const THEMES = [
  {
    header: "bg-blue-600",
    sub: "text-blue-100",
    text: "text-blue-700",
    soft: "bg-blue-100",
    btn: "bg-blue-600",
    btnOff: "bg-blue-300",
    hex: "#2563eb",
  },
  {
    header: "bg-purple-600",
    sub: "text-purple-100",
    text: "text-purple-700",
    soft: "bg-purple-100",
    btn: "bg-purple-600",
    btnOff: "bg-purple-300",
    hex: "#7c3aed",
  },
  {
    header: "bg-amber-700",
    sub: "text-amber-100",
    text: "text-amber-800",
    soft: "bg-amber-100",
    btn: "bg-amber-700",
    btnOff: "bg-amber-300",
    hex: "#b45309",
  },
  {
    header: "bg-emerald-700",
    sub: "text-emerald-100",
    text: "text-emerald-800",
    soft: "bg-emerald-100",
    btn: "bg-emerald-700",
    btnOff: "bg-emerald-300",
    hex: "#047857",
  },
  {
    header: "bg-rose-600",
    sub: "text-rose-100",
    text: "text-rose-700",
    soft: "bg-rose-100",
    btn: "bg-rose-600",
    btnOff: "bg-rose-300",
    hex: "#e11d48",
  },
];

type Entrega = {
  id: number;
  tareaId: number;
  nombreArchivo: string;
  urlArchivo: string;
  fechaEntrega: string;
  calificacion?: number | null;
  observaciones?: string | null;
  fechaCalificacion?: string | null;
  estudianteId: number;
  correoEstudiante: string;
  tareaTitulo: string;
};

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};
const fmt = (f: string) =>
  new Date(f).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const abrir = (url: string) =>
  Platform.OS === "web"
    ? (globalThis as any).open(url, "_blank")
    : Linking.openURL(url);

export default function EntregasCurso() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const { accessToken, authFetch, ready } = useAuth();
  const logueado = !!accessToken;
  const theme =
    THEMES[Number(t) >= 0 && Number(t) < THEMES.length ? Number(t) : 0];

  const [lista, setLista] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<"TODAS" | "SIN" | "CALIFICADAS">(
    "TODAS",
  );

  const [sel, setSel] = useState<Entrega | null>(null);
  const [nota, setNota] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [errNota, setErrNota] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const res = await authFetch(`${API}/tareas/curso/${id}/entregas`);
      const data = parse(await res.text());
      if (!res.ok)
        throw new Error(
          data?.message ?? `Error ${res.status} al cargar las entregas`,
        );
      setLista(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      if (!logueado) {
        router.replace("/");
        return;
      }
      cargar();
    }, [id, ready, logueado]),
  );

  const filtrada = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lista.filter((e) => {
      if (filtro === "SIN" && e.calificacion != null) return false;
      if (filtro === "CALIFICADAS" && e.calificacion == null) return false;
      return (
        !q ||
        (e.correoEstudiante ?? "").toLowerCase().includes(q) ||
        (e.tareaTitulo ?? "").toLowerCase().includes(q)
      );
    });
  }, [lista, query, filtro]);

  const sinCalificar = lista.filter((e) => e.calificacion == null).length;

  const abrirCalificar = (e: Entrega) => {
    setSel(e);
    setNota(e.calificacion != null ? String(e.calificacion) : "");
    setObs(e.observaciones ?? "");
    setErrNota(null);
  };

  const guardar = async () => {
    if (!sel) return;
    const n = Number(nota.replace(",", "."));
    if (nota.trim() === "" || isNaN(n) || n < 0 || n > 5) {
      setErrNota("La nota debe estar entre 0.0 y 5.0");
      return;
    }
    setSaving(true);
    setErrNota(null);
    try {
      const res = await authFetch(
        `${API}/tareas/entregas/${sel.id}/calificacion`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calificacion: n,
            observaciones: obs.trim() || null,
          }),
        },
      );
      const data = parse(await res.text());
      if (!res.ok)
        throw new Error(data?.message ?? `Error ${res.status} al calificar`);
      setSel(null);
      await cargar();
    } catch (e: any) {
      setErrNota(e.message);
    } finally {
      setSaving(false);
    }
  };

  const chips = [
    { key: "TODAS", label: `Todas · ${lista.length}` },
    { key: "SIN", label: `Sin calificar · ${sinCalificar}` },
    {
      key: "CALIFICADAS",
      label: `Calificadas · ${lista.length - sinCalificar}`,
    },
  ] as const;

  return (
    <View className="flex-1 bg-gray-50">
      <View className={`${theme.header} px-6 pt-14 pb-6 rounded-b-[32px]`}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Entregas</Text>
        <Text className={`${theme.sub} text-sm mt-1 mb-4`}>
          {lista.length} {lista.length === 1 ? "entrega" : "entregas"} ·{" "}
          {sinCalificar} sin calificar
        </Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 h-12">
          <Search size={18} color="#9ca3af" />
          <TextInput
            placeholder="Buscar por correo o tarea..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            value={query}
            onChangeText={setQuery}
            className="flex-1 ml-3 text-gray-900"
          />
          {query !== "" && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={16} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 px-6 mt-4">
        {chips.map((c) => {
          const activo = filtro === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => setFiltro(c.key)}
              className={`px-4 h-9 items-center justify-center rounded-full border ${
                activo
                  ? `${theme.btn} border-transparent`
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${activo ? "text-white" : "text-gray-600"}`}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && (
        <View className="mx-6 mt-4 bg-red-50 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-xs">{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator className="mt-16" color={theme.hex} />
      ) : (
        <FlatList
          data={filtrada}
          keyExtractor={(e) => e.id.toString()}
          contentContainerClassName="px-6 pt-4 pb-10"
          refreshing={loading}
          onRefresh={cargar}
          ListEmptyComponent={
            <View className="items-center mt-14">
              <ClipboardCheck size={40} color="#cbd5e1" />
              <Text className="text-gray-600 mt-3 text-center">
                {query || filtro !== "TODAS"
                  ? "Ninguna entrega coincide"
                  : "Aún no hay entregas en este curso"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const calificada = item.calificacion != null;
            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-gray-900" numberOfLines={1}>
                      {item.tareaTitulo}
                    </Text>
                    <Text
                      className="text-gray-600 text-xs mt-0.5"
                      numberOfLines={1}
                    >
                      {item.correoEstudiante}
                    </Text>
                  </View>
                  <View
                    className={`px-2.5 py-1 rounded-full ${calificada ? "bg-green-50" : "bg-amber-50"}`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${calificada ? "text-green-700" : "text-amber-700"}`}
                    >
                      {calificada
                        ? `${Number(item.calificacion).toFixed(1)} / 5.0`
                        : "Sin calificar"}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => abrir(item.urlArchivo)}
                  className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mt-3"
                >
                  <FileText size={16} color="#4b5563" />
                  <Text
                    className="flex-1 text-gray-800 text-sm mx-2"
                    numberOfLines={1}
                  >
                    {item.nombreArchivo}
                  </Text>
                  <Download size={16} color={theme.hex} />
                </Pressable>

                {!!item.observaciones && (
                  <Text className="text-gray-600 text-xs mt-2">
                    “{item.observaciones}”
                  </Text>
                )}

                <View className="flex-row items-center justify-between mt-3">
                  <Text className="text-gray-400 text-xs">
                    Entregada {fmt(item.fechaEntrega)}
                  </Text>
                  <Pressable
                    onPress={() => abrirCalificar(item)}
                    className={`${theme.btn} flex-row items-center px-4 h-9 rounded-full`}
                  >
                    <Star size={14} color="white" />
                    <Text className="text-white text-xs font-bold ml-1.5">
                      {calificada ? "Editar nota" : "Calificar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={!!sel}
        transparent
        animationType="slide"
        onRequestClose={() => setSel(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setSel(null)}
          >
            <Pressable className="bg-white rounded-t-3xl p-6 pb-10">
              <Text className="text-lg font-bold text-gray-900">
                Calificar entrega
              </Text>
              <Text className="text-gray-600 text-sm mb-4" numberOfLines={1}>
                {sel?.correoEstudiante} · {sel?.tareaTitulo}
              </Text>

              <Text className="font-bold text-gray-700 mb-2 text-sm">
                Nota (0.0 a 5.0)
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="4.5"
                placeholderTextColor="#9ca3af"
                value={nota}
                onChangeText={setNota}
                className={`w-full px-3 h-12 border rounded-xl mb-1 text-gray-900 ${errNota ? "border-red-400" : "border-gray-200"}`}
              />
              {!!errNota && (
                <Text className="text-red-600 text-xs mb-2">{errNota}</Text>
              )}

              <Text className="font-bold text-gray-700 mb-2 mt-3 text-sm">
                Observaciones (opcional)
              </Text>
              <TextInput
                multiline
                textAlignVertical="top"
                maxLength={255}
                placeholder="Comentarios para el estudiante"
                placeholderTextColor="#9ca3af"
                value={obs}
                onChangeText={setObs}
                className="w-full p-3 border border-gray-200 rounded-xl mb-5 h-24 text-gray-900"
              />

              <Pressable
                onPress={guardar}
                disabled={saving}
                className={`h-12 items-center justify-center rounded-xl mb-2 ${saving ? theme.btnOff : theme.btn}`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Guardar nota</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setSel(null)}
                className="items-center py-2"
              >
                <Text className="text-gray-600">Cancelar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
