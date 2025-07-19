"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";
import { useAuth } from "./RoleContext";
import { getAllPrograms } from "../services/program.service";
import { getArchivedPrograms } from "../services/archive.service";
import { getAllFacilitators } from "@/lib/services/facilitator.service";

interface CountsContextType {
  counts: {
    programs: number;
    facilitators: number;
    trainees: number;
    certificates: number;
    archived: number;
  };
  refreshCounts: () => Promise<void>;
  loading: boolean;
}

const CountsContext = createContext<CountsContextType | undefined>(undefined);

export function CountsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [counts, setCounts] = useState({
    programs: 0,
    facilitators: 0,
    trainees: 0,
    certificates: 0,
    archived: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchCounts = async () => {
    if (!isAuthenticated || !user) {
      console.log("CountsContext: Not authenticated or no user");
      return;
    }

    console.log("CountsContext: Fetching counts for role:", user.role);
    setLoading(true);
    try {
      if (user.role === "Program Manager" || user.role === "SuperAdmin") {
        console.log("CountsContext: Fetching programs...");
        const programs = await getAllPrograms();
        console.log("CountsContext: Programs fetched:", programs.length);

        console.log("CountsContext: Fetching archived programs...");
        const archivedPrograms = await getArchivedPrograms();
        console.log(
          "CountsContext: Archived programs fetched:",
          archivedPrograms.length
        );

        console.log("CountsContext: Fetching facilitators...");
        const facilitators = await getAllFacilitators();
        console.log(
          "CountsContext: Facilitators fetched:",
          facilitators.length
        );

        setCounts(prev => {
          const newCounts = {
            ...prev,
            programs: programs.length,
            archived: archivedPrograms.length,
            facilitators: facilitators.length,
            trainees: 24, // placeholder
            certificates: 15 // placeholder
          };
          console.log("CountsContext: Updated counts:", newCounts);
          return newCounts;
        });
      }
    } catch (error) {
      console.error("CountsContext: Error fetching counts:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCounts = async () => {
    console.log("CountsContext: Refreshing counts...");
    await fetchCounts();
  };

  useEffect(() => {
    console.log(
      "CountsContext: useEffect triggered, isAuthenticated:",
      isAuthenticated,
      "user:",
      user?.role
    );
    fetchCounts();
  }, [isAuthenticated, user]);

  const value: CountsContextType = {
    counts,
    refreshCounts,
    loading
  };

  return (
    <CountsContext.Provider value={value}>
      {children}
    </CountsContext.Provider>
  );
}

export function useCounts() {
  const context = useContext(CountsContext);
  if (context === undefined) {
    throw new Error("useCounts must be used within a CountsProvider");
  }
  return context;
}
