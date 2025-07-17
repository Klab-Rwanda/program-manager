// "use client"

// import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import api from '../api'; // You must have a lib/api.ts file for axios
// import { User, UserRole } from '@/types/user';

// interface AuthContextType {
//   user: User | null;
//   role: UserRole | null;
//   isAuthenticated: boolean;
//   loading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const normalizeRole = (roleString: string): UserRole => {
//   if (!roleString) return 'trainee';
//   return roleString.toLowerCase().replace(/ /g, '_') as UserRole;
// };

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
//   const pathname = usePathname();

//   const logout = useCallback(() => {
//     localStorage.removeItem('authToken');
//     setUser(null);
//     router.push('/auth/login');
//   }, [router]);

//   useEffect(() => {
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       api.get('/users/me')
//         .then(response => setUser(response.data.data))
//         .catch(() => logout())
//         .finally(() => setLoading(false));
//     } else {
//       setLoading(false);
//       if (!pathname.startsWith('/auth')) {
//         router.push('/auth/login');
//       }
//     }
//   }, [pathname, router, logout]);

//   const login = async (email: string, password: string) => {
//     const response = await api.post('/auth/login', { email, password });
//     const { accessToken, user: userData } = response.data.data;
//     if (!accessToken || !userData) throw new Error("Login response was invalid.");
//     localStorage.setItem('authToken', accessToken);
//     setUser(userData);
//     router.replace('/dashboard'); 
//   };
  
//   const value = {
//     user,
//     role: user ? normalizeRole(user.role as string) : null,
//     isAuthenticated: !!user,
//     loading,
//     login,
//     logout,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }