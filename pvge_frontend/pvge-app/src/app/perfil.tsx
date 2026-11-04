import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import {
  ArrowLeft,
  Camera,
  User,
  AtSign,
  Mail,
  Award,
  Briefcase,
  Globe,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8080/api";

const parse = (t: string) => {
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
};

export default function Perfil() {
  const { accessToken, authFetch, ready, role } = useAuth();
  const logueado = !!accessToken;

  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [nickname, setNickname] = useState("");
  const [foto, setFoto] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null,
  );

  const esEst = role === "ESTUDIANTE";

  const cargar = async () => {
    try {
      const res = await authFetch(`${API}/usuarios/me`);
      const data = parse(await res.text());
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
      setPerfil(data);
      setNombre(
        data?.estudiante?.nombre ??
          data?.instructor?.nombre ??
          data?.usuario?.nombre ??
          "",
      );
      setApellido(data?.estudiante?.apellido ?? "");
      setNickname(data?.estudiante?.nickname ?? "");
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

  const elegirFoto = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      multiple: false,
    });
    if (!r.canceled) setFoto(r.assets[0]);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const fd = new FormData();
      fd.append("nombre", nombre.trim());
      if (esEst) {
        fd.append("apellido", apellido.trim());
        fd.append("nickname", nickname.trim());
      }
      const res = await authFetch(`${API}/usuarios/me`, {
        method: "PUT",
        body: fd,
      });
      const data = parse(await res.text());
      if (!res.ok)
        throw new Error(data?.message ?? `Error ${res.status} al guardar`);

      if (foto) {
        const fdFoto = new FormData();
        if (Platform.OS === "web") {
          const blob =
            (foto as any).file ?? (await (await fetch(foto.uri)).blob());
          fdFoto.append("foto", blob, foto.name);
        } else {
          fdFoto.append("foto", {
            uri: foto.uri,
            name: foto.name,
            type: foto.mimeType ?? "image/jpeg",
          } as any);
        }
        const resF = await authFetch(`${API}/usuarios/me/foto`, {
          method: "POST",
          body: fdFoto,
        });
        const dataF = parse(await resF.text());
        if (!resF.ok)
          throw new Error(
            dataF?.message ?? `Error ${resF.status} al subir la foto`,
          );
      }

      setFoto(null);
      setOk(true);
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const u = perfil?.usuario;
  const fotoUri = foto?.uri ?? u?.fotoPerfilUrl;
  const inicial = (nombre || u?.nombre || "?").charAt(0).toUpperCase();

  const campo = (
    label: string,
    Icon: any,
    value: string,
    set: (v: string) => void,
    extra: object = {},
  ) => (
    <>
      <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">{label}</Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 h-12">
        <Icon size={18} color="#9ca3af" />
        <TextInput
          value={value}
          onChangeText={set}
          maxLength={255}
          placeholderTextColor="#9ca3af"
          className="flex-1 ml-3 text-gray-900"
          {...extra}
        />
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="bg-blue-600 px-6 pt-14 pb-20 rounded-b-[32px]">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          hitSlop={8}
          className="mb-4 self-start"
        >
          <ArrowLeft color="white" size={22} />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Mi perfil</Text>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-16" color="#2563eb" />
      ) : (
        <ScrollView
          style={{ marginTop: -56, zIndex: 10 }}
          contentContainerClassName="px-6 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <Pressable onPress={elegirFoto} accessibilityLabel="Cambiar foto">
              {fotoUri ? (
                <Image
                  source={{ uri: fotoUri }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: 4,
                    borderColor: "white",
                  }}
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white items-center justify-center">
                  <Text className="text-blue-700 text-3xl font-bold">
                    {inicial}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-white">
                <Camera size={14} color="white" />
              </View>
            </Pressable>
            {foto && (
              <Text className="text-gray-500 text-xs mt-2">
                Foto nueva: se guarda al pulsar “Guardar”
              </Text>
            )}
            <Text className="text-gray-500 text-sm mt-2">{u?.correo}</Text>
          </View>

          {campo(esEst ? "Nombres" : "Nombre", User, nombre, setNombre)}
          {esEst && campo("Apellidos", User, apellido, setApellido)}
          {esEst &&
            campo("Nombre de usuario", AtSign, nickname, setNickname, {
              autoCapitalize: "none",
            })}

          <Text className="font-bold text-gray-700 mb-2 mt-4 text-sm">
            Correo
          </Text>
          <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-xl px-3 h-12">
            <Mail size={18} color="#9ca3af" />
            <Text className="flex-1 ml-3 text-gray-600">{u?.correo}</Text>
          </View>

          {esEst && !!perfil?.estudiante?.pais && (
            <View className="flex-row items-center mt-4">
              <Globe size={16} color="#6b7280" />
              <Text className="text-gray-600 text-sm ml-2">
                {perfil.estudiante.pais}
              </Text>
            </View>
          )}
          {role === "INSTRUCTOR" && perfil?.instructor && (
            <View className="flex-row gap-2 mt-4">
              <View className="flex-row items-center bg-blue-50 px-3 h-8 rounded-full">
                <Briefcase size={13} color="#2563eb" />
                <Text className="text-blue-700 text-xs font-bold ml-1.5">
                  {perfil.instructor.disciplina}
                </Text>
              </View>
              <View className="flex-row items-center bg-blue-50 px-3 h-8 rounded-full">
                <Award size={13} color="#2563eb" />
                <Text className="text-blue-700 text-xs font-bold ml-1.5">
                  Tier {perfil.instructor.tier}
                </Text>
              </View>
            </View>
          )}

          {error && (
            <View className="bg-red-50 rounded-xl px-4 py-3 mt-5">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}
          {ok && (
            <View className="bg-green-50 rounded-xl px-4 py-3 mt-5">
              <Text className="text-green-700 text-sm">Perfil actualizado</Text>
            </View>
          )}

          <Pressable
            onPress={guardar}
            disabled={saving}
            className={`h-12 items-center justify-center rounded-xl mt-6 ${saving ? "bg-blue-300" : "bg-blue-600"}`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Guardar cambios</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
