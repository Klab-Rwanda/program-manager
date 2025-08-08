// src/lib/contexts/RoleContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/types";
import api from "@/lib/api"; // (optional) still imported if you use it elsewhere

// Define supported backend roles
export type UserRole =
  | "super_admin"
  | "program_manager"
  | "facilitator"
  | "trainee"
  | "it_support";

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const normalizeRole = (role: string): UserRole => {
    const roleMap: Record<string, UserRole> = {
      "SuperAdmin": "super_admin",
      "Program Manager": "program_manager",
      "Facilitator": "facilitator",
      "Trainee": "trainee",
      "ItSupport": "it_support",
    };
    return roleMap[role] || (role as UserRole);
  };

  const login = async (email: string, password: string) => {
    let API_URL = "";

    const hostname = window.location.hostname;

    if (hostname === "localhost") {
        API_URL = "http://localhost:8000";
      } else if (hostname.includes("vercel")) {
        API_URL = "https://program-manager-klab.onrender.com";
      } else {
        API_URL = "https://backendklab.andasy.dev";
      }

    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    setIsAuthenticated(true);
  };

  const logout = (): void => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const value: AuthContextType = {
    user,
    role: user ? normalizeRole(user.role) : null,
    isAuthenticated,
    loading,
    login,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a RoleProvider");
  }
  return context;
}
