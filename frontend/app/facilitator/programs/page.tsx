"use client";

import { useState } from "react";
import { Calendar, Clock, Users, BookOpen, MapPin, Star, TrendingUp, Award } from "lucide-react";

import { AppSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FacilitatorPrograms() {
  const [activeTab, setActiveTab] = useState("active");

  const programs = [
    {
      id: 1,
      name: "Software Engineering Bootcamp",
      description: "Comprehensive full-stack development program covering modern technologies",
      status: "active",
      progress: 75,
      students: 24,
      maxStudents: 30,
      startDate: "2024-01-15",
      endDate: "2024-07-15",
      location: "KLab Innovation Center",
      instructor: "John Doe",
      rating: 4.8,
      sessionsCompleted: 45,
      totalSessions: 60,
      nextSession: "2024-01-25 09:00 AM",
      technologies: ["React", "Node.js", "Python", "AWS"],
      category: "Development",
      level: "Advanced",
    },
    {
      id: 2,
      name: "Web Development Fundamentals",
      description: "Learn the basics of web development with HTML, CSS, and JavaScript",
      status: "active",
      progress: 45,
      students: 18,
      maxStudents: 25,
      startDate: "2024-02-01",
      endDate: "2024-05-01",
      location: "KLab Innovation Center",
      instructor: "Jane Smith",
      rating: 4.6,
      sessionsCompleted: 20,
      totalSessions: 40,
      nextSession: "2024-01-26 10:00 AM",
      technologies: ["HTML", "CSS", "JavaScript", "Bootstrap"],
      category: "Development",
      level: "Beginner",
    },
    {
      id: 3,
      name: "Mobile App Development",
      description: "Build native and cross-platform mobile applications",
      status: "upcoming",
      progress: 0,
      students: 12,
      maxStudents: 20,
      startDate: "2024-03-01",
      endDate: "2024-08-01",
      location: "KLab Innovation Center",
      instructor: "Mike Johnson",
      rating: 0,
      sessionsCompleted: 0,
      totalSessions: 50,
      nextSession: "2024-03-01 09:00 AM",
      technologies: ["React Native", "Flutter", "Firebase"],
      category: "Mobile",
      level: "Intermediate",
    },
  ];

  const stats = [
    {
      title: "Active Programs",
      value: "2",
      description: "Currently running",
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      title: "Total Students",
      value: "42",
      description: "Across all programs",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Average Rating",
      value: "4.7",
      description: "Student satisfaction",
      icon: Star,
      color: "text-yellow-500",
    },
    {
      title: "Completion Rate",
      value: "89%",
      description: "Program success rate",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "upcoming":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPrograms = programs.filter((program) => {
    if (activeTab === "all") return true;
    return program.status === activeTab;
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">My Programs</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Programs Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">My Assigned Programs</CardTitle>
                  <CardDescription>Manage and track your teaching programs</CardDescription>
                </div>
                <Button className="bg-[#1f497d] hover:bg-[#1a3d6b]">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Programs
                </Button>
              </div>
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
                      <Card key={program.id} className="bg-card border-border hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-foreground text-lg">{program.name}</CardTitle>
                              <CardDescription className="text-muted-foreground">
                                {program.description}
                              </CardDescription>
                            </div>
                            <div className={`h-3 w-3 rounded-full ${getStatusColor(program.status)}`} />
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Badge variant="outline" className={getLevelColor(program.level)}>
                              {program.level}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {program.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium text-foreground">{program.progress}%</span>
                            </div>
                            <Progress value={program.progress} className="h-2" />
                          </div>

                          {/* Key Info */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>Students</span>
                              </div>
                              <p className="font-medium text-foreground">
                                {program.students}/{program.maxStudents}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Sessions</span>
                              </div>
                              <p className="font-medium text-foreground">
                                {program.sessionsCompleted}/{program.totalSessions}
                              </p>
                            </div>
                          </div>

                          {/* Schedule */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Next Session</span>
                            </div>
                            <p className="font-medium text-foreground">{program.nextSession}</p>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{program.location}</span>
                          </div>

                          {/* Rating */}
                          {program.rating > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(program.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-foreground">{program.rating}</span>
                            </div>
                          )}

                          {/* Technologies */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Technologies</p>
                            <div className="flex flex-wrap gap-1">
                              {program.technologies.slice(0, 3).map((tech, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                              {program.technologies.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{program.technologies.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button className="flex-1 bg-[#1f497d] hover:bg-[#1a3d6b]" size="sm">
                              <BookOpen className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <Users className="mr-2 h-4 w-4" />
                              Students
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredPrograms.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No {activeTab} programs found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>Schedule Session</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Manage Students</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Award className="h-6 w-6" />
                  <span>View Certificates</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
