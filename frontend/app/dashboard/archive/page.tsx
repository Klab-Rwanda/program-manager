"use client"

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Archive, Search, Filter, Eye, Download, Calendar, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ArchivedProgram {
  _id: string;
  name: string;
  description: string;
  updatedAt: string; // This is when it was deactivated
  trainees: any[];
}

export default function ArchivePage() {
  const [archivedPrograms, setArchivedPrograms] = useState<ArchivedProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchived = async () => {
      setLoading(true);
      try {
        const response = await api.get('/programs/archived');
        // The backend uses mongoose-paginate, so data is in response.data.data.docs
        setArchivedPrograms(response.data.data.docs || response.data.data); 
      } catch (err) {
        console.error("Failed to fetch archived programs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, []);

  if (loading) return <div className="flex justify-center p-16"><Loader2 className="h-12 w-12 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          <p className="text-muted-foreground">View deactivated programs, certificates, and reports.</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export All</Button>
      </div>

      {/* Filters can be added here later */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {archivedPrograms.length > 0 ? archivedPrograms.map((item) => (
          <Card key={item._id}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Archive className="h-4 w-4" />
                <CardTitle className="text-lg">{item.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              <div className="flex items-center space-x-2 mt-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Archived: {new Date(item.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item.trainees.length} participants</span>
              </div>
              <div className="flex space-x-2 mt-4">
                {/* A reactivate button would go here */}
                <Button variant="outline" size="sm"><Eye className="h-4 w-4" /> View</Button>
              </div>
            </CardContent>
          </Card>
        )) : <p>No archived items found.</p>}
      </div>
    </div>
  );
}