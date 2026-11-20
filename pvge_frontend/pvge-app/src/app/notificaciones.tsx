import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  ClipboardList,
  ClipboardCheck,
  FileText,
  Paperclip,
  Star,
  RefreshCw,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8080/api";

const TIPOS: Record<string, { Icon: typeof Bell; bg: string; hex: string }> = {
  NUEVA_TAREA: { Icon: ClipboardList, bg: "bg-blue-100", hex: "#2563eb" },
  TAREA_CALIFICADA: { Icon: Star, bg: "bg-green-100", hex: "#15803d" },
  NUEVO_CONTENIDO: { Icon: FileText, bg: "bg-purple-100", hex: "#7c3aed" },
  CONTENIDO_ACTUALIZADO: {
    Icon: RefreshCw,
    bg: "bg-purple-100",
    hex: "#7c3aed",
  },
  NUEVO_RECURSO: { Icon: Paperclip, bg: "bg-amber-100", hex: "#b45309" },
  NUEVA_EVALUACION: { Icon: ClipboardCheck, bg: "bg-rose-100", hex: "#e11d48" },
  CURSO_ACTUALIZADO: { Icon: RefreshCw, bg: "bg-gray-100", hex: "#4b5563" },
};

type Notif = {
  id: number;
  cursoId: number | null;
  cursoTitulo: string | null;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaId: number | null;
  leida: boolean;
  fechaCreacion: string;
};

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

const hace = (f: string) => {
  const m = Math.floor((Date.now() - new Date(f).getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `hace ${d} d` : new Date(f).toLocaleDateString("es-CO");
};

export default function Notificaciones() {
  const { accessToken, authFetch, ready, role } = useAuth();
  const logueado = !!accessToken;
  const [lista, setLista] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const res = await authFetch(`${API}/notificaciones`);
      const data = parse(await res.text());
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
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
    }, [ready, logueado]),
  );

  const abrir = async (n: Notif) => {
    if (!n.leida) {
      setLista((p) =>
        p.map((x) => (x.id === n.id ? { ...x, leida: true } : x)),
      );
      authFetch(`${API}/notificaciones/${n.id}/leida`, { method: "PUT" }).catch(
        () => {},
      );
    }
    const insc = role === "ESTUDIANTE";
    const curso = `/curso/${n.cursoId}?inscrito=${insc}`;

    if (n.tipo === "NUEVA_EVALUACION" && n.referenciaId)
      return router.push(`/curso/evaluacion/${n.referenciaId}` as any);
    if (n.tipo === "NUEVO_RECURSO" && n.referenciaId)
      return router.push(`/curso/contenido/${n.referenciaId}` as any);
    if (n.tipo === "NUEVA_TAREA" && n.cursoId)
      return router.push(
        `/curso/${n.cursoId}?inscrito=${insc}&tab=tareas` as any,
      );
    if (n.tipo === "TAREA_CALIFICADA" && n.cursoId)
      return router.push(
        `/curso/${n.cursoId}?inscrito=${insc}&tab=tareas` as any,
      );
    if (n.cursoId) router.push(curso as any);
  };

  const leerTodas = async () => {
    try {
      const res = await authFetch(`${API}/notificaciones/leer-todas`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setLista((p) => p.map((x) => ({ ...x, leida: true })));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const sinLeer = lista.filter((n) => !n.leida).length;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-600 px-6 pt-14 pb-6 rounded-b-[32px]">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Volver"
            hitSlop={8}
          >
            <ArrowLeft color="white" size={22} />
          </Pressable>
          {sinLeer > 0 && (
            <Pressable
              onPress={leerTodas}
              className="bg-white/15 flex-row items-center px-3 h-8 rounded-full"
            >
              <CheckCheck size={14} color="white" />
              <Text className="text-white text-xs font-bold ml-1.5">
                Marcar todas
              </Text>
            </Pressable>
          )}
        </View>
        <Text className="text-white text-2xl font-bold">Notificaciones</Text>
        <Text className="text-blue-100 text-sm mt-1">
          {sinLeer === 0 ? "Estás al día" : `${sinLeer} sin leer`}
        </Text>
      </View>

      {error && (
        <View className="mx-6 mt-4 bg-red-50 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-xs">{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator className="mt-16" color="#2563eb" />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(n) => n.id.toString()}
          contentContainerClassName="px-6 pt-5 pb-10"
          refreshing={loading}
          onRefresh={cargar}
          ListEmptyComponent={
            <View className="items-center mt-14">
              <Bell size={40} color="#cbd5e1" />
              <Text className="text-gray-600 mt-3">
                No tienes notificaciones
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => abrir(item)}
              className={`rounded-2xl p-4 mb-3 border flex-row ${
                item.leida
                  ? "bg-white border-gray-100"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              {(() => {
                const t = TIPOS[item.tipo] ?? {
                  Icon: Bell,
                  bg: "bg-gray-100",
                  hex: "#4b5563",
                };
                return (
                  <View
                    className={`w-10 h-10 rounded-xl ${t.bg} items-center justify-center mr-3`}
                  >
                    <t.Icon size={18} color={t.hex} />
                    {!item.leida && (
                      <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                    )}
                  </View>
                );
              })()}
              <View className="flex-1">
                <Text className="font-bold text-gray-900">{item.titulo}</Text>
                <Text className="text-gray-700 text-sm mt-0.5">
                  {item.mensaje}
                </Text>
                <Text className="text-gray-400 text-xs mt-2" numberOfLines={1}>
                  {item.cursoTitulo ? `${item.cursoTitulo} · ` : ""}
                  {hace(item.fechaCreacion)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
