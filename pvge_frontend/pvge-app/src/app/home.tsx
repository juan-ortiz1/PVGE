import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Search,
  GraduationCap,
  Power,
  Sparkles,
  Pencil,
  Plus,
  Check,
  X,
  BookOpen,
  ChevronRight,
} from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

type Curso = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  instructor: { nombre: string; disciplina?: string; tier?: number };
  inscrito: boolean;
};

type Progreso = {
  cursoId: number;
  cursoTitulo: string;
  evaluacionesTotales: number;
  evaluacionesCompletadas: number;
  porcentajeCompletado: number;
  puntajeObtenido: number;
  puntajeTotal: number;
};

const API = "http://localhost:8080/api/cursos";

const COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700", hex: "#2563eb" },
  { bg: "bg-purple-100", text: "text-purple-700", hex: "#7c3aed" },
  { bg: "bg-amber-100", text: "text-amber-800", hex: "#b45309" },
  { bg: "bg-emerald-100", text: "text-emerald-800", hex: "#047857" },
  { bg: "bg-rose-100", text: "text-rose-700", hex: "#e11d48" },
];

const colorFor = (id: number) => COLORS[id % COLORS.length];

const shadow = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

// El backend manda porcentajeCompletado de 0 a 100
const pct = (p: number) => Math.round(Math.min(100, Math.max(0, p ?? 0)));

const esNuevo = (fecha: string) =>
  (Date.now() - new Date(fecha).getTime()) / 864e5 <= 7;

const fmt = (f: string) =>
  new Date(f).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
};

const Stat = ({ value, label }: { value: string | number; label: string }) => (
  <View className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
    <Text className="text-white text-2xl font-bold">{value}</Text>
    <Text className="text-blue-100 text-xs mt-0.5">{label}</Text>
  </View>
);

type Filtro = "TODOS" | "INSCRITOS" | "DISPONIBLES";

export default function Home() {
  const { role, accessToken, authFetch, ready, logout } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logoutModal, setLogoutModal] = useState(false);
  const [inscribirId, setInscribirId] = useState<number | null>(null);

  const [editando, setEditando] = useState<Curso | null>(null);
  const [tituloEdit, setTituloEdit] = useState("");
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [saving, setSaving] = useState(false);

  const esInstructor = role === "INSTRUCTOR";
  const perfil = esInstructor ? cursos[0]?.instructor : null;

  const fetchProgreso = async () => {
    try {
      const res = await authFetch("http://localhost:8080/api/progreso");
      if (!res.ok) return;
      const data = await res.json();
      setProgreso(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCursos = async (titulo?: string) => {
    try {
      const url = esInstructor
        ? `${API}/miscursos`
        : titulo
          ? `${API}?titulo=${encodeURIComponent(titulo)}`
          : API;
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setCursos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudieron cargar los cursos");
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
      if (role === "ESTUDIANTE") fetchProgreso();
      fetchCursos();
    }, [ready, accessToken, role]),
  );

  const confirmInscribir = async () => {
    if (inscribirId == null) return;
    try {
      const res = await authFetch(`${API}/inscribir/${inscribirId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Error ${res.status} al inscribirte`);
      setCursos((prev) =>
        prev.map((c) => (c.id === inscribirId ? { ...c, inscrito: true } : c)),
      );
      fetchProgreso();
    } catch (e: any) {
      setError(e.message ?? "No se pudo completar la inscripción");
    } finally {
      setInscribirId(null);
    }
  };

  const confirmLogout = async () => {
    setLogoutModal(false);
    await logout();
    router.replace("/");
  };

  const openEdit = (curso: Curso) => {
    setEditando(curso);
    setTituloEdit(curso.titulo);
    setDescripcionEdit(curso.descripcion);
  };

  const handleUpdate = async () => {
    if (!editando || !tituloEdit.trim() || !descripcionEdit.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API}/${editando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: tituloEdit.trim(),
          descripcion: descripcionEdit.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status} al guardar`);
      setCursos((prev) =>
        prev.map((c) =>
          c.id === editando.id
            ? {
                ...c,
                titulo: tituloEdit.trim(),
                descripcion: descripcionEdit.trim(),
              }
            : c,
        ),
      );
      setEditando(null);
    } catch (e: any) {
      setError(e.message ?? "No se pudo guardar el curso");
    } finally {
      setSaving(false);
    }
  };

  const inscritosCount = cursos.filter((c) => c.inscrito).length;

  const progMap = useMemo(
    () => Object.fromEntries(progreso.map((p) => [p.cursoId, p])),
    [progreso],
  );

  // Promedio solo de cursos que tienen evaluaciones
  const conEvals = progreso.filter((p) => p.evaluacionesTotales > 0);
  const avance = conEvals.length
    ? Math.round(
        conEvals.reduce((s, p) => s + pct(p.porcentajeCompletado), 0) /
          conEvals.length,
      )
    : 0;

  const lista = useMemo(() => {
    if (esInstructor) return cursos;
    if (filtro === "INSCRITOS") return cursos.filter((c) => c.inscrito);
    if (filtro === "DISPONIBLES") return cursos.filter((c) => !c.inscrito);
    return cursos;
  }, [cursos, filtro, esInstructor]);

  const chips: { key: Filtro; label: string }[] = [
    { key: "TODOS", label: `Todos · ${cursos.length}` },
    { key: "INSCRITOS", label: `Inscritos · ${inscritosCount}` },
    {
      key: "DISPONIBLES",
      label: `Sin inscribir · ${cursos.length - inscritosCount}`,
    },
  ];

  const ListHeader = !esInstructor ? (
    <View className="flex-row flex-wrap gap-2 mb-4">
      {chips.map((c) => {
        const activo = filtro === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => setFiltro(c.key)}
            className={`px-4 h-9 items-center justify-center rounded-full border ${
              activo
                ? "bg-blue-600 border-blue-600"
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
  ) : (
    <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
      Administra tus cursos
    </Text>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-14 pb-6 rounded-b-[36px] overflow-hidden">
        <View
          style={{
            position: "absolute",
            right: -50,
            top: -50,
            width: 190,
            height: 190,
            borderRadius: 95,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: -40,
            bottom: -60,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 38, height: 38 }}
              resizeMode="contain"
            />
            <Text className="text-white text-lg font-bold ml-2">Mentum</Text>
          </View>
          <Pressable
            onPress={() => setLogoutModal(true)}
            accessibilityLabel="Cerrar sesión"
            hitSlop={8}
            className="bg-white/15 p-2.5 rounded-full"
          >
            <Power color="white" size={18} />
          </Pressable>
        </View>

        <Text className="text-blue-100 text-sm mt-6">{saludo()}</Text>
        <Text className="text-white text-2xl font-bold">
          {esInstructor ? "Tus cursos" : "Explora cursos"}
        </Text>
        <Text className="text-blue-100 text-sm mt-1">
          {esInstructor
            ? perfil?.disciplina
              ? `Instructor · ${perfil.disciplina}`
              : "Panel de instructor"
            : "Encuentra tu próximo curso en Mentum"}
        </Text>

        <View className="flex-row gap-3 mt-5">
          {esInstructor ? (
            <>
              <Stat value={cursos.length} label="Cursos creados" />
              <Stat value={perfil?.tier ?? "—"} label="Tier" />
            </>
          ) : (
            <>
              <Stat value={cursos.length} label="Disponibles" />
              <Stat value={inscritosCount} label="Inscritos" />
              <Stat value={`${avance}%`} label="Avance" />
            </>
          )}
        </View>

        {!esInstructor && (
          <View
            className="flex-row items-center bg-white rounded-2xl px-4 h-12 mt-4"
            style={shadow}
          >
            <Pressable onPress={() => fetchCursos(query)} hitSlop={8}>
              <Search size={18} color="#9ca3af" />
            </Pressable>
            <TextInput
              placeholder="Buscar por título..."
              placeholderTextColor="#9ca3af"
              returnKeyType="search"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (text === "") fetchCursos();
              }}
              onSubmitEditing={() => fetchCursos(query)}
              className="flex-1 ml-3 text-gray-900"
            />
            {query !== "" && (
              <Pressable
                onPress={() => {
                  setQuery("");
                  fetchCursos();
                }}
                accessibilityLabel="Limpiar búsqueda"
                hitSlop={8}
              >
                <X size={16} color="#6b7280" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {error && (
        <View className="mx-6 mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-xs">{error}</Text>
        </View>
      )}

      {/* Listado */}
      {loading && cursos.length === 0 ? (
        <ActivityIndicator className="mt-16" color="#2563eb" />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName={`px-6 pt-5 ${esInstructor ? "pb-28" : "pb-10"}`}
          refreshing={loading}
          onRefresh={() => fetchCursos()}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View className="items-center mt-12">
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center">
                <GraduationCap size={38} color="#93c5fd" />
              </View>
              <Text className="text-gray-700 font-bold mt-4 text-center">
                {esInstructor
                  ? "Aún no has creado cursos"
                  : filtro === "INSCRITOS"
                    ? "Todavía no te has inscrito a ningún curso"
                    : filtro === "DISPONIBLES"
                      ? "Ya estás inscrito en todos los cursos"
                      : "No hay cursos disponibles"}
              </Text>
              {esInstructor && (
                <Text className="text-gray-500 text-sm mt-1 text-center">
                  Crea el primero con el botón de abajo
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const color = colorFor(item.id);
            const inicial =
              item.instructor?.nombre?.charAt(0)?.toUpperCase() ?? "?";
            const p = item.inscrito ? progMap[item.id] : undefined;

            return (
              <Pressable
                onPress={() =>
                  router.push(
                    `/curso/${item.id}?inscrito=${item.inscrito}` as any,
                  )
                }
                className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-100"
                style={shadow}
              >
                <View style={{ height: 5, backgroundColor: color.hex }} />

                <View className="p-4">
                  <View className="flex-row items-start">
                    <View
                      className={`w-12 h-12 rounded-2xl ${color.bg} items-center justify-center mr-3`}
                    >
                      <BookOpen size={22} color={color.hex} />
                    </View>

                    <View className="flex-1 mr-2">
                      <Text
                        className="font-bold text-base text-gray-900"
                        numberOfLines={2}
                      >
                        {item.titulo}
                      </Text>
                      {!esInstructor && (
                        <View className="flex-row items-center mt-1">
                          <View
                            className={`w-5 h-5 rounded-full ${color.bg} items-center justify-center mr-1.5`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${color.text}`}
                            >
                              {inicial}
                            </Text>
                          </View>
                          <Text
                            className="text-gray-500 text-xs"
                            numberOfLines={1}
                          >
                            {item.instructor?.nombre}
                          </Text>
                        </View>
                      )}
                    </View>

                    {esInstructor ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          openEdit(item);
                        }}
                        accessibilityLabel={`Editar ${item.titulo}`}
                        hitSlop={10}
                        className="bg-blue-50 p-2.5 rounded-full"
                      >
                        <Pencil size={16} color="#2563eb" />
                      </Pressable>
                    ) : (
                      esNuevo(item.fechaCreacion) && (
                        <View className="bg-amber-50 flex-row items-center px-2.5 py-1 rounded-full">
                          <Sparkles size={10} color="#b45309" />
                          <Text className="text-amber-700 text-[10px] font-bold ml-1">
                            Nuevo
                          </Text>
                        </View>
                      )
                    )}
                  </View>

                  <Text
                    className="text-gray-600 text-sm mt-3 leading-5"
                    numberOfLines={2}
                  >
                    {item.descripcion}
                  </Text>

                  {p && p.evaluacionesTotales > 0 && (
                    <View className="mt-4">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-gray-500 text-xs">
                          {p.evaluacionesCompletadas}/{p.evaluacionesTotales}{" "}
                          evaluaciones
                        </Text>
                        <Text className={`text-xs font-bold ${color.text}`}>
                          {pct(p.porcentajeCompletado)}%
                        </Text>
                      </View>
                      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View
                          style={{
                            height: 8,
                            width: `${pct(p.porcentajeCompletado)}%`,
                            backgroundColor: color.hex,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <Text className="text-gray-400 text-xs">
                      {esInstructor ? "Creado" : "Publicado"}{" "}
                      {fmt(item.fechaCreacion)}
                    </Text>

                    {esInstructor ? (
                      <View className="flex-row items-center">
                        <Text className="text-blue-600 text-xs font-bold">
                          Administrar
                        </Text>
                        <ChevronRight size={16} color="#2563eb" />
                      </View>
                    ) : item.inscrito ? (
                      <View className="bg-green-50 flex-row items-center px-3 h-9 rounded-full">
                        <Check size={14} color="#15803d" />
                        <Text className="text-green-700 text-xs font-bold ml-1">
                          Continuar
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setInscribirId(item.id);
                        }}
                        className="bg-blue-600 px-5 h-9 items-center justify-center rounded-full"
                      >
                        <Text className="text-white text-xs font-bold">
                          Inscribirse
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Crear curso (instructor) */}
      {esInstructor && (
        <Pressable
          onPress={() => router.push("/instructorPage/crear-curso")}
          className="absolute bottom-6 right-6 h-14 px-6 bg-blue-600 rounded-full flex-row items-center"
          style={{ ...shadow, shadowOpacity: 0.25, elevation: 6 }}
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-bold ml-2">Crear curso</Text>
        </Pressable>
      )}

      <ConfirmModal
        visible={logoutModal}
        title="Cerrar sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Cerrar sesión"
        destructive
        onConfirm={confirmLogout}
        onCancel={() => setLogoutModal(false)}
      />
      <ConfirmModal
        visible={inscribirId !== null}
        title="Inscribirse"
        message="¿Confirmas tu inscripción a este curso?"
        confirmText="Inscribirme"
        onConfirm={confirmInscribir}
        onCancel={() => setInscribirId(null)}
      />

      {/* Editar curso (instructor) */}
      <Modal
        visible={!!editando}
        transparent
        animationType="slide"
        onRequestClose={() => setEditando(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setEditando(null)}
          >
            <Pressable className="bg-white rounded-t-3xl p-6 pb-10">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Editar curso
              </Text>

              <Text className="font-bold text-gray-700 mb-2 text-sm">
                Título
              </Text>
              <TextInput
                className="w-full px-3 h-12 bg-white border border-gray-200 rounded-xl mb-4 text-gray-900"
                value={tituloEdit}
                onChangeText={setTituloEdit}
              />

              <Text className="font-bold text-gray-700 mb-2 text-sm">
                Descripción
              </Text>
              <TextInput
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="w-full p-3 bg-white border border-gray-200 rounded-xl mb-5 h-28 text-gray-900"
                value={descripcionEdit}
                onChangeText={setDescripcionEdit}
              />

              <Pressable
                onPress={handleUpdate}
                disabled={
                  saving || !tituloEdit.trim() || !descripcionEdit.trim()
                }
                className={`h-12 items-center justify-center rounded-xl mb-2 ${
                  saving || !tituloEdit.trim() || !descripcionEdit.trim()
                    ? "bg-blue-300"
                    : "bg-blue-600"
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Guardar cambios</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setEditando(null)}
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
