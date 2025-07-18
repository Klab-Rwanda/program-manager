// // src/lib/contexts/SidebarContext.tsx
// "use client";

// import React, { createContext, useContext, useState, ReactNode } from 'react';

// interface SidebarContextType {
//   isCollapsed: boolean;
//   toggleSidebar: () => void;
//   isMobile: boolean;
//   isMobileMenuOpen: boolean;
//   toggleMobileMenu: () => void;
//   closeMobileMenu: () => void;
// }

// const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// export const SidebarProvider = ({ children }: { children: ReactNode }) => {
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // This should ideally be a hook, but for simplicity we can do it here.
//   React.useEffect(() => {
//     const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
//     checkIsMobile();
//     window.addEventListener('resize', checkIsMobile);
//     return () => window.removeEventListener('resize', checkIsMobile);
//   }, []);

//   const toggleSidebar = () => {
//     if (!isMobile) {
//       setIsCollapsed(prev => !prev);
//     }
//   };

//   const toggleMobileMenu = () => {
//     setIsMobileMenuOpen(prev => !prev);
//   }

//   const closeMobileMenu = () => {
//     setIsMobileMenuOpen(false);
//   }

//   const value = { isCollapsed, toggleSidebar, isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu };

//   return (
//     <SidebarContext.Provider value={value}>
//       {children}
//     </SidebarContext.Provider>
//   );
// };

// export const useSidebar = () => {
//   const context = useContext(SidebarContext);
//   if (context === undefined) {
//     throw new Error('useSidebar must be used within a SidebarProvider');
//   }
//   return context;
// };