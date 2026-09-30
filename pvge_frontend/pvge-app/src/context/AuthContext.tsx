import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  accessToken: string | null;
  role: string | null;
  ready: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    role: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const login = async (
    accessToken: string,
    refreshToken: string,
    role: string,
  ) => {
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);
    await AsyncStorage.setItem("role", role);
    setAccessToken(accessToken);
    setRole(role);
  };

  const logout = async () => {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    try {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      console.error(e);
    }
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    await AsyncStorage.removeItem("role");
    setRole(null);
    setAccessToken(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const [t, r] = await Promise.all([
          AsyncStorage.getItem("accessToken"),
          AsyncStorage.getItem("role"),
        ]);
        if (t) setAccessToken(t);
        if (r) setRole(r);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, role, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
