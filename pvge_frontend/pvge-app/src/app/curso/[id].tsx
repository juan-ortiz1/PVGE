import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  Calendar,
  Lock,
  Plus,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

type Contenido = {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
};
type Tarea = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
};
type Curso = {
  id: number;
  titulo: string;
  descripcion: string;
  instructor: { nombre: string };
  inscrito: boolean;
};

const API = "http://localhost:8080/api";

const THEMES = [
  {
    header: "bg-blue-600",
    border: "border-blue-200",
    text: "text-blue-700",
    soft: "bg-blue-100",
    hex: "#2563eb",
  },
  {
    header: "bg-purple-600",
    border: "border-purple-200",
    text: "text-purple-700",
    soft: "bg-purple-100",
    hex: "#7c3aed",
  },
  {
    header: "bg-amber-700",
    border: "border-amber-200",
    text: "text-amber-800",
    soft: "bg-amber-100",
    hex: "#b45309",
  },
  {
    header: "bg-emerald-700",
    border: "border-emerald-200",
    text: "text-emerald-800",
    soft: "bg-emerald-100",
    hex: "#047857",
  },
  {
    header: "bg-rose-600",
    border: "border-rose-200",
    text: "text-rose-700",
    soft: "bg-rose-100",
    hex: "#e11d48",
  },
];

const fmtFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const estadoEntrega = (fecha: string) => {
  const horas = (new Date(fecha).getTime() - Date.now()) / 36e5;
  if (horas < 0)
    return {
      label: "Vencida",
      chip: "bg-red-50",
      text: "text-red-700",
      hex: "#b91c1c",
    };
  if (horas <= 72)
    return {
      label: "Vence pronto",
      chip: "bg-amber-50",
      text: "text-amber-700",
      hex: "#b45309",
    };
  return { label: null, chip: "", text: "text-gray-600", hex: "#6b7280" };
};

export default function CursoDetalle() {
  const { id, inscrito } = useLocalSearchParams<{
    id: string;
    inscrito: string;
  }>();
  const estaInscrito = inscrito === "true";
  const { accessToken, role, ready } = useAuth();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [tab, setTab] = useState<"contenidos" | "tareas">("contenidos");
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inscritoLocal, setInscritoLocal] = useState(estaInscrito);
  const [confirmar, setConfirmar] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [resCurso, resC, resT] = await Promise.all([
        fetch(`${API}/cursos/${id}`, { headers }),
        fetch(`${API}/contenidos/curso/${id}`, { headers }),
        fetch(`${API}/tareas/curso/${id}`, { headers }),
      ]);
      if (!resCurso.ok)
        throw new Error(`Error ${resCurso.status} al cargar el curso`);
      setCurso(await resCurso.json());

      const dataC = await resC.json().catch(() => []);
      setContenidos(Array.isArray(dataC) ? dataC : []);
      const dataT = await resT.json().catch(() => []);
      setTareas(Array.isArray(dataT) ? dataT : []);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudo cargar el curso");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      if (!accessToken) {
        router.replace("/");
        return;
      }
      fetchAll();
    }, [ready, accessToken]),
  );

  const contenidosOrdenados = useMemo(
    () => [...contenidos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    [contenidos],
  );

  const tareasOrdenadas = useMemo(() => {
    const now = Date.now();
    const ms = (x: Tarea) => new Date(x.fechaEntrega).getTime();
    const proximas = tareas
      .filter((x) => ms(x) >= now)
      .sort((a, b) => ms(a) - ms(b));
    const vencidas = tareas
      .filter((x) => ms(x) < now)
      .sort((a, b) => ms(b) - ms(a));
    return [...proximas, ...vencidas];
  }, [tareas]);

  const themeIdx = (Number(id) || 0) % THEMES.length;
  const theme = THEMES[themeIdx];
  const esInstructor = role === "INSTRUCTOR";

  const Header = ({ children }: { children?: React.ReactNode }) => (
    <View className={`${theme.header} px-6 pt-14 pb-10 rounded-b-[32px]`}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Volver"
        hitSlop={8}
        className="mb-4 self-start"
      >
        <ArrowLeft color="white" size={22} />
      </Pressable>
      <Text className="text-white text-xl font-bold" numberOfLines={2}>
        {curso?.titulo ?? ""}
      </Text>
      {curso?.instructor?.nombre && (
        <Text className="text-white/90 text-sm mt-1">
          {curso.instructor.nombre}
        </Text>
      )}
      {!!curso?.descripcion && (
        <Text className="text-white/90 text-sm mt-2" numberOfLines={2}>
          {curso.descripcion}
        </Text>
      )}
      {children}
    </View>
  );

  const confirmInscribir = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`${API}/cursos/inscribir/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status} al inscribirte`);
      setInscritoLocal(true);
      await fetchAll(); // recarga contenidos y tareas, que antes no eran accesibles
    } catch (e: any) {
      setError(e.message ?? "No se pudo completar la inscripción");
    } finally {
      setEnrolling(false);
      setConfirmar(false);
    }
  };

  // Estudiante sin inscripción
  if (!loading && role === "ESTUDIANTE" && curso && !inscritoLocal) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header />
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
            <Lock size={28} color="#6b7280" />
          </View>
          <Text className="text-gray-900 font-bold text-lg mt-4 text-center">
            Contenido bloqueado
          </Text>
          <Text className="text-gray-600 text-sm mt-1 text-center">
            Inscríbete a este curso para ver sus contenidos y tareas
          </Text>

          {error && (
            <Text className="text-red-600 text-xs mt-3 text-center">
              {error}
            </Text>
          )}

          <Pressable
            onPress={() => setConfirmar(true)}
            className={`${theme.header} h-11 px-8 items-center justify-center rounded-xl mt-6`}
          >
            <Text className="text-white font-bold text-sm">Inscribirme</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} className="py-3 mt-1">
            <Text className="text-gray-600 text-sm">Volver a los cursos</Text>
          </Pressable>
        </View>

        <ConfirmModal
          visible={confirmar}
          title="Inscribirse"
          message="¿Confirmas tu inscripción a este curso?"
          confirmText={enrolling ? "Inscribiendo..." : "Inscribirme"}
          onConfirm={confirmInscribir}
          onCancel={() => setConfirmar(false)}
        />
      </View>
    );
  }

  const tabs = [
    {
      key: "contenidos" as const,
      label: "Contenidos",
      count: contenidos.length,
      Icon: FileText,
    },
    {
      key: "tareas" as const,
      label: "Tareas",
      count: tareas.length,
      Icon: ClipboardList,
    },
  ];

  const vacio = (Icon: typeof FileText, texto: string) =>
    !loading ? (
      <View className="items-center mt-14">
        <Icon size={40} color="#cbd5e1" />
        <Text className="text-gray-600 mt-3 text-center">{texto}</Text>
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-gray-50">
      <Header />

      {/* Tabs */}
      <View
        className="flex-row mx-6 -mt-6 bg-white rounded-2xl p-1.5"
        style={{ elevation: 2 }}
      >
        {tabs.map(({ key, label, count, Icon }) => {
          const activo = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className={`flex-1 flex-row items-center justify-center gap-2 h-10 rounded-xl ${
                activo ? theme.header : ""
              }`}
            >
              <Icon size={16} color={activo ? "white" : "#6b7280"} />
              <Text
                className={`font-bold text-sm ${activo ? "text-white" : "text-gray-600"}`}
              >
                {label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Agregar (instructor) */}
      {esInstructor && (
        <View className="px-6 mt-4">
          <Pressable
            onPress={() =>
              router.push(
                tab === "contenidos"
                  ? `/instructorPage/crear-contenido?cursoId=${id}&t=${themeIdx}`
                  : `/instructorPage/crear-tarea?cursoId=${id}&t=${themeIdx}`,
              )
            }
            className={`h-11 bg-white border ${theme.border} flex-row items-center justify-center rounded-xl`}
          >
            <Plus size={16} color={theme.hex} />
            <Text className={`${theme.text} font-bold text-sm ml-1.5`}>
              {tab === "contenidos" ? "Agregar contenido" : "Agregar tarea"}
            </Text>
          </Pressable>
        </View>
      )}

      {error && <Text className="text-red-600 text-xs px-6 mt-3">{error}</Text>}

      {loading ? (
        <ActivityIndicator className="mt-16" color={theme.hex} />
      ) : tab === "contenidos" ? (
        <FlatList
          data={contenidosOrdenados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="p-6"
          refreshing={loading}
          onRefresh={fetchAll}
          ListEmptyComponent={vacio(
            FileText,
            esInstructor
              ? "Aún no hay contenidos. Agrega el primero con el botón de arriba"
              : "El instructor aún no ha publicado contenidos",
          )}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() =>
                router.push(`/curso/contenido/${item.id}?t=${themeIdx}`)
              }
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center"
              style={{ elevation: 1 }}
            >
              <View
                className={`w-9 h-9 rounded-full ${theme.soft} items-center justify-center mr-3`}
              >
                <Text className={`${theme.text} font-bold text-xs`}>
                  {index + 1}
                </Text>
              </View>
              <View className="flex-1 mr-2">
                <Text className="font-bold text-gray-900" numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text className="text-gray-600 text-xs" numberOfLines={1}>
                  {item.descripcion}
                </Text>
              </View>
              <ChevronRight size={18} color="#9ca3af" />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={tareasOrdenadas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="p-6"
          refreshing={loading}
          onRefresh={fetchAll}
          ListEmptyComponent={vacio(
            ClipboardList,
            esInstructor
              ? "Aún no hay tareas. Agrega la primera con el botón de arriba"
              : "No hay tareas por entregar",
          )}
          renderItem={({ item }) => {
            const est = estadoEntrega(item.fechaEntrega);
            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                style={{ elevation: 1 }}
              >
                <Text className="font-bold text-gray-900 mb-1">
                  {item.titulo}
                </Text>
                <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
                  {item.descripcion}
                </Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Calendar size={13} color={est.hex} />
                    <Text className={`${est.text} text-xs font-semibold ml-1`}>
                      Entrega: {fmtFecha(item.fechaEntrega)}
                    </Text>
                  </View>
                  {est.label && (
                    <View className={`${est.chip} px-2 py-0.5 rounded-full`}>
                      <Text className={`${est.text} text-[11px] font-bold`}>
                        {est.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
