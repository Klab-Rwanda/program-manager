// lib/contexts/AuthContext.tsx
"use client";
import { createContext, useContext, useState } from "react";

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);

  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    try {
      let API_URL = "";

      const hostname = window.location.hostname;

      if (hostname === "localhost") {
        API_URL = "http://localhost:8000";
      } else if (hostname.includes("vercel")) {
        API_URL = "https://program-manager-klab.onrender.com";
      } else {
        // Default to new production API
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

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ login, logout, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
