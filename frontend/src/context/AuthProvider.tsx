import { useState } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";
import axios from "../lib/axios";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const persistAuth = (nextUser: User | null, token?: string | null) => {
    setUser(nextUser);

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }

    if (token) {
      localStorage.setItem("token", token);
    } else if (token === null) {
      localStorage.removeItem("token");
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await axios.post("/login", { email, password });
    persistAuth(res.data.user, res.data.token);
    return res.data.user;
  };

  const register = async (email: string, password: string): Promise<User> => {
    const res = await axios.post("/register", { email, password });
    persistAuth(res.data.user, res.data.token);
    return res.data.user;
  };

  const loginWithGoogle = async (credential: string): Promise<User> => {
    const res = await axios.post("/google", { credential });
    persistAuth(res.data.user, res.data.token);
    return res.data.user;
  };

  const refreshUser = async (): Promise<User | null> => {
    const token = localStorage.getItem("token");
    if (!token) {
      persistAuth(null, null);
      return null;
    }

    try {
      const res = await axios.get("/me");
      persistAuth(res.data.user);
      return res.data.user;
    } catch {
      persistAuth(null, null);
      return null;
    }
  };

  const logout = () => {
    persistAuth(null, null);
  };

  const updateUser = (u: User) => {
    persistAuth(u);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
