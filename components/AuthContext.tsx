"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: "admin" | "bidder";
  isFlagged: boolean;
  flagReason?: string | null;
  createdAt?: string;
  profile?: {
    fullName: string;
    phone: string;
    address: string;
    rawEncrypted: {
      fullNameCiphertext: string | null;
      phoneCiphertext: string | null;
      addressCiphertext: string | null;
    };
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login gagal" };
      }
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: "Gagal terhubung ke server." };
    }
  };

  const register = async (formData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address: string;
  }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registrasi gagal" };
      }
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: "Gagal terhubung ke server." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

