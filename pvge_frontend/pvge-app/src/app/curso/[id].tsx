import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  ClipboardCheck,
  Calendar,
  Lock,
  Upload,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Pencil,
  Trash2,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
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
type Evaluacion = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaPublicacion: string;
  fechaVencimiento: string;
  puntajeTotal?: number;
  preguntas?: { puntaje: number }[];
};
type ProgCurso = {
  evaluacionesTotales: number;
  evaluacionesCompletadas: number;
};
type Tab = "contenidos" | "tareas" | "evaluaciones";

const API = "http://localhost:8080/api";

const THEMES = [
  {
    header: "bg-blue-600",
    text: "text-blue-700",
    soft: "bg-blue-100",
    hex: "#2563eb",
  },
  {
    header: "bg-purple-600",
    text: "text-purple-700",
    soft: "bg-purple-100",
    hex: "#7c3aed",
  },
  {
    header: "bg-amber-700",
    text: "text-amber-800",
    soft: "bg-amber-100",
    hex: "#b45309",
  },
  {
    header: "bg-emerald-700",
    text: "text-emerald-800",
    soft: "bg-emerald-100",
    hex: "#047857",
  },
  {
    header: "bg-rose-600",
    text: "text-rose-700",
    soft: "bg-rose-100",
    hex: "#e11d48",
  },
];

const TABS: { key: Tab; label: string; Icon: typeof FileText }[] = [
  { key: "contenidos", label: "Contenidos", Icon: FileText },
  { key: "tareas", label: "Tareas", Icon: ClipboardList },
  { key: "evaluaciones", label: "Evaluaciones", Icon: ClipboardCheck },
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

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

export default function CursoDetalle() {
  const { id, inscrito } = useLocalSearchParams<{
    id: string;
    inscrito: string;
  }>();
  const { accessToken, authFetch, role, ready } = useAuth();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [tab, setTab] = useState<Tab>("contenidos");
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorEval, setErrorEval] = useState<string | null>(null);

  // Estudiante
  const [inscritoLocal, setInscritoLocal] = useState(inscrito === "true");
  const [confirmar, setConfirmar] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [progCurso, setProgCurso] = useState<ProgCurso | null>(null);
  const [entregando, setEntregando] = useState<number | null>(null);
  // Solo en memoria: el backend no devuelve la entrega al listar tareas
  const [entregadas, setEntregadas] = useState<number[]>([]);
  const [msgTarea, setMsgTarea] = useState<string | null>(null);

  // Instructor: editar / eliminar contenido
  const [editCont, setEditCont] = useState<Contenido | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [descEdit, setDescEdit] = useState("");
  const [ordenEdit, setOrdenEdit] = useState("");
  const [delCont, setDelCont] = useState<Contenido | null>(null);
  const [savingCont, setSavingCont] = useState(false);
  const [msgCont, setMsgCont] = useState<string | null>(null);

  const esInstructor = role === "INSTRUCTOR";
  const esEstudiante = role === "ESTUDIANTE";
  const themeIdx = (Number(id) || 0) % THEMES.length;
  const theme = THEMES[themeIdx];

  const fetchAll = async () => {
    try {
      const [resCurso, resC, resT, resE] = await Promise.all([
        authFetch(`${API}/cursos/${id}`),
        authFetch(`${API}/contenidos/curso/${id}`),
        authFetch(`${API}/tareas/curso/${id}`),
        authFetch(`${API}/evaluaciones/curso/${id}`),
      ]);

      if (!resCurso.ok)
        throw new Error(`Error ${resCurso.status} al cargar el curso`);
      setCurso(await resCurso.json());

      const dataC = parse(await resC.text());
      setContenidos(Array.isArray(dataC) ? dataC : []);
      const dataT = parse(await resT.text());
      setTareas(Array.isArray(dataT) ? dataT : []);

      const dataE = parse(await resE.text());
      setEvaluaciones(resE.ok && Array.isArray(dataE) ? dataE : []);
      setErrorEval(resE.ok ? null : (dataE?.message ?? `Error ${resE.status}`));

      if (esEstudiante) {
        const resP = await fetch(`${API}/progreso/cursos/${id}`).catch(
          () => null,
        );
        setProgCurso(resP?.ok ? parse(await resP.text()) : null);
      }
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

  // ---------- Estudiante ----------
  const confirmInscribir = async () => {
    setEnrolling(true);
    try {
      const res = await authFetch(`${API}/cursos/inscribir/${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Error ${res.status} al inscribirte`);
      setInscritoLocal(true);
      await fetchAll();
    } catch (e: any) {
      setError(e.message ?? "No se pudo completar la inscripción");
    } finally {
      setEnrolling(false);
      setConfirmar(false);
    }
  };

  const confirmDesinscribir = async () => {
    try {
      const res = await authFetch(`${API}/cursos/inscribir/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Error ${res.status} al salir del curso`);
      setInscritoLocal(false);
      setContenidos([]);
      setTareas([]);
      setEvaluaciones([]);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "No se pudo cancelar la inscripción");
    } finally {
      setLeaveModal(false);
    }
  };

  const entregar = async (tareaId: number) => {
    const r = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (r.canceled) return;
    const f = r.assets[0];

    setEntregando(tareaId);
    setMsgTarea(null);
    try {
      const fd = new FormData();
      if (Platform.OS === "web") {
        const blob = f.file ?? (await (await fetch(f.uri)).blob());
        fd.append("archivo", blob, f.name);
      } else {
        fd.append("archivo", {
          uri: f.uri,
          name: f.name,
          type: f.mimeType ?? "application/octet-stream",
        } as any);
      }

      // Sin Content-Type: el boundary lo agrega fetch
      const res = await authFetch(`${API}/tareas/${tareaId}/entregas`, {
        method: "POST",
        body: fd,
      });
      const data = parse(await res.text());
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);

      setEntregadas((p) => (p.includes(tareaId) ? p : [...p, tareaId]));
    } catch (e: any) {
      setMsgTarea(e.message);
    } finally {
      setEntregando(null);
    }
  };

  // true = hecha, false = no hecha, null = no se puede saber
  const hechaDe = (): boolean | null => {
    if (!esEstudiante || !progCurso) return null;
    if (progCurso.evaluacionesCompletadas === 0) return false;
    if (progCurso.evaluacionesCompletadas >= evaluaciones.length) return true;
    return null;
  };

  const hayAmbiguas =
    esEstudiante &&
    !!progCurso &&
    progCurso.evaluacionesCompletadas > 0 &&
    progCurso.evaluacionesCompletadas < evaluaciones.length;

  // ---------- Instructor: contenido ----------
  const abrirEditCont = (c: Contenido) => {
    setEditCont(c);
    setNombreEdit(c.nombre);
    setDescEdit(c.descripcion);
    setOrdenEdit(c.orden != null ? String(c.orden) : "");
  };

  const guardarCont = async () => {
    if (!editCont || !nombreEdit.trim() || !descEdit.trim()) return;
    setSavingCont(true);
    setMsgCont(null);
    try {
      // El request usa "titulo"; la respuesta devuelve "nombre"
      const res = await authFetch(`${API}/contenidos/${editCont.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: nombreEdit.trim(),
          descripcion: descEdit.trim(),
          cursoId: Number(id),
          orden: ordenEdit ? Number(ordenEdit) : undefined,
        }),
      });
      const data = parse(await res.text());
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
      setEditCont(null);
      await fetchAll();
    } catch (e: any) {
      setMsgCont(e.message);
    } finally {
      setSavingCont(false);
    }
  };

  const eliminarCont = async () => {
    if (!delCont) return;
    try {
      const res = await authFetch(`${API}/contenidos/${delCont.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Error ${res.status} al eliminar`);
      setContenidos((p) => p.filter((c) => c.id !== delCont.id));
    } catch (e: any) {
      setMsgCont(e.message);
    } finally {
      setDelCont(null);
    }
  };

  // ---------- Derivados ----------
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

  const Header = () => (
    <View className={`${theme.header} px-6 pt-14 pb-10 rounded-b-[32px]`}>
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        {esEstudiante && inscritoLocal && (
          <Pressable
            onPress={() => setLeaveModal(true)}
            className="bg-white/15 flex-row items-center px-3 h-8 rounded-full"
          >
            <LogOut size={14} color="white" />
            <Text className="text-white text-xs font-bold ml-1.5">
              Salir del curso
            </Text>
          </Pressable>
        )}
      </View>

      <Text className="text-white text-xl font-bold" numberOfLines={2}>
        {curso?.titulo ?? ""}
      </Text>
      {!!curso?.instructor?.nombre && (
        <Text className="text-white/90 text-sm mt-1">
          {curso.instructor.nombre}
        </Text>
      )}
      {!!curso?.descripcion && (
        <Text className="text-white/90 text-sm mt-2" numberOfLines={2}>
          {curso.descripcion}
        </Text>
      )}
    </View>
  );

  const vacio = (Icon: typeof FileText, texto: string) =>
    !loading ? (
      <View className="items-center mt-14">
        <Icon size={40} color="#cbd5e1" />
        <Text className="text-gray-600 mt-3 text-center">{texto}</Text>
      </View>
    ) : null;

  // Estudiante sin inscripción
  if (!loading && esEstudiante && curso && !inscritoLocal) {
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
            Inscríbete a este curso para ver sus contenidos, tareas y
            evaluaciones
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

  const nombreTab = {
    contenidos: "contenido",
    tareas: "tarea",
    evaluaciones: "evaluación",
  }[tab];
  const rutaCrear = {
    contenidos: "crear-contenido",
    tareas: "crear-tarea",
    evaluaciones: "crear-evaluacion",
  }[tab];

  return (
    <View className="flex-1 bg-gray-50">
      <Header />

      {/* Tabs */}
      <View className="flex-row mx-6 -mt-4 bg-white rounded-2xl p-1.5 shadow-sm">
        {TABS.map(({ key, label, Icon }) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            className={`flex-1 flex-row items-center justify-center gap-1 h-10 rounded-xl ${
              tab === key ? theme.header : ""
            }`}
          >
            <Icon size={14} color={tab === key ? "white" : "#6b7280"} />
            <Text
              className={`font-bold text-xs ${tab === key ? "text-white" : "text-gray-500"}`}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Agregar (instructor) */}
      {esInstructor && (
        <View className="px-6 mt-4">
          <Pressable
            onPress={() =>
              router.push(
                `/instructorPage/${rutaCrear}?cursoId=${id}&t=${themeIdx}` as any,
              )
            }
            className={`h-11 bg-white border ${theme.soft.replace("bg-", "border-")} items-center justify-center rounded-xl`}
          >
            <Text className={`${theme.text} font-bold text-sm`}>
              + Agregar {nombreTab}
            </Text>
          </Pressable>
        </View>
      )}

      {error && <Text className="text-red-600 text-xs px-6 mt-3">{error}</Text>}
      {tab === "tareas" && msgTarea && (
        <Text className="text-red-600 text-xs px-6 mt-3">{msgTarea}</Text>
      )}
      {tab === "contenidos" && msgCont && (
        <Text className="text-red-600 text-xs px-6 mt-3">{msgCont}</Text>
      )}

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
                router.push(`/curso/contenido/${item.id}?t=${themeIdx}` as any)
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

              {esInstructor && (
                <View className="flex-row items-center mr-1">
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      abrirEditCont(item);
                    }}
                    hitSlop={8}
                    className="p-2"
                  >
                    <Pencil size={16} color="#2563eb" />
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setDelCont(item);
                    }}
                    hitSlop={8}
                    className="p-2"
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </Pressable>
                </View>
              )}
              <ChevronRight size={18} color="#9ca3af" />
            </Pressable>
          )}
        />
      ) : tab === "tareas" ? (
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
            const vencida = est.label === "Vencida";
            const entregada = entregadas.includes(item.id);
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

                {esEstudiante && !vencida && (
                  <Pressable
                    onPress={() => entregar(item.id)}
                    disabled={entregando === item.id}
                    className={`mt-3 h-10 rounded-xl flex-row items-center justify-center ${
                      entregada ? "bg-green-50" : "bg-blue-600"
                    }`}
                  >
                    {entregada ? (
                      <CheckCircle2 size={15} color="#16a34a" />
                    ) : (
                      <Upload size={15} color="white" />
                    )}
                    <Text
                      className={`font-bold text-sm ml-2 ${
                        entregada ? "text-green-700" : "text-white"
                      }`}
                    >
                      {entregando === item.id
                        ? "Subiendo..."
                        : entregada
                          ? "Entregada · Reemplazar"
                          : "Entregar archivo"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={evaluaciones}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="p-6"
          refreshing={loading}
          onRefresh={fetchAll}
          ListHeaderComponent={
            hayAmbiguas ? (
              <View className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-3">
                <Text className="text-amber-800 text-xs">
                  Completaste {progCurso?.evaluacionesCompletadas} de{" "}
                  {progCurso?.evaluacionesTotales} evaluaciones. El sistema no
                  indica cuáles.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            errorEval
              ? vacio(ClipboardCheck, errorEval)
              : vacio(
                  ClipboardCheck,
                  esInstructor
                    ? "Aún no hay evaluaciones. Crea la primera con el botón de arriba"
                    : "No hay evaluaciones disponibles",
                )
          }
          renderItem={({ item }) => {
            const ahora = Date.now();
            const pendiente = new Date(item.fechaPublicacion).getTime() > ahora;
            const vencida = new Date(item.fechaVencimiento).getTime() < ahora;
            const hecha = hechaDe();
            const total =
              item.puntajeTotal ??
              item.preguntas?.reduce((s, p) => s + p.puntaje, 0) ??
              0;

            const estado = hecha
              ? "Completada"
              : hecha === false && vencida
                ? "No realizada"
                : pendiente
                  ? "Próximamente"
                  : vencida
                    ? "Vencida"
                    : "Disponible";
            const estadoCls = hecha
              ? "bg-green-50 text-green-700"
              : hecha === false && vencida
                ? "bg-red-50 text-red-700"
                : pendiente
                  ? "bg-amber-50 text-amber-700"
                  : vencida
                    ? "bg-gray-100 text-gray-500"
                    : "bg-green-50 text-green-700";

            return (
              <Pressable
                onPress={() =>
                  router.push(
                    `/curso/evaluacion/${item.id}?t=${themeIdx}` as any,
                  )
                }
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-start justify-between mb-1">
                  <Text
                    className="font-bold text-gray-900 flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {item.titulo}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${estadoCls}`}
                  >
                    {estado}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>
                  {item.descripcion}
                </Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Calendar size={13} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-semibold ml-1">
                      Vence: {fmtFecha(item.fechaVencimiento)}
                    </Text>
                  </View>
                  {total > 0 && (
                    <Text className="text-gray-400 text-xs">{total} pts</Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <ConfirmModal
        visible={leaveModal}
        title="Salir del curso"
        message="Dejarás de tener acceso a sus contenidos, tareas y evaluaciones."
        confirmText="Salir"
        destructive
        onConfirm={confirmDesinscribir}
        onCancel={() => setLeaveModal(false)}
      />

      <ConfirmModal
        visible={!!delCont}
        title="Eliminar contenido"
        message="Se eliminará este contenido. ¿Continuar?"
        confirmText="Eliminar"
        destructive
        onConfirm={eliminarCont}
        onCancel={() => setDelCont(null)}
      />

      {/* Editar contenido (instructor) */}
      <Modal
        visible={!!editCont}
        transparent
        animationType="slide"
        onRequestClose={() => setEditCont(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setEditCont(null)}
          >
            <Pressable className="bg-white rounded-t-3xl p-6 pb-10">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Editar contenido
              </Text>
              <TextInput
                className="w-full px-3 h-12 border border-gray-200 rounded-xl mb-3 text-gray-900"
                placeholder="Título"
                maxLength={255}
                value={nombreEdit}
                onChangeText={setNombreEdit}
              />
              <TextInput
                multiline
                textAlignVertical="top"
                maxLength={255}
                className="w-full p-3 border border-gray-200 rounded-xl mb-3 h-28 text-gray-900"
                placeholder="Descripción"
                value={descEdit}
                onChangeText={setDescEdit}
              />
              <TextInput
                keyboardType="numeric"
                className="w-full px-3 h-12 border border-gray-200 rounded-xl mb-5 text-gray-900"
                placeholder="Orden (opcional)"
                value={ordenEdit}
                onChangeText={setOrdenEdit}
              />
              <Pressable
                onPress={guardarCont}
                disabled={savingCont || !nombreEdit.trim() || !descEdit.trim()}
                className={`h-12 items-center justify-center rounded-xl mb-2 ${
                  savingCont || !nombreEdit.trim() || !descEdit.trim()
                    ? "bg-blue-300"
                    : "bg-blue-600"
                }`}
              >
                {savingCont ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Guardar cambios</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setEditCont(null)}
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
