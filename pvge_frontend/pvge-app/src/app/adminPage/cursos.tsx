import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Search, Trash2, BookOpen, X } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

type Curso = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  instructor: {
    nombre: string;
    disciplina?: string;
    tier?: number;
  };
};

const API = "http://localhost:8080/api/admin";

const AVATAR = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
];

export default function GestionarCursos() {
  const { accessToken, ready } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleteCurso, setDeleteCurso] = useState<Curso | null>(null);

  const headers = { Authorization: `Bearer ${accessToken}` };

  const fetchCursos = async () => {
    try {
      const res = await fetch(`${API}/cursos`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setCursos(await res.json());
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudieron cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      router.replace("/");
      return;
    }
    fetchCursos();
  }, [ready, accessToken]);

  const confirmDelete = async () => {
    if (!deleteCurso) return;
    try {
      const res = await fetch(`${API}/cursos/${deleteCurso.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setCursos((prev) => prev.filter((c) => c.id !== deleteCurso.id));
    } catch (e: any) {
      setError(e.message ?? "No se pudo eliminar el curso");
    } finally {
      setDeleteCurso(null);
    }
  };

  const lista = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cursos;
    return cursos.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.instructor?.nombre?.toLowerCase().includes(q),
    );
  }, [cursos, query]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-14 pb-6 rounded-b-[32px]">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Cursos</Text>
        <Text className="text-blue-200 text-sm mt-1 mb-4">
          {cursos.length}{" "}
          {cursos.length === 1 ? "curso publicado" : "cursos publicados"}
        </Text>

        <View className="flex-row items-center bg-white rounded-2xl px-4 h-12">
          <Search size={18} color="#9ca3af" />
          <TextInput
            placeholder="Buscar por título o instructor..."
            placeholderTextColor="#9ca3af"
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

      {error && <Text className="text-red-600 text-xs px-6 mt-3">{error}</Text>}

      {/* Listado */}
      {loading ? (
        <ActivityIndicator className="mt-16" color="#2563eb" />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="px-6 pt-5 pb-8"
          refreshing={loading}
          onRefresh={fetchCursos}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <BookOpen size={40} color="#cbd5e1" />
              <Text className="text-gray-500 mt-3">
                {query
                  ? "Ningún curso coincide con la búsqueda"
                  : "Aún no hay cursos"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const nombre = item.instructor?.nombre ?? "?";
            const av = AVATAR[item.id % AVATAR.length];
            const meta = [
              item.instructor?.disciplina,
              item.instructor?.tier ? `Tier ${item.instructor.tier}` : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-start">
                  <View
                    className={`w-11 h-11 rounded-xl ${av.bg} items-center justify-center mr-3`}
                  >
                    <Text className={`font-bold text-base ${av.text}`}>
                      {nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1 mr-2">
                    <Text
                      className="font-bold text-base text-gray-900"
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>
                    <Text className="text-gray-600 text-xs" numberOfLines={1}>
                      {nombre}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setDeleteCurso(item)}
                    accessibilityLabel={`Eliminar ${item.titulo}`}
                    hitSlop={10}
                    className="bg-red-50 p-2.5 rounded-full"
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </Pressable>
                </View>

                <Text
                  className="text-gray-600 text-sm mt-3 leading-5"
                  numberOfLines={2}
                >
                  {item.descripcion}
                </Text>

                <View className="flex-row items-center justify-between mt-3">
                  {meta ? (
                    <View className="bg-gray-100 px-2 py-0.5 rounded-full flex-shrink">
                      <Text
                        className="text-gray-700 text-[11px] font-medium"
                        numberOfLines={1}
                      >
                        {meta}
                      </Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <Text className="text-gray-500 text-xs">
                    {new Date(item.fechaCreacion).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <ConfirmModal
        visible={deleteCurso !== null}
        title="Eliminar curso"
        message={`¿Seguro que quieres eliminar "${deleteCurso?.titulo ?? "este curso"}"? Los estudiantes inscritos perderán el acceso.`}
        confirmText="Eliminar"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCurso(null)}
      />
    </View>
  );
}
