import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "http://localhost:8080/api";

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
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// true si el JWT venció o vence en menos de 30 s
const expiraPronto = (token: string | null) => {
  if (!token) return true;
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(b64));
    return exp * 1000 - Date.now() < 30_000;
  } catch {
    return false; // si no se puede leer, confiamos en el 401
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const accessRef = useRef<string | null>(null);
  const refreshing = useRef<Promise<string | null> | null>(null);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "role"]);
    accessRef.current = null;
    setAccessToken(null);
    setRole(null);
  }, []);

  const login = async (access: string, refresh: string, rol: string) => {
    await AsyncStorage.setItem("accessToken", access);
    await AsyncStorage.setItem("refreshToken", refresh);
    await AsyncStorage.setItem("role", rol);
    accessRef.current = access;
    setAccessToken(access);
    setRole(rol);
  };

  const logout = async () => {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      console.error(e);
    }
    await clearSession();
  };

  // Una sola renovación a la vez, aunque haya varias peticiones en vuelo
  const refresh = useCallback((): Promise<string | null> => {
    if (refreshing.current) return refreshing.current;

    refreshing.current = (async () => {
      try {
        const rt = await AsyncStorage.getItem("refreshToken");
        if (!rt) return null;

        const res = await fetch(`${API}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) throw new Error(`Refresh ${res.status}`);

        const data = await res.json();
        await AsyncStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken)
          await AsyncStorage.setItem("refreshToken", data.refreshToken);

        accessRef.current = data.accessToken;
        setAccessToken(data.accessToken);
        return data.accessToken as string;
      } catch (e) {
        console.error(e);
        await clearSession();
        return null;
      } finally {
        refreshing.current = null;
      }
    })();

    return refreshing.current;
  }, [clearSession]);

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      let token = accessRef.current;
      if (expiraPronto(token)) token = await refresh();
      if (!token) return new Response(null, { status: 401 });

      const send = (t: string) =>
        fetch(input, {
          ...init,
          headers: {
            ...(init.headers as Record<string, string>),
            Authorization: `Bearer ${t}`,
          },
        });

      let res = await send(token);
      if (res.status === 401) {
        const nuevo = await refresh();
        if (nuevo) res = await send(nuevo);
      }
      return res;
    },
    [refresh],
  );

  useEffect(() => {
    (async () => {
      try {
        const [t, r, rt] = await Promise.all([
          AsyncStorage.getItem("accessToken"),
          AsyncStorage.getItem("role"),
          AsyncStorage.getItem("refreshToken"),
        ]);

        if (!t && !rt) return;

        let token = t;
        if (!token || expiraPronto(token)) {
          token = await refresh();
        } else {
          accessRef.current = token;
          setAccessToken(token);
        }
        if (token && r) setRole(r);
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ accessToken, role, ready, login, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
