import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { refreshSession, setAccessToken, setSessionExpiredHandler } from "../api/client.js";
import {
  loginUser,
  registerUser,
  logoutUser,
  changePassword as changePasswordRequest,
  updateMe,
} from "../api/authApi.js";
import { can, canSeeField, canEditField } from "../utils/permissions.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
    });

    let ignore = false;
    refreshSession()
      .then((res) => {
        if (!ignore) setUser(res.data);
      })
      .catch(() => {
        if (!ignore) setUser(null);
      })
      .finally(() => {
        if (!ignore) setChecking(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(() => {
    const startSession = (res) => {
      setAccessToken(res.accessToken);
      setUser(res.data);
      return res.data;
    };

    return {
      user,
      checking,
      can: (permission) => can(user, permission),
      canSeeField: (field) => canSeeField(user, field),
      canEditField: (field) => canEditField(user, field),
      login: async (email, password) => startSession(await loginUser({ email, password })),
      register: async (data) => startSession(await registerUser(data)),
      logout: async () => {
        try {
          await logoutUser();
        } finally {
          setAccessToken(null);
          setUser(null);
        }
      },
      changePassword: async (data) => startSession(await changePasswordRequest(data)),
      updateProfile: async (data) => {
        const res = await updateMe(data);
        setUser(res.data);
        return res.data;
      },
    };
  }, [user, checking]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}