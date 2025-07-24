"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getMyRoadmaps } from "@/lib/services/roadmap.service";
import { Roadmap } from "@/types";

export default function TraineeRoadmapPage() {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const roadmapsData = await getMyRoadmaps();
            setRoadmaps(roadmapsData);
        } catch (err) {
            toast.error("Failed to load your program roadmap.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Program Roadmap</h1>
                <p className="text-muted-foreground">View the weekly schedule and topics for your enrolled programs.</p>
            </div>

            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
            roadmaps.length === 0 ? <p className="text-center py-10 text-muted-foreground">No roadmaps are available for your programs yet.</p> :
            <Accordion type="single" collapsible className="w-full">
                {roadmaps.map(roadmap => (
                    <AccordionItem value={roadmap._id} key={roadmap._id}>
                        <AccordionTrigger className="text-lg p-4 hover:no-underline">
                            Week {roadmap.weekNumber}: {roadmap.title} ({(roadmap.program as any)?.name})
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-4">
                             <div className="space-y-2">
                                <h4 className="font-semibold">Learning Objectives</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {roadmap.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">Daily Schedule</h4>
                                {roadmap.topics.map(topic => (
                                    <div key={topic._id} className="p-3 border rounded-md bg-gray-50">
                                        <p className="font-medium">{topic.day}: {topic.title}</p>
                                        <p className="text-xs text-muted-foreground">{topic.duration} - {topic.sessionType}</p>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            }
        </div>
    );
}