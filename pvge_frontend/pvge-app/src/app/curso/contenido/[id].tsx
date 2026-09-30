import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Trash2,
  File,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Presentation,
} from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";
import ConfirmModal from "../../../components/ConfirmModal";

type Contenido = {
  id: number;
  nombre: string;
  descripcion: string;
  cursoId: number;
};

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  url: string;
  fechaSubida: string;
  contenidoId: number;
};

const API = "http://localhost:8080/api";

// Mismo orden que en curso/[id].tsx
const THEMES = [
  {
    header: "bg-blue-600",
    sub: "text-blue-100",
    border: "border-blue-300",
    text: "text-blue-700",
    hex: "#2563eb",
  },
  {
    header: "bg-purple-600",
    sub: "text-purple-100",
    border: "border-purple-300",
    text: "text-purple-700",
    hex: "#7c3aed",
  },
  {
    header: "bg-amber-700",
    sub: "text-amber-100",
    border: "border-amber-300",
    text: "text-amber-800",
    hex: "#b45309",
  },
  {
    header: "bg-emerald-700",
    sub: "text-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-800",
    hex: "#047857",
  },
  {
    header: "bg-rose-600",
    sub: "text-rose-100",
    border: "border-rose-300",
    text: "text-rose-700",
    hex: "#e11d48",
  },
];

const infoTipo = (tipo: string, nombre: string) => {
  const s = `${tipo ?? ""} ${nombre ?? ""}`.toLowerCase();
  if (s.includes("pdf"))
    return { label: "PDF", Icon: FileText, bg: "bg-red-50", hex: "#dc2626" };
  if (/image|png|jpe?g|gif|webp/.test(s))
    return {
      label: "Imagen",
      Icon: ImageIcon,
      bg: "bg-emerald-50",
      hex: "#059669",
    };
  if (/video|mp4|mov|avi/.test(s))
    return { label: "Video", Icon: Video, bg: "bg-purple-50", hex: "#7c3aed" };
  if (/sheet|xls|excel|csv/.test(s))
    return {
      label: "Excel",
      Icon: FileSpreadsheet,
      bg: "bg-green-50",
      hex: "#15803d",
    };
  if (/presentation|ppt/.test(s))
    return {
      label: "PowerPoint",
      Icon: Presentation,
      bg: "bg-orange-50",
      hex: "#c2410c",
    };
  if (/word|doc/.test(s))
    return { label: "Word", Icon: FileText, bg: "bg-blue-50", hex: "#2563eb" };
  return { label: "Archivo", Icon: File, bg: "bg-gray-100", hex: "#4b5563" };
};

export default function ContenidoDetalle() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const { accessToken, role, ready } = useAuth();

  const theme =
    THEMES[Number(t) >= 0 && Number(t) < THEMES.length ? Number(t) : 0];
  const esInstructor = role === "INSTRUCTOR";

  const [contenido, setContenido] = useState<Contenido | null>(null);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteRecurso, setDeleteRecurso] = useState<Recurso | null>(null);

  const headers = { Authorization: `Bearer ${accessToken}` };

  const fetchRecursos = async () => {
    try {
      const res = await fetch(`${API}/recursos/contenido/${id}`, { headers });
      if (!res.ok)
        throw new Error(`Error ${res.status} al cargar los recursos`);
      const data = await res.json();
      setRecursos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudieron cargar los recursos");
    } finally {
      setLoading(false);
    }
  };

  const fetchContenido = async () => {
    try {
      const res = await fetch(`${API}/contenidos/${id}`, { headers });
      if (res.ok) setContenido(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      router.replace("/");
      return;
    }
    fetchContenido();
    fetchRecursos();
  }, [ready, accessToken]);

  const handleUpload = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (result.canceled) return;

    const file = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("nombre", file.name);
      formData.append("contenidoId", id!);
      if (Platform.OS === "web" && file.file) {
        // En web hay que enviar el File real
        formData.append("archivo", file.file, file.name);
      } else {
        formData.append("archivo", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType ?? "application/octet-stream",
        } as any);
      }

      const res = await fetch(`${API}/recursos`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) throw new Error(`Error ${res.status} al subir el archivo`);
      await fetchRecursos();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRecurso) return;
    try {
      const res = await fetch(`${API}/recursos/${deleteRecurso.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(`Error ${res.status} al eliminar`);
      setRecursos((prev) => prev.filter((r) => r.id !== deleteRecurso.id));
    } catch (e: any) {
      setError(e.message ?? "No se pudo eliminar el recurso");
    } finally {
      setDeleteRecurso(null);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className={`${theme.header} px-6 pt-14 pb-6 rounded-b-[32px]`}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-xl font-bold" numberOfLines={2}>
          {contenido?.nombre ?? ""}
        </Text>
        {!!contenido?.descripcion && (
          <Text className={`${theme.sub} text-sm mt-1`} numberOfLines={3}>
            {contenido.descripcion}
          </Text>
        )}
      </View>

      {/* Subir (instructor) */}
      {esInstructor && (
        <View className="px-6 mt-5">
          <Pressable
            onPress={handleUpload}
            disabled={uploading}
            className={`h-14 bg-white border-2 border-dashed ${theme.border} items-center justify-center rounded-2xl flex-row gap-2`}
          >
            {uploading ? (
              <>
                <ActivityIndicator color={theme.hex} />
                <Text className={`${theme.text} font-bold`}>Subiendo...</Text>
              </>
            ) : (
              <>
                <Upload size={18} color={theme.hex} />
                <Text className={`${theme.text} font-bold`}>Subir archivo</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {error && <Text className="text-red-600 text-xs px-6 mt-3">{error}</Text>}

      {!loading && recursos.length > 0 && (
        <Text className="text-gray-600 text-xs font-medium px-6 mt-5">
          {recursos.length} {recursos.length === 1 ? "recurso" : "recursos"}
        </Text>
      )}

      {/* Listado */}
      {loading ? (
        <ActivityIndicator className="mt-16" color={theme.hex} />
      ) : (
        <FlatList
          data={recursos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="px-6 pt-3 pb-8"
          refreshing={loading}
          onRefresh={fetchRecursos}
          ListEmptyComponent={
            <View className="items-center mt-16 px-6">
              <FileText size={40} color="#cbd5e1" />
              <Text className="text-gray-600 mt-3 text-center">
                {esInstructor
                  ? "Aún no hay recursos. Sube el primero con el botón de arriba"
                  : "El instructor aún no ha subido recursos"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const tipo = infoTipo(item.tipo, item.nombre);
            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center"
                style={{ elevation: 1 }}
              >
                <View
                  className={`w-11 h-11 rounded-xl ${tipo.bg} items-center justify-center mr-3`}
                >
                  <tipo.Icon size={18} color={tipo.hex} />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="font-bold text-gray-900" numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text className="text-gray-600 text-xs">
                    {tipo.label} ·{" "}
                    {new Date(item.fechaSubida).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(item.url)}
                  accessibilityLabel={`Descargar ${item.nombre}`}
                  hitSlop={10}
                  className="bg-blue-50 p-2.5 rounded-full mr-2"
                >
                  <Download size={16} color="#2563eb" />
                </Pressable>
                {esInstructor && (
                  <Pressable
                    onPress={() => setDeleteRecurso(item)}
                    accessibilityLabel={`Eliminar ${item.nombre}`}
                    hitSlop={10}
                    className="bg-red-50 p-2.5 rounded-full"
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      )}

      <ConfirmModal
        visible={deleteRecurso !== null}
        title="Eliminar recurso"
        message={`¿Seguro que quieres eliminar "${deleteRecurso?.nombre ?? "este recurso"}"?`}
        confirmText="Eliminar"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRecurso(null)}
      />
    </View>
  );
}
