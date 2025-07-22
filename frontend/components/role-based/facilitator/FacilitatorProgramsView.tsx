"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, BookOpen, Users, Calendar } from "lucide-react";
import { Program, getAllPrograms } from "@/lib/services/program.service";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FacilitatorProgramsView() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // This service fetches programs relevant to the logged-in user (facilitator/trainee)
      const data = await getAllPrograms();
      setPrograms(data);
    } catch (err) {
      setError("Failed to load your programs.");
      toast.error("Failed to load your programs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Programs</h1>
          <p className="text-muted-foreground">An overview of programs you are involved in.</p>
        </div>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Programs Found</h3>
          <p className="mt-1 text-sm text-gray-500">You are not currently assigned to any programs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card key={program._id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{program.name}</CardTitle>
                  <Badge className="capitalize">{program.status}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                  <p className="text-sm text-gray-500 flex items-center gap-2"><Users size={14}/> {program.trainees?.length || 0} Trainees</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2"><Calendar size={14}/> Ends on {new Date(program.endDate).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacilitatorProgramsView;