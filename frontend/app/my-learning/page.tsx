"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useRole } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, BookOpen, Play, CheckCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface Course { _id: string; title: string; status: string; }
interface ProgramWithCourses {
  _id: string;
  name: string;
  description: string;
  status: string;
  courses: Course[];
  progress: number; // Will be mocked for now
}

export default function MyLearningPage() {
    const { user } = useRole();
    const [myPrograms, setMyPrograms] = useState<ProgramWithCourses[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch programs the trainee is enrolled in
            const programsResponse = await api.get('/programs');
            const enrolledPrograms = programsResponse.data.data;

            // 2. For each program, fetch its approved courses
            const programsWithCourses = await Promise.all(
                enrolledPrograms.map(async (program: any) => {
                    try {
                        const coursesResponse = await api.get(`/courses/program/${program._id}`);
                        const approvedCourses = coursesResponse.data.data.filter((c: Course) => c.status === 'Approved');
                        return { ...program, courses: approvedCourses, progress: Math.floor(Math.random() * 80) + 10 };
                    } catch (e) {
                        console.error(`Failed to fetch courses for program ${program.name}`, e);
                        return { ...program, courses: [], progress: 0 }; // Return program even if courses fail
                    }
                })
            );

            setMyPrograms(programsWithCourses);
        } catch (err) {
            setError('Failed to fetch your learning materials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
      return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
      return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
                <p className="text-muted-foreground">Track your progress and continue your learning journey.</p>
            </div>
            
            <div className="space-y-6">
                {myPrograms.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4"/>
                            You are not enrolled in any programs yet.
                        </CardContent>
                    </Card>
                ) : myPrograms.map(program => (
                    <Card key={program._id}>
                        <CardHeader>
                            <CardTitle>{program.name}</CardTitle>
                            <CardDescription>{program.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{program.progress}%</span>
                                </div>
                                <Progress value={program.progress} />
                            </div>
                            <h4 className="font-semibold mb-2">Courses</h4>
                            <div className="space-y-2">
                                {program.courses.length > 0 ? program.courses.map(course => (
                                    <div key={course._id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Play className="h-4 w-4 text-green-500"/>
                                            <p className="font-medium">{course.title}</p>
                                        </div>
                                        <Button size="sm" asChild>
                                            <Link href={`/dashboard/courses/${course._id}`}>Start Course</Link>
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No approved courses available yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}