import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  Power,
  Users,
  BookOpen,
  UserPlus,
  ChevronRight,
  GraduationCap,
  Presentation,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

type Usuario = { id: number; rol: string };

type Stats = {
  usuarios: number;
  estudiantes: number;
  instructores: number;
  cursos: number;
};

const ACTIONS = [
  {
    title: "Usuarios",
    desc: "Consulta y elimina cuentas",
    icon: Users,
    href: "/adminPage/usuarios",
    bg: "bg-blue-50",
    color: "#2563eb",
  },
  {
    title: "Cursos",
    desc: "Revisa y elimina cursos publicados",
    icon: BookOpen,
    href: "/adminPage/cursos",
    bg: "bg-purple-50",
    color: "#7c3aed",
  },
  {
    title: "Nuevo instructor",
    desc: "Crea una cuenta de instructor",
    icon: UserPlus,
    href: "/adminPage/crear-instructor",
    bg: "bg-emerald-50",
    color: "#059669",
  },
] as const;

export default function Admin() {
  const [error, setError] = useState<string | null>(null);
  const { accessToken, ready, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);

  const load = async () => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [rU, rC] = await Promise.all([
        fetch("http://localhost:8080/api/admin/usuarios", { headers }),
        fetch("http://localhost:8080/api/admin/cursos", { headers }),
      ]);
      if (!rU.ok || !rC.ok) {
        throw new Error(`Error ${!rU.ok ? rU.status : rC.status}`);
      }
      const usuarios: Usuario[] = await rU.json();
      const cursos: unknown[] = await rC.json();
      setStats({
        usuarios: usuarios.length,
        estudiantes: usuarios.filter((u) => u.rol === "ESTUDIANTE").length,
        instructores: usuarios.filter((u) => u.rol === "INSTRUCTOR").length,
        cursos: cursos.length,
      });
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "No se pudieron cargar las estadísticas");
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
    load();
  }, [ready, accessToken]);

  const confirmLogout = async () => {
    setLogoutModal(false);
    await logout();
    router.replace("/");
  };

  const cards = [
    { label: "Estudiantes", value: stats?.estudiantes, icon: GraduationCap },
    { label: "Instructores", value: stats?.instructores, icon: Presentation },
    { label: "Cursos", value: stats?.cursos, icon: BookOpen },
    { label: "Usuarios activos", value: stats?.usuarios, icon: Users },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-14 pb-16 rounded-b-[32px]">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-blue-200 text-sm">Mentum</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              Panel de administración
            </Text>
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
      </View>

      {/* Stats */}
      <View className="-mt-10 px-6 flex-row flex-wrap gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <View
            key={label}
            className="bg-white rounded-2xl p-4 border border-gray-100"
            style={{ width: "48%", flexGrow: 1, elevation: 1 }}
          >
            <View className="flex-row items-center justify-between">
              <Icon size={18} color="#2563eb" />
              {loading ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text className="text-gray-900 text-2xl font-bold">
                  {value ?? "–"}
                </Text>
              )}
            </View>
            <Text className="text-gray-600 text-xs mt-2">{label}</Text>
          </View>
        ))}
      </View>

      {error && (
        <Text className="text-red-600 text-xs px-6 mt-3">
          No se pudieron cargar las estadísticas ({error})
        </Text>
      )}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Acciones */}
        <Text className="text-gray-900 font-bold text-base mt-8 mb-3">
          Gestión
        </Text>
        {ACTIONS.map(({ title, desc, icon: Icon, href, bg, color }) => (
          <Pressable
            key={title}
            onPress={() => router.push(href)}
            className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center active:bg-gray-50"
            style={{ elevation: 1 }}
          >
            <View
              className={`w-11 h-11 rounded-xl ${bg} items-center justify-center mr-3`}
            >
              <Icon size={20} color={color} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900">{title}</Text>
              <Text className="text-gray-600 text-xs mt-0.5">{desc}</Text>
            </View>
            <ChevronRight size={18} color="#9ca3af" />
          </Pressable>
        ))}
      </ScrollView>

      <ConfirmModal
        visible={logoutModal}
        title="Cerrar sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Cerrar sesión"
        destructive
        onConfirm={confirmLogout}
        onCancel={() => setLogoutModal(false)}
      />
    </View>
  );
}
