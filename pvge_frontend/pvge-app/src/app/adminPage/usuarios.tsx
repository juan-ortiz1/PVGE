import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Search, Trash2, Users, X } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/ConfirmModal";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  rol: "ESTUDIANTE" | "INSTRUCTOR" | "ADMIN";
  activo: boolean;
};

const API = "http://localhost:8080/api/admin";

const ROL_STYLE = {
  ESTUDIANTE: { label: "Estudiante", bg: "bg-blue-50", text: "text-blue-700" },
  INSTRUCTOR: {
    label: "Instructor",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  ADMIN: { label: "Admin", bg: "bg-amber-50", text: "text-amber-700" },
} as const;

const AVATAR = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
];

const FILTROS = [
  { key: "TODOS", label: "Todos" },
  { key: "ESTUDIANTE", label: "Estudiantes" },
  { key: "INSTRUCTOR", label: "Instructores" },
  { key: "ADMIN", label: "Admins" },
] as const;

export default function ListadoUsuarios() {
  const { accessToken, ready } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] =
    useState<(typeof FILTROS)[number]["key"]>("TODOS");
  const [deleteUser, setDeleteUser] = useState<Usuario | null>(null);

  // Detalle
  const [detalle, setDetalle] = useState<Usuario | null>(null);
  const [cursos, setCursos] = useState<string[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(false);

  const headers = { Authorization: `Bearer ${accessToken}` };

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API}/usuarios`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setUsuarios(await res.json());
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudieron cargar los usuarios");
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
    fetchUsuarios();
  }, [ready, accessToken]);

  const abrirDetalle = async (u: Usuario) => {
    setDetalle(u);
    setCursos([]);
    if (u.rol !== "ESTUDIANTE") return;
    setLoadingCursos(true);
    try {
      const res = await fetch(`${API}/usuarios/${u.id}/cursos`, { headers });
      if (res.ok) setCursos(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCursos(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      const res = await fetch(`${API}/usuarios/${deleteUser.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDetalle(null);
    } catch (e: any) {
      setError(e.message ?? "No se pudo eliminar el usuario");
    } finally {
      setDeleteUser(null);
    }
  };

  const lista = useMemo(() => {
    const q = query.trim().toLowerCase();
    return usuarios.filter(
      (u) =>
        (filtro === "TODOS" || u.rol === filtro) &&
        (!q ||
          u.nombre.toLowerCase().includes(q) ||
          u.correo.toLowerCase().includes(q)),
    );
  }, [usuarios, query, filtro]);

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
        <Text className="text-white text-2xl font-bold">Usuarios</Text>
        <Text className="text-blue-200 text-sm mt-1 mb-4">
          {usuarios.length}{" "}
          {usuarios.length === 1 ? "cuenta activa" : "cuentas activas"}
        </Text>

        <View className="flex-row items-center bg-white rounded-2xl px-4 h-12">
          <Search size={18} color="#9ca3af" />
          <TextInput
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            className="flex-1 ml-3 text-gray-900"
          />
          {query !== "" && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={16} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View className="flex-row gap-2 px-6 mt-4">
        {FILTROS.map((f) => {
          const activo = filtro === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFiltro(f.key)}
              className={`px-3 h-9 items-center justify-center rounded-full border ${
                activo
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${activo ? "text-white" : "text-gray-600"}`}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && <Text className="text-red-600 text-xs px-6 mt-3">{error}</Text>}

      {/* Listado */}
      {loading ? (
        <ActivityIndicator className="mt-16" color="#2563eb" />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="px-6 pt-4 pb-8"
          refreshing={loading}
          onRefresh={fetchUsuarios}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Users size={40} color="#cbd5e1" />
              <Text className="text-gray-500 mt-3">
                {query || filtro !== "TODOS"
                  ? "Ningún usuario coincide con la búsqueda"
                  : "No hay usuarios"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const av = AVATAR[item.nombre.charCodeAt(0) % AVATAR.length];
            const rol = ROL_STYLE[item.rol];
            return (
              <Pressable
                onPress={() => abrirDetalle(item)}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center"
                style={{ elevation: 1 }}
              >
                <View
                  className={`w-11 h-11 rounded-xl ${av.bg} items-center justify-center mr-3`}
                >
                  <Text className={`font-bold text-base ${av.text}`}>
                    {item.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1 mr-2">
                  <Text className="font-bold text-gray-900" numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text className="text-gray-600 text-xs" numberOfLines={1}>
                    {item.correo}
                  </Text>
                  <View
                    className={`${rol.bg} self-start px-2 py-0.5 rounded-full mt-1.5`}
                  >
                    <Text className={`${rol.text} text-[11px] font-bold`}>
                      {rol.label}
                    </Text>
                  </View>
                </View>
                {item.rol !== "ADMIN" && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setDeleteUser(item);
                    }}
                    accessibilityLabel={`Eliminar a ${item.nombre}`}
                    hitSlop={10}
                    className="bg-red-50 p-2.5 rounded-full"
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </Pressable>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* Detalle */}
      <Modal visible={!!detalle} transparent animationType="slide">
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setDetalle(null)}
        >
          <Pressable className="bg-white rounded-t-3xl p-6 pb-10">
            {detalle && (
              <>
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900">
                      {detalle.nombre}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {detalle.correo}
                    </Text>
                    <View
                      className={`${ROL_STYLE[detalle.rol].bg} self-start px-2 py-0.5 rounded-full mt-2`}
                    >
                      <Text
                        className={`${ROL_STYLE[detalle.rol].text} text-[11px] font-bold`}
                      >
                        {ROL_STYLE[detalle.rol].label}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setDetalle(null)}
                    accessibilityLabel="Cerrar"
                    hitSlop={10}
                    className="bg-gray-100 p-2 rounded-full"
                  >
                    <X size={16} color="#374151" />
                  </Pressable>
                </View>

                {detalle.rol === "ESTUDIANTE" && (
                  <>
                    <Text className="font-bold text-gray-900 mb-2">
                      Cursos matriculados
                    </Text>
                    {loadingCursos ? (
                      <ActivityIndicator color="#2563eb" />
                    ) : cursos.length === 0 ? (
                      <Text className="text-gray-500 text-sm">
                        No está inscrito en ningún curso
                      </Text>
                    ) : (
                      cursos.map((c, i) => (
                        <View
                          key={`${c}-${i}`}
                          className="bg-gray-50 rounded-xl px-3 py-2.5 mb-2"
                        >
                          <Text className="text-gray-800 text-sm">{c}</Text>
                        </View>
                      ))
                    )}
                  </>
                )}

                {detalle.rol !== "ADMIN" && (
                  <Pressable
                    onPress={() => setDeleteUser(detalle)}
                    className="h-12 bg-red-50 items-center justify-center rounded-xl mt-4"
                  >
                    <Text className="text-red-600 font-bold">
                      Eliminar usuario
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={deleteUser !== null}
        title="Eliminar usuario"
        message={`¿Seguro que quieres eliminar a ${deleteUser?.nombre ?? "este usuario"}? Perderá el acceso a la plataforma.`}
        confirmText="Eliminar"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </View>
  );
}
