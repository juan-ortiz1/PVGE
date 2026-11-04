import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Award, Download } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8080/api";

type Cert = {
  id: number;
  codigo: string;
  fechaEmision: string;
  url: string;
  cursoTitulo: string;
  estudianteNombre: string;
};

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};
const abrir = (url: string) =>
  Platform.OS === "web"
    ? (globalThis as any).open(url, "_blank")
    : Linking.openURL(url);

export default function Certificados() {
  const { accessToken, authFetch, ready } = useAuth();
  const logueado = !!accessToken;
  const [lista, setLista] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const res = await authFetch(`${API}/certificados/me`);
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

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-600 px-6 pt-14 pb-6 rounded-b-[32px]">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Mis certificados</Text>
        <Text className="text-blue-100 text-sm mt-1">
          {lista.length} {lista.length === 1 ? "certificado" : "certificados"}
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
          keyExtractor={(c) => c.id.toString()}
          contentContainerClassName="px-6 pt-5 pb-10"
          refreshing={loading}
          onRefresh={cargar}
          ListEmptyComponent={
            <View className="items-center mt-14 px-6">
              <Award size={40} color="#cbd5e1" />
              <Text className="text-gray-600 mt-3 text-center">
                Aún no tienes certificados. Completa un curso para obtener el
                primero
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
              style={{ elevation: 1 }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-amber-100 items-center justify-center mr-3">
                  <Award size={22} color="#b45309" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900" numberOfLines={2}>
                    {item.cursoTitulo}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    Emitido{" "}
                    {new Date(item.fechaEmision).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  Código: {item.codigo}
                </Text>
                <Pressable
                  onPress={() => abrir(item.url)}
                  className="bg-blue-600 flex-row items-center px-4 h-9 rounded-full"
                >
                  <Download size={14} color="white" />
                  <Text className="text-white text-xs font-bold ml-1.5">
                    Ver
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
