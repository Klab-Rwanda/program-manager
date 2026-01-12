"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Award, BookOpen, Star } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getMyRoadmaps } from "@/lib/services/roadmap.service";
import { Roadmap, Program as BackendProgram } from "@/types";

interface EnhancedRoadmap extends Roadmap {
    program: BackendProgram;
}

interface ProgramWithRoadmaps {
    program: BackendProgram;
    roadmaps: EnhancedRoadmap[];
}

export default function TraineeRoadmapPage() {
    const [roadmaps, setRoadmaps] = useState<EnhancedRoadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const roadmapsData = await getMyRoadmaps();
            setRoadmaps(roadmapsData as EnhancedRoadmap[]);
        } catch (err) {
            toast.error("Failed to load your program roadmap.");
            console.error("Fetch Data Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Group roadmaps by program
    const groupRoadmapsByProgram = (roadmapsList: EnhancedRoadmap[]): ProgramWithRoadmaps[] => {
        const programMap = new Map<string, ProgramWithRoadmaps>();

        roadmapsList.forEach(roadmap => {
            const programId = typeof roadmap.program === 'string' ? roadmap.program : roadmap.program._id;
            const programData = typeof roadmap.program === 'string' ? null : roadmap.program;

            if (!programMap.has(programId) && programData) {
                programMap.set(programId, {
                    program: programData,
                    roadmaps: []
                });
            }

            const entry = programMap.get(programId);
            if (entry) {
                entry.roadmaps.push(roadmap);
            }
        });

        // Sort roadmaps within each program by week number
        programMap.forEach(entry => {
            entry.roadmaps.sort((a, b) => a.weekNumber - b.weekNumber);
        });

        return Array.from(programMap.values());
    };

    // Memoized lists for active and completed programs with their roadmaps
    const activeProgramsWithRoadmaps = useMemo(() => {
        const activeRoadmaps = roadmaps.filter(r => (r.program as BackendProgram)?.status === 'Active');
        return groupRoadmapsByProgram(activeRoadmaps);
    }, [roadmaps]);

    const completedProgramsWithRoadmaps = useMemo(() => {
        const completedRoadmaps = roadmaps.filter(r => (r.program as BackendProgram)?.status === 'Completed');
        return groupRoadmapsByProgram(completedRoadmaps);
    }, [roadmaps]);

    const formatTimeDisplay = (time: string) => {
        if (!time) return "";
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return time;
        }
    };

    const calculateDuration = (startTime: string, endTime: string) => {
        if (!startTime || !endTime) return "Set times";
        try {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            const diffMs = end.getTime() - start.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            if (diffHours < 0) return "Invalid";
            const hours = Math.floor(diffHours);
            const minutes = Math.round((diffHours - hours) * 60);
            if (hours === 0 && minutes === 0) return "0 min";
            else if (minutes === 0) return `${hours}h`;
            else if (hours === 0) return `${minutes}m`;
            else return `${hours}h ${minutes}m`;
        } catch {
            return "Error";
        }
    };

    const renderWeekCard = (roadmap: EnhancedRoadmap) => (
        <AccordionItem
            value={roadmap._id}
            key={roadmap._id}
            className={`border rounded-lg mb-2 ${roadmap.isCurrent ? 'border-yellow-400 bg-yellow-50/50' : ''}`}
        >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                    {roadmap.isCurrent && (
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Current Week
                        </Badge>
                    )}
                    <span className="font-medium">Week {roadmap.weekNumber}: {roadmap.title}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
                {roadmap.objectives && roadmap.objectives.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Learning Objectives</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {roadmap.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </div>
                )}
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Daily Schedule</h4>
                    {(roadmap.topics || []).map(topic => (
                        <div key={topic._id} className="p-3 border rounded-md bg-muted/50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{topic.day}: {topic.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {topic.startTime && topic.endTime ? (
                                            <span>
                                                {formatTimeDisplay(topic.startTime)} - {formatTimeDisplay(topic.endTime)}
                                                <span className="ml-2">({calculateDuration(topic.startTime, topic.endTime)})</span>
                                            </span>
                                        ) : (
                                            <span>{topic.duration || 'No time specified'}</span>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-xs">{topic.sessionType}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );

    const renderProgramCard = (programData: ProgramWithRoadmaps, isCompleted: boolean = false) => {
        const currentWeek = programData.roadmaps.find(r => r.isCurrent);

        return (
            <Card key={programData.program._id} className="mb-4">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{programData.program.name}</CardTitle>
                            <Badge variant={isCompleted ? "secondary" : "default"}>
                                {programData.roadmaps.length} week{programData.roadmaps.length !== 1 ? 's' : ''}
                            </Badge>
                            {isCompleted && <Award className="h-4 w-4 text-green-600" />}
                        </div>
                    </div>
                    {currentWeek && !isCompleted && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Current: <span className="font-medium text-yellow-600">Week {currentWeek.weekNumber} - {currentWeek.title}</span>
                        </p>
                    )}
                </CardHeader>
                <CardContent className={isCompleted ? 'opacity-70' : ''}>
                    {programData.roadmaps.length === 0 ? (
                        <p className="text-center py-6 text-muted-foreground">No roadmaps available yet.</p>
                    ) : (
                        <Accordion type="single" collapsible className="w-full" defaultValue={currentWeek?._id}>
                            {programData.roadmaps.map(roadmap => renderWeekCard(roadmap))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Program Roadmap</h1>
                <p className="text-muted-foreground">View the weekly schedule and topics for your enrolled programs.</p>
            </div>

            {loading ? (
                <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
            ) : roadmaps.length === 0 ? (
                <Card>
                    <CardContent className="py-10">
                        <p className="text-center text-muted-foreground">No roadmaps are available for your programs yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active Programs ({activeProgramsWithRoadmaps.length})</TabsTrigger>
                        <TabsTrigger value="completed">Completed Programs ({completedProgramsWithRoadmaps.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-4">
                        {activeProgramsWithRoadmaps.length === 0 ? (
                            <Card>
                                <CardContent className="py-10">
                                    <p className="text-center text-muted-foreground">No active program roadmaps found.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div>
                                {activeProgramsWithRoadmaps.map(programData => renderProgramCard(programData, false))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="mt-4">
                        {completedProgramsWithRoadmaps.length === 0 ? (
                            <Card>
                                <CardContent className="py-10">
                                    <p className="text-center text-muted-foreground">No roadmaps found for completed programs.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div>
                                {completedProgramsWithRoadmaps.map(programData => renderProgramCard(programData, true))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
