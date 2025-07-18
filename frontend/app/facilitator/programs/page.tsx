"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Users, BookOpen, MapPin, Star, TrendingUp, Award, Loader2, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Program {
  _id: string;
  name: string;
  description: string;
  status: 'Active' | 'Upcoming' | 'Completed'; // Simplified to match original UI
  progress: number;
  trainees: any[];
  startDate: string;
  endDate: string;
  // Mocked data to match original UI
  location: string;
  rating: number;
  sessionsCompleted: number;
  totalSessions: number;
  nextSession: string;
  technologies: string[];
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export default function FacilitatorPrograms() {
  const [activeTab, setActiveTab] = useState("active");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacilitatorPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/programs');
      const fetchedPrograms = response.data.data.map((p: any) => ({
        ...p,
        // Mapping backend status to frontend status if needed, or keeping it
        status: p.status === 'Active' ? 'active' : p.status === 'Completed' ? 'completed' : 'upcoming',
        progress: p.status === 'Completed' ? 100 : Math.floor(Math.random() * 60) + 20,
        students: p.trainees.length,
        maxStudents: (p.trainees.length || 20) + 5,
        rating: 4.5 + Math.random() * 0.4,
        sessionsCompleted: Math.floor(Math.random() * 40) + 5,
        totalSessions: 60,
        nextSession: `2024-08-${Math.floor(Math.random() * 10) + 10} 09:00 AM`,
        technologies: ["React", "Node.js", "Python"],
        category: "Development",
        level: "Advanced",
        location: "KLab Innovation Center",
      }));
      setPrograms(fetchedPrograms);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load programs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilitatorPrograms();
  }, [fetchFacilitatorPrograms]);

  const stats = [
    { title: "Active Programs", value: programs.filter(p => p.status === 'Active').length, icon: BookOpen, color: "text-green-500" },
    { title: "Total Students", value: programs.reduce((sum, p) => sum + p.trainees.length, 0), icon: Users, color: "text-blue-500" },
    { title: "Average Rating", value: (programs.reduce((sum, p) => sum + p.rating, 0) / programs.length || 0).toFixed(1), icon: Star, color: "text-yellow-500" },
    { title: "Completion Rate", value: "89%", icon: TrendingUp, color: "text-purple-500" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "upcoming": return "bg-blue-500";
      case "completed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPrograms = programs.filter((program) => {
    if (activeTab === "all") return true;
    return program.status === activeTab;
  });

  if(loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  if(error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Programs</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">My Assigned Programs</CardTitle>
          <CardDescription>Manage and track your teaching programs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="all">All Programs</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPrograms.map((program) => (
                  <Card key={program._id} className="bg-card border-border hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-foreground text-lg">{program.name}</CardTitle>
                          <CardDescription className="text-muted-foreground">{program.description}</CardDescription>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(program.status)}`} />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className={getLevelColor(program.level)}>{program.level}</Badge>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">{program.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-medium text-foreground">{program.progress}%</span></div>
                        <Progress value={program.progress} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1"><div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span>Students</span></div><p className="font-medium text-foreground">{program.trainees.length}/{program.maxStudents}</p></div>
                        <div className="space-y-1"><div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>Sessions</span></div><p className="font-medium text-foreground">{program.sessionsCompleted}/{program.totalSessions}</p></div>
                      </div>
                      <div className="space-y-2"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /><span>Next Session</span></div><p className="font-medium text-foreground">{program.nextSession}</p></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /><span>{program.location}</span></div>
                      <div className="flex items-center gap-2"><div className="flex items-center gap-1">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < Math.floor(program.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />))}</div><span className="text-sm font-medium text-foreground">{program.rating.toFixed(1)}</span></div>
                      <div className="space-y-2"><p className="text-sm font-medium text-foreground">Technologies</p><div className="flex flex-wrap gap-1">{program.technologies.slice(0, 3).map((tech, index) => (<Badge key={index} variant="secondary" className="text-xs">{tech}</Badge>))}{program.technologies.length > 3 && (<Badge variant="secondary" className="text-xs">+{program.technologies.length - 3} more</Badge>)}</div></div>
                      <div className="flex gap-2 pt-2"><Button className="flex-1 bg-[#1f497d] hover:bg-[#1a3d6b]" size="sm"><BookOpen className="mr-2 h-4 w-4" />View Details</Button><Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" />Students</Button></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {filteredPrograms.length === 0 && (<div className="text-center py-8"><BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No {activeTab} programs found</p></div>)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}