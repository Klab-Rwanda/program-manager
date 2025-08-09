"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Calendar, Clock, BookOpen, Award, XCircle, Send, CheckCircle } from "lucide-react"; // Import icons for completed view
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // NEW: Import Tabs
import { Badge } from "@/components/ui/badge"; // NEW: Import Badge
import { getMyRoadmaps } from "@/lib/services/roadmap.service";
import { Roadmap, Program as BackendProgram, Course } from "@/types"; // Import BackendProgram and Course for status/title

// Extend Roadmap type to ensure program and course are populated with status/title
interface EnhancedRoadmap extends Roadmap {
    program: BackendProgram; // Ensure program is populated with status
    course: Course; // Ensure course is populated with title
}

export default function TraineeRoadmapPage() {
    const [roadmaps, setRoadmaps] = useState<EnhancedRoadmap[]>([]); // Use EnhancedRoadmap
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active"); // NEW: State for active tab

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // getMyRoadmaps now fetches roadmaps from Active/Completed programs
            const roadmapsData = await getMyRoadmaps();
            setRoadmaps(roadmapsData as EnhancedRoadmap[]); // Cast to EnhancedRoadmap
        } catch (err) {
            toast.error("Failed to load your program roadmap.");
            console.error("Fetch Data Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // NEW: Memoized lists for active and completed roadmaps
    const activeRoadmaps = useMemo(() => 
        roadmaps.filter(roadmap => (roadmap.program as BackendProgram)?.status === 'Active'), 
        [roadmaps]
    );
    const completedRoadmaps = useMemo(() => 
        roadmaps.filter(roadmap => (roadmap.program as BackendProgram)?.status === 'Completed'), 
        [roadmaps]
    );

    // Helper for status badge (can be reused from Facilitator pages)
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Draft</Badge>;
            case 'pending_approval': return <Badge variant="outline"><Send className="mr-1 h-3 w-3" />Pending Approval</Badge>;
            case 'approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
            case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Helper to format time (reused from Facilitator pages)
    const formatTimeDisplay = (time: string) => {
        if (!time) return "";
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
            return time;
        }
    };

    // Helper to calculate duration (reused from Facilitator pages)
    const calculateDuration = (startTime: string, endTime: string) => {
        if (!startTime || !endTime) {
            return "Set times";
        }
        try {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            const diffMs = end.getTime() - start.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            if (diffHours < 0) { return "Invalid"; }
            const hours = Math.floor(diffHours);
            const minutes = Math.round((diffHours - hours) * 60);
            if (hours === 0 && minutes === 0) { return "0 min"; }
            else if (minutes === 0) { return `${hours}h`; }
            else if (hours === 0) { return `${minutes}m`; }
            else { return `${hours}h ${minutes}m`; }
        } catch (error) { return "Error"; }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Program Roadmap</h1>
                <p className="text-muted-foreground">View the weekly schedule and topics for your enrolled programs.</p>
            </div>

            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
            roadmaps.length === 0 ? <p className="text-center py-10 text-muted-foreground">No roadmaps are available for your programs yet.</p> :
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Roadmaps ({activeRoadmaps.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed Programs Roadmaps ({completedRoadmaps.length})</TabsTrigger>
                </TabsList>

                {/* Active Roadmaps Tab Content */}
                <TabsContent value="active" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Active Programs Roadmaps</CardTitle></CardHeader>
                        <CardContent>
                            {activeRoadmaps.length === 0 ? <p className="text-center py-10 text-muted-foreground">No active roadmaps found.</p> :
                            <Accordion type="single" collapsible className="w-full">
                                {activeRoadmaps.map(roadmap => (
                                    <AccordionItem value={roadmap._id} key={roadmap._id}>
                                        <AccordionTrigger className="text-lg p-4 hover:no-underline">
                                            <div className="flex items-center gap-3">
                                                <span>Week {roadmap.weekNumber}: {roadmap.title}</span>
                                                <span className="text-sm text-gray-500">
                                                    ({(roadmap.program as BackendProgram)?.name} - {(roadmap.course as Course)?.title})
                                                </span>
                                                {getStatusBadge(roadmap.status)}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Learning Objectives</h4>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                    {(roadmap.objectives || []).map((obj, i) => <li key={i}>{obj}</li>)}
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Daily Schedule</h4>
                                                {(roadmap.topics || []).map(topic => (
                                                    <div key={topic._id} className="p-3 border rounded-md bg-gray-50">
                                                        <p className="font-medium">{topic.day}: {topic.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {topic.startTime && topic.endTime ? (
                                                                `${formatTimeDisplay(topic.startTime)} - ${formatTimeDisplay(topic.endTime)} (${calculateDuration(topic.startTime, topic.endTime)})`
                                                            ) : (
                                                                topic.duration || 'No time specified'
                                                            )} - {topic.sessionType}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        }
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Completed Programs Roadmaps Tab Content */}
                <TabsContent value="completed" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Roadmaps from Completed Programs</CardTitle></CardHeader>
                        <CardContent>
                            {completedRoadmaps.length === 0 ? <p className="text-center py-10 text-muted-foreground">No roadmaps found for completed programs.</p> :
                            <Accordion type="single" collapsible className="w-full">
                                {completedRoadmaps.map(roadmap => (
                                    <AccordionItem value={roadmap._id} key={roadmap._id}>
                                        <AccordionTrigger className="text-lg p-4 hover:no-underline">
                                            <div className="flex items-center gap-3">
                                                <span>Week {roadmap.weekNumber}: {roadmap.title}</span>
                                                <span className="text-sm text-gray-500">
                                                    ({(roadmap.program as BackendProgram)?.name} - {(roadmap.course as Course)?.title}) (Completed)
                                                </span>
                                                {getStatusBadge(roadmap.status)}
                                                <Award className="ml-2 h-4 w-4 text-green-600" /> {/* Visual cue for completed */}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 space-y-4 opacity-70"> {/* Opacity cue */}
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Learning Objectives</h4>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                    {(roadmap.objectives || []).map((obj, i) => <li key={i}>{obj}</li>)}
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Daily Schedule</h4>
                                                {(roadmap.topics || []).map(topic => (
                                                    <div key={topic._id} className="p-3 border rounded-md bg-gray-50">
                                                        <p className="font-medium">{topic.day}: {topic.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {topic.startTime && topic.endTime ? (
                                                                `${formatTimeDisplay(topic.startTime)} - ${formatTimeDisplay(topic.endTime)} (${calculateDuration(topic.startTime, topic.endTime)})`
                                                            ) : (
                                                                topic.duration || 'No time specified'
                                                            )} - {topic.sessionType}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            }
        </div>
    );
}