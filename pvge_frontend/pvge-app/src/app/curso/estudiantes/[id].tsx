import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ArrowLeft, Users, Search, X } from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";

const API = "http://localhost:8080/api";

const THEMES = [
  {
    header: "bg-blue-600",
    sub: "text-blue-100",
    soft: "bg-blue-100",
    text: "text-blue-700",
    hex: "#2563eb",
  },
  {
    header: "bg-purple-600",
    sub: "text-purple-100",
    soft: "bg-purple-100",
    text: "text-purple-700",
    hex: "#7c3aed",
  },
  {
    header: "bg-amber-700",
    sub: "text-amber-100",
    soft: "bg-amber-100",
    text: "text-amber-800",
    hex: "#b45309",
  },
  {
    header: "bg-emerald-700",
    sub: "text-emerald-100",
    soft: "bg-emerald-100",
    text: "text-emerald-800",
    hex: "#047857",
  },
  {
    header: "bg-rose-600",
    sub: "text-rose-100",
    soft: "bg-rose-100",
    text: "text-rose-700",
    hex: "#e11d48",
  },
];

type EstProg = {
  estudianteId: number;
  correoEstudiante: string;
  tareasTotales: number | null;
  tareasCompletadas: number | null;
  evaluacionesTotales: number;
  evaluacionesCompletadas: number;
  porcentajeCompletado: number;
  puntajeObtenido: number | null;
  puntajeTotal: number | null;
};

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

const pct = (p: number) => Math.round(Math.min(100, Math.max(0, p ?? 0)));

export default function EstudiantesCurso() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const { accessToken, authFetch, ready } = useAuth();
  const theme =
    THEMES[Number(t) >= 0 && Number(t) < THEMES.length ? Number(t) : 0];

  const [lista, setLista] = useState<EstProg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const logueado = !!accessToken;

  const cargar = async () => {
    try {
      const res = await authFetch(`${API}/progreso/instructor/curso/${id}`);
      const data = parse(await res.text());
      if (!res.ok)
        throw new Error(
          data?.message ?? `Error ${res.status} al cargar los estudiantes`,
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
    return lista.filter(
      (e) => !q || (e.correoEstudiante ?? "").toLowerCase().includes(q),
    );
  }, [lista, query]);

  const promedio = lista.length
    ? Math.round(
        lista.reduce((s, e) => s + pct(e.porcentajeCompletado), 0) /
          lista.length,
      )
    : 0;

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
        <Text className="text-white text-2xl font-bold">Estudiantes</Text>
        <Text className={`${theme.sub} text-sm mt-1 mb-4`}>
          {lista.length} {lista.length === 1 ? "inscrito" : "inscritos"} ·
          avance promedio {promedio}%
        </Text>

        <View className="flex-row items-center bg-white rounded-2xl px-4 h-12">
          <Search size={18} color="#9ca3af" />
          <TextInput
            placeholder="Buscar por correo..."
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
          keyExtractor={(item) => item.estudianteId.toString()}
          contentContainerClassName="px-6 pt-5 pb-10"
          refreshing={loading}
          onRefresh={cargar}
          ListEmptyComponent={
            <View className="items-center mt-14">
              <Users size={40} color="#cbd5e1" />
              <Text className="text-gray-600 mt-3 text-center">
                {query
                  ? "Ningún estudiante coincide con la búsqueda"
                  : "Aún no hay estudiantes inscritos en este curso"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const p = pct(item.porcentajeCompletado);
            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-11 h-11 rounded-xl ${theme.soft} items-center justify-center mr-3`}
                  >
                    <Text className={`${theme.text} font-bold text-base`}>
                      {(item.correoEstudiante ?? "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className="flex-1 font-bold text-gray-900 mr-2"
                    numberOfLines={1}
                  >
                    {item.correoEstudiante}
                  </Text>
                  <Text className={`${theme.text} font-bold`}>{p}%</Text>
                </View>

                <View className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                  <View
                    style={{
                      height: 8,
                      width: `${p}%`,
                      backgroundColor: theme.hex,
                      borderRadius: 4,
                    }}
                  />
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-gray-500 text-xs">
                    {item.tareasCompletadas ?? 0}/{item.tareasTotales ?? 0}{" "}
                    tareas · {item.evaluacionesCompletadas}/
                    {item.evaluacionesTotales} eval.
                  </Text>
                  {(item.puntajeTotal ?? 0) > 0 && (
                    <Text className="text-gray-500 text-xs">
                      {item.puntajeObtenido ?? 0}/{item.puntajeTotal} pts
                    </Text>
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
