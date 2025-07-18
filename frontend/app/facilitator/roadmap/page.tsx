"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, BookOpen, Users, CheckCircle, AlertCircle, Plus, Loader2 } from "lucide-react";
import api from "@/lib/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// --- Type Definitions ---
interface Program {
    _id: string;
    name: string;
}

interface RoadmapTopic {
    day: string;
    topic: string;
    duration: string;
    type: string;
    // Assuming you might add this feature later
    completed?: boolean; 
}

interface Roadmap {
    _id: string;
    program: string; // This will be an ID from the backend
    weekNumber: number;
    title: string;
    startDate: string;
    objectives: string[];
    topics: RoadmapTopic[];
}

const initialWeekPlan = {
    program: "",
    weekNumber: "",
    title: "",
    startDate: "",
    objectives: "",
    topics: ["", "", "", "", ""],
};

export default function WeeklyRoadmapPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [loading, setLoading] = useState({ programs: true, roadmaps: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [planWeekOpen, setPlanWeekOpen] = useState(false);
    const [weekPlan, setWeekPlan] = useState(initialWeekPlan);

    const fetchMyPrograms = useCallback(async () => {
        setLoading(prev => ({ ...prev, programs: true }));
        try {
            const res = await api.get('/programs');
            const userPrograms: Program[] = res.data.data;
            setPrograms(userPrograms);
            if (userPrograms.length > 0 && !selectedProgramId) {
                setSelectedProgramId(userPrograms[0]._id);
            }
        } catch (error) {
            console.error("Failed to fetch programs", error);
        } finally {
            setLoading(prev => ({ ...prev, programs: false }));
        }
    }, [selectedProgramId]);

    const fetchRoadmaps = useCallback(async () => {
        if (!selectedProgramId) return;
        setLoading(prev => ({ ...prev, roadmaps: true }));
        try {
            const res = await api.get(`/roadmaps/program/${selectedProgramId}`);
            setRoadmaps(res.data.data);
        } catch (error) {
            console.error("Failed to fetch roadmaps", error);
            setRoadmaps([]);
        } finally {
            setLoading(prev => ({ ...prev, roadmaps: false }));
        }
    }, [selectedProgramId]);

    useEffect(() => {
        fetchMyPrograms();
    }, [fetchMyPrograms]);

    useEffect(() => {
        fetchRoadmaps();
    }, [fetchRoadmaps]);

    const handlePlanWeek = async () => {
        if (!weekPlan.program || !weekPlan.weekNumber || !weekPlan.title || !weekPlan.startDate) {
            return alert("Please fill in all required fields.");
        }
        setIsSubmitting(true);
        try {
            const payload = {
                program: weekPlan.program,
                weekNumber: parseInt(weekPlan.weekNumber),
                title: weekPlan.title,
                startDate: weekPlan.startDate,
                objectives: weekPlan.objectives.split('\n').filter(o => o.trim() !== ''),
                topics: weekPlan.topics
                    .map((topic, index) => ({
                        day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index],
                        topic: topic.trim(),
                    }))
                    .filter(t => t.topic),
            };
            await api.post('/roadmaps', payload);
            alert(`Week ${weekPlan.weekNumber} planned successfully!`);
            setPlanWeekOpen(false);
            setWeekPlan(initialWeekPlan);
            fetchRoadmaps();
        } catch (err: any) {
            alert(`Error: ${err.response?.data?.message || "Could not save roadmap."}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTopicChange = (index: number, value: string) => {
        const newTopics = [...weekPlan.topics];
        newTopics[index] = value;
        setWeekPlan({ ...weekPlan, topics: newTopics });
    };

    const programNameMap = new Map(programs.map(p => [p._id, p.name]));
    
    // COLOR PALETTE FIX: Helper function for topic type badge
    const getTypeColor = (type: string) => {
        return type === "in-person" 
            ? "bg-green-100 text-green-800" 
            : "bg-blue-100 text-blue-800"; // Generic colors for session types are usually fine
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Weekly Roadmap</h1>
                    <p className="text-muted-foreground">Plan and track weekly learning objectives and schedules.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Select Program" /></SelectTrigger>
                        <SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Dialog open={planWeekOpen} onOpenChange={setPlanWeekOpen}>
                        <DialogTrigger asChild>
                            <Button style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">
                                <Plus className="mr-2 h-4 w-4" />Plan Week
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Plan New Week</DialogTitle><DialogDescription>Create a weekly roadmap for your program.</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2"><Label>Program *</Label><Select value={weekPlan.program} onValueChange={(v) => setWeekPlan(p => ({ ...p, program: v }))}><SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Week Number *</Label><Input type="number" placeholder="e.g., 4" value={weekPlan.weekNumber} onChange={(e) => setWeekPlan(p => ({ ...p, weekNumber: e.target.value }))} /></div>
                                    <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={weekPlan.startDate} onChange={(e) => setWeekPlan(p => ({ ...p, startDate: e.target.value }))} /></div>
                                </div>
                                <div className="space-y-2"><Label>Week Title *</Label><Input placeholder="e.g., Advanced JavaScript" value={weekPlan.title} onChange={(e) => setWeekPlan(p => ({ ...p, title: e.target.value }))} /></div>
                                <div className="space-y-2"><Label>Daily Topics</Label>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (<div key={day} className="space-y-1"><Label className="text-sm text-muted-foreground">{day}</Label><Input placeholder={`${day} topic...`} value={weekPlan.topics[index]} onChange={(e) => handleTopicChange(index, e.target.value)} /></div>))}</div>
                                <div className="space-y-2"><Label>Learning Objectives</Label><Textarea placeholder="Enter objectives (one per line)..." value={weekPlan.objectives} onChange={(e) => setWeekPlan(p => ({ ...p, objectives: e.target.value }))} rows={4} /></div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setPlanWeekOpen(false)}>Cancel</Button>
                                <Button onClick={handlePlanWeek} disabled={isSubmitting} style={{ backgroundColor: '#1f497d' }} className="hover:bg-[#1a3d6b]">{isSubmitting ? <Loader2 className="animate-spin" /> : "Create Week Plan"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading.roadmaps ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : roadmaps.length > 0 ? (
                roadmaps.map((week) => (
                    <Card key={week._id} className="bg-card border-border">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <CardTitle className="text-foreground">{programNameMap.get(week.program) || 'Unknown Program'}</CardTitle>
                                        <Badge>Week {week.weekNumber}</Badge>
                                    </div>
                                    <CardDescription className="text-lg font-medium">{week.title}</CardDescription>
                                    <p className="text-sm text-muted-foreground mt-1">Starts: {new Date(week.startDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Learning Objectives</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{week.objectives.map((obj, i) => (<div key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /><span className="text-muted-foreground">{obj}</span></div>))}</div>
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground mb-3">Daily Schedule</h4>
                                <div className="space-y-3">
                                  {week.topics.map((topic, i) => (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${topic.completed ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
                                        <div className="flex items-center gap-3">
                                            {topic.completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-[#1f497d]" />}
                                            <div>
                                                <p className="font-medium text-foreground">{topic.day}</p>
                                                <p className="text-sm text-muted-foreground">{topic.topic}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={getTypeColor(topic.type)}>
                                            {topic.type === "in-person" ? "In-Person" : "Online"}
                                        </Badge>
                                    </div>
                                  ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-16">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No roadmaps found for this program. Click "Plan Week" to get started.</p>
                </div>
            )}
        </div>
    );
}