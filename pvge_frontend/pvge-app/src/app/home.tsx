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
  Briefcase,
  Award,
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

const API = "http://localhost:8080/api/cursos";

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700", hex: "#2563eb" },
  { bg: "bg-purple-100", text: "text-purple-700", hex: "#7c3aed" },
  { bg: "bg-amber-100", text: "text-amber-800", hex: "#b45309" },
  { bg: "bg-emerald-100", text: "text-emerald-800", hex: "#047857" },
  { bg: "bg-rose-100", text: "text-rose-700", hex: "#e11d48" },
];

const colorFor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const esNuevo = (fecha: string) => {
  const dias = (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24);
  return dias <= 7;
};

type Filtro = "TODOS" | "INSCRITOS" | "DISPONIBLES";

export default function Home() {
  const { role, accessToken, ready, logout } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
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

  const fetchCursos = async (titulo?: string) => {
    try {
      const url = esInstructor
        ? `${API}/miscursos`
        : titulo
          ? `${API}?titulo=${encodeURIComponent(titulo)}`
          : API;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
      fetchCursos();
    }, [ready, accessToken, role]),
  );

  const confirmInscribir = async () => {
    if (inscribirId == null) return;
    try {
      const res = await fetch(`${API}/inscribir/${inscribirId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status} al inscribirte`);
      setCursos((prev) =>
        prev.map((c) => (c.id === inscribirId ? { ...c, inscrito: true } : c)),
      );
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
      const res = await fetch(`${API}/${editando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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

  const lista = useMemo(() => {
    if (esInstructor) return cursos;
    if (filtro === "INSCRITOS") return cursos.filter((c) => c.inscrito);
    if (filtro === "DISPONIBLES") return cursos.filter((c) => !c.inscrito);
    return cursos;
  }, [cursos, filtro, esInstructor]);

  const chips: { key: Filtro; label: string }[] = [
    { key: "TODOS", label: `Todos (${cursos.length})` },
    { key: "INSCRITOS", label: `Inscritos (${inscritosCount})` },
    {
      key: "DISPONIBLES",
      label: `Sin inscribir (${cursos.length - inscritosCount})`,
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-14 pb-6 rounded-b-[32px]">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 40, height: 40 }}
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

        <Text className="text-white text-2xl font-bold mt-6">
          {esInstructor ? "Tus cursos" : "Explora cursos"}
        </Text>

        {perfil && (perfil.disciplina || perfil.tier) && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {perfil.disciplina && (
              <View className="flex-row items-center bg-white/15 px-3 h-8 rounded-full">
                <Briefcase size={13} color="white" />
                <Text className="text-white text-xs font-bold ml-1.5">
                  {perfil.disciplina}
                </Text>
              </View>
            )}
            {perfil.tier && (
              <View className="flex-row items-center bg-white/15 px-3 h-8 rounded-full">
                <Award size={13} color="white" />
                <Text className="text-white text-xs font-bold ml-1.5">
                  Tier {perfil.tier}
                </Text>
              </View>
            )}
          </View>
        )}

        {!esInstructor && (
          <View className="flex-row items-center bg-white rounded-2xl px-4 h-12 mt-4">
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

      {/* Crear curso (instructor) */}
      {esInstructor && (
        <View className="px-6 mt-5">
          <Pressable
            onPress={() => router.push("/instructorPage/crear-curso")}
            className="h-12 bg-white border border-blue-200 flex-row items-center justify-center rounded-xl"
          >
            <Plus size={18} color="#2563eb" />
            <Text className="text-blue-600 font-bold ml-1.5">Crear curso</Text>
          </Pressable>
        </View>
      )}

      {/* Filtros (estudiante) */}
      {!esInstructor && (
        <View className="flex-row flex-wrap gap-2 px-6 mt-4">
          {chips.map((c) => {
            const activo = filtro === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setFiltro(c.key)}
                className={`px-3 h-9 items-center justify-center rounded-full border ${
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
      )}

      {esInstructor && !loading && (
        <Text className="text-gray-600 text-xs font-medium px-6 mt-5">
          {cursos.length}{" "}
          {cursos.length === 1 ? "curso creado" : "cursos creados"}
        </Text>
      )}

      {error && <Text className="text-red-600 text-xs px-6 mt-3">{error}</Text>}

      {/* Listado */}
      {loading && cursos.length === 0 ? (
        <ActivityIndicator className="mt-16" color="#2563eb" />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="px-6 pt-4 pb-8"
          refreshing={loading}
          onRefresh={() => fetchCursos()}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <GraduationCap size={40} color="#cbd5e1" />
              <Text className="text-gray-600 mt-3 text-center">
                {esInstructor
                  ? "Aún no has creado cursos"
                  : filtro === "INSCRITOS"
                    ? "Todavía no te has inscrito a ningún curso"
                    : filtro === "DISPONIBLES"
                      ? "Ya estás inscrito en todos los cursos"
                      : "No hay cursos disponibles"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = colorFor(item.id);
            const inicial =
              item.instructor?.nombre?.charAt(0)?.toUpperCase() ?? "?";

            return (
              <Pressable
                onPress={() =>
                  router.push(`/curso/${item.id}?inscrito=${item.inscrito}`)
                }
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-start">
                  {esInstructor ? (
                    <View
                      className={`w-11 h-11 rounded-xl ${color.bg} items-center justify-center mr-3`}
                    >
                      <BookOpen size={20} color={color.hex} />
                    </View>
                  ) : (
                    <View
                      className={`w-11 h-11 rounded-xl ${color.bg} items-center justify-center mr-3`}
                    >
                      <BookOpen size={20} color={color.hex} />
                    </View>
                  )}
                  <View className="flex-1 mr-2">
                    <Text
                      className="font-bold text-base text-gray-900"
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>
                    <Text className="text-gray-600 text-xs" numberOfLines={1}>
                      {esInstructor
                        ? `Creado el ${new Date(
                            item.fechaCreacion,
                          ).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
`
                        : item.instructor?.nombre}
                    </Text>
                  </View>

                  {esInstructor ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        openEdit(item);
                      }}
                      accessibilityLabel={`Editar ${item.titulo}`}
                      hitSlop={10}
                      className="bg-blue-50 p-2 rounded-full"
                    >
                      <Pencil size={16} color="#2563eb" />
                    </Pressable>
                  ) : (
                    esNuevo(item.fechaCreacion) && (
                      <View className="bg-amber-50 flex-row items-center px-2 py-1 rounded-full">
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

                {!esInstructor && (
                  <View className="flex-row items-center justify-between mt-4">
                    <Text className="text-gray-500 text-xs">
                      Publicado{" "}
                      {new Date(item.fechaCreacion).toLocaleDateString(
                        "es-CO",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </Text>
                    {item.inscrito ? (
                      <View className="bg-green-50 flex-row items-center px-3 h-9 rounded-full">
                        <Check size={14} color="#15803d" />
                        <Text className="text-green-700 text-xs font-bold ml-1">
                          Inscrito
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setInscribirId(item.id);
                        }}
                        className="bg-blue-600 px-4 h-9 items-center justify-center rounded-full"
                      >
                        <Text className="text-white text-xs font-bold">
                          Inscribirse
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Pressable>
            );
          }}
        />
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
