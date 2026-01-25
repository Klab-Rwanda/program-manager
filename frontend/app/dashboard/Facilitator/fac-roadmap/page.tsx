"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Loader2, Send, Clock, CheckCircle, XCircle, Users, BookOpen, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getMyRoadmaps, saveRoadmap, deleteRoadmap, setCurrentWeek } from "@/lib/services/roadmap.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Roadmap, Program as BackendProgram } from "@/types";

interface EnhancedRoadmap extends Roadmap {
    program: BackendProgram;
}

interface ProgramWithRoadmaps {
    program: BackendProgram;
    roadmaps: EnhancedRoadmap[];
}

const initialFormData = {
    program: "",
    weekNumber: "",
    title: "",
    startDate: "",
    objectives: "",
    topics: [{
        day: "Monday",
        title: "",
        startTime: "09:00",
        endTime: "12:00",
        sessionType: "in-person"
    }]
};

export default function FacilitatorRoadmapPage() {
    const [roadmaps, setRoadmaps] = useState<EnhancedRoadmap[]>([]);
    const [myPrograms, setMyPrograms] = useState<BackendProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSendingToStudents, setIsSendingToStudents] = useState(false);
    const [sentRoadmaps, setSentRoadmaps] = useState<Set<string>>(new Set());
    const [editingRoadmap, setEditingRoadmap] = useState<EnhancedRoadmap | null>(null);
    const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
    const [activeTab, setActiveTab] = useState("active");
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [roadmapToDelete, setRoadmapToDelete] = useState<EnhancedRoadmap | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [roadmapsData, programsData] = await Promise.all([
                getMyRoadmaps(),
                getAllPrograms()
            ]);

            setRoadmaps(roadmapsData as EnhancedRoadmap[]);
            setMyPrograms(programsData);
        } catch (err) {
            toast.error("Failed to load data.");
            console.error("Fetch Data Error:", err);
        } finally { setLoading(false); }
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

    // Get active programs that don't have any roadmaps yet
    const activeProgramsWithoutRoadmaps = useMemo(() => {
        const programIdsWithRoadmaps = new Set(activeProgramsWithRoadmaps.map(p => p.program._id));
        return myPrograms.filter(p => p.status === 'Active' && !programIdsWithRoadmaps.has(p._id));
    }, [myPrograms, activeProgramsWithRoadmaps]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Draft</Badge>;
            case 'pending_approval':
                return <Badge variant="outline"><Send className="mr-1 h-3 w-3" />Pending Approval</Badge>;
            case 'approved':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleOpenModal = (roadmap: EnhancedRoadmap | null = null, programId: string | null = null) => {
        setEditingRoadmap(roadmap);
        if (roadmap) {
            const convertedTopics = (roadmap.topics || []).map(topic => {
                if (topic.startTime && topic.endTime) {
                    return topic;
                } else {
                    return {
                        ...topic,
                        startTime: "09:00",
                        endTime: "12:00"
                    };
                }
            });

            setFormData({
                program: typeof roadmap.program === 'string' ? roadmap.program : roadmap.program._id,
                weekNumber: String(roadmap.weekNumber),
                title: roadmap.title,
                startDate: new Date(roadmap.startDate).toISOString().split('T')[0],
                objectives: roadmap.objectives.join('\n'),
                topics: convertedTopics.length > 0 ? convertedTopics.map(t => ({
                    day: t.day,
                    title: t.title,
                    startTime: t.startTime || "09:00",
                    endTime: t.endTime || "12:00",
                    sessionType: t.sessionType
                })) : initialFormData.topics,
            });
        } else {
            setFormData({
                ...initialFormData,
                program: programId || ""
            });
        }
        setIsModalOpen(true);
    };

    const handleDeleteClick = (roadmap: EnhancedRoadmap) => {
        setRoadmapToDelete(roadmap);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roadmapToDelete) return;

        setIsDeleting(true);
        try {
            await deleteRoadmap(roadmapToDelete._id);
            toast.success(`Week ${roadmapToDelete.weekNumber} roadmap deleted.`);
            setDeleteConfirmOpen(false);
            setRoadmapToDelete(null);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Failed to delete roadmap.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTopicChange = (index: number, field: string, value: string) => {
        const newTopics = [...formData.topics];
        newTopics[index] = { ...newTopics[index], [field]: value };
        setFormData({ ...formData, topics: newTopics });
    };

    const addTopicField = () => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const nextDay = days[formData.topics.length] || `Day ${formData.topics.length + 1}`;
        setFormData({ ...formData, topics: [...formData.topics, { day: nextDay, title: "", startTime: "09:00", endTime: "12:00", sessionType: "in-person" }] });
    };

    const removeTopicField = (index: number) => {
        const newTopics = formData.topics.filter((_, i) => i !== index);
        setFormData({ ...formData, topics: newTopics });
    };

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

    const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newTopics = [...formData.topics];
        newTopics[index] = { ...newTopics[index], [field]: value };
        setFormData({ ...formData, topics: newTopics });
    };

    const handleSubmit = async (e: React.FormEvent, action: 'save' | 'submit' = 'save') => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                weekNumber: parseInt(formData.weekNumber),
                action: action === 'submit' ? 'submit_for_approval' : undefined,
                roadmapId: editingRoadmap?._id // Include roadmapId when editing for ownership verification
            };
            await saveRoadmap(submitData);
            const message = action === 'submit'
                ? `Roadmap for Week ${formData.weekNumber} submitted for approval!`
                : `Roadmap for Week ${formData.weekNumber} saved successfully!`;
            toast.success(message);
            setIsModalOpen(false);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitForApproval = async (roadmap: EnhancedRoadmap) => {
        try {
            setIsSubmitting(true);
            const submitData = {
                program: typeof roadmap.program === 'string' ? roadmap.program : roadmap.program._id,
                weekNumber: parseInt(roadmap.weekNumber.toString()),
                title: roadmap.title,
                startDate: new Date(roadmap.startDate).toISOString().split('T')[0],
                objectives: roadmap.objectives.join('\n'),
                topics: roadmap.topics,
                action: 'submit_for_approval'
            };

            await saveRoadmap(submitData);
            toast.success(`Roadmap for Week ${roadmap.weekNumber} submitted for approval!`);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Failed to submit for approval.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSendButtonText = (roadmap: EnhancedRoadmap) => {
        if (sentRoadmaps.has(roadmap._id)) {
            return "Resend to Students";
        }
        return "Send to Students";
    };

    const handleSendToStudents = async (roadmap: EnhancedRoadmap) => {
        setIsSendingToStudents(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSentRoadmaps(prev => new Set(prev).add(roadmap._id));

            const isResend = sentRoadmaps.has(roadmap._id);
            const message = isResend
                ? `Week ${roadmap.weekNumber} roadmap resent to all students in the program!`
                : `Week ${roadmap.weekNumber} roadmap sent to all students in the program!`;
            toast.success(message);
        } catch {
            toast.error("Failed to send roadmap to students.");
        } finally {
            setIsSendingToStudents(false);
        }
    };

    const handleSetCurrentWeek = async (roadmap: EnhancedRoadmap) => {
        try {
            await setCurrentWeek(roadmap._id);
            toast.success(`Week ${roadmap.weekNumber} is now the current week for ${roadmap.program.name}!`);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Failed to set current week.");
        }
    };

    const renderWeekCard = (roadmap: EnhancedRoadmap, isCompleted: boolean = false) => (
        <AccordionItem value={roadmap._id} key={roadmap._id} className={`border rounded-lg mb-2 ${roadmap.isCurrent ? 'border-yellow-400 bg-yellow-50/50' : ''}`}>
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                    {roadmap.isCurrent && (
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Current Week
                        </Badge>
                    )}
                    <span className="font-medium">Week {roadmap.weekNumber}: {roadmap.title}</span>
                    {getStatusBadge(roadmap.status ?? "draft")}
                    {roadmap.status === 'approved' && sentRoadmaps.has(roadmap._id) && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Sent to Students
                        </Badge>
                    )}
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="space-y-2">
                        {roadmap.feedback && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm font-medium text-red-800">Feedback from Program Manager:</p>
                                <p className="text-sm text-red-700">{roadmap.feedback}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {!isCompleted && roadmap.status === 'draft' && (
                            <>
                                <Button size="sm" variant="outline" onClick={() => handleOpenModal(roadmap)}>
                                    <Edit className="mr-2 h-4 w-4"/>Edit
                                </Button>
                                <Button size="sm" variant="default" onClick={() => handleSubmitForApproval(roadmap)} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Submit for Approval
                                </Button>
                            </>
                        )}
                        {!isCompleted && roadmap.status === 'pending_approval' && (
                            <Button size="sm" variant="outline" onClick={() => handleOpenModal(roadmap)}>
                                <Edit className="mr-2 h-4 w-4"/>Edit
                            </Button>
                        )}
                        {!isCompleted && roadmap.status === 'rejected' && (
                            <Button size="sm" variant="outline" onClick={() => handleOpenModal(roadmap)}>
                                <Edit className="mr-2 h-4 w-4"/>Edit & Resubmit
                            </Button>
                        )}
                        {!isCompleted && roadmap.status === 'approved' && (
                            <>
                                {!roadmap.isCurrent && (
                                    <Button size="sm" variant="outline" onClick={() => handleSetCurrentWeek(roadmap)} className="border-yellow-400 text-yellow-600 hover:bg-yellow-50">
                                        <Star className="mr-2 h-4 w-4" />
                                        Set as Current
                                    </Button>
                                )}
                                <Button size="sm" variant="default" onClick={() => handleSendToStudents(roadmap)} disabled={isSendingToStudents}>
                                    {isSendingToStudents ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                    {getSendButtonText(roadmap)}
                                </Button>
                            </>
                        )}
                        {!isCompleted && (roadmap.status === 'draft' || roadmap.status === 'pending_approval' || roadmap.status === 'rejected') && (
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(roadmap)}>
                                <Trash2 className="mr-2 h-4 w-4"/>Delete
                            </Button>
                        )}
                    </div>
                </div>

                {roadmap.objectives && roadmap.objectives.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Objectives</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {roadmap.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </div>
                )}

                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Daily Topics</h4>
                    {(roadmap.topics || []).map(topic => (
                        <div key={topic._id} className="p-3 border rounded-md bg-muted/50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{topic.day}: {topic.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {topic.startTime && topic.endTime ? (
                                            <span>
                                                {formatTimeDisplay(topic.startTime)} - {formatTimeDisplay(topic.endTime)}
                                                <span className="ml-2">
                                                    ({calculateDuration(topic.startTime, topic.endTime)})
                                                </span>
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

    const renderProgramCard = (programData: ProgramWithRoadmaps, isCompleted: boolean = false) => (
        <Card key={programData.program._id} className="mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{programData.program.name}</CardTitle>
                        <Badge variant={isCompleted ? "secondary" : "default"}>
                            {programData.roadmaps.length} week{programData.roadmaps.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                    {!isCompleted && (
                        <Button size="sm" onClick={() => handleOpenModal(null, programData.program._id)}>
                            <Plus className="mr-2 h-4 w-4" />Add Week
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {programData.roadmaps.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">No roadmaps yet. Click "Add Week" to create one.</p>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {programData.roadmaps.map(roadmap => renderWeekCard(roadmap, isCompleted))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );

    const renderEmptyProgramCard = (program: BackendProgram) => (
        <Card key={program._id} className="mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg text-muted-foreground">{program.name}</CardTitle>
                        <Badge variant="outline">No roadmaps</Badge>
                    </div>
                    <Button size="sm" onClick={() => handleOpenModal(null, program._id)}>
                        <Plus className="mr-2 h-4 w-4" />Add Week
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-center py-6 text-muted-foreground">No roadmaps created for this program yet.</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Roadmaps</h1>
                    <p className="text-muted-foreground">Plan and manage weekly learning schedules for your programs.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Programs ({activeProgramsWithRoadmaps.length + activeProgramsWithoutRoadmaps.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed Programs ({completedProgramsWithRoadmaps.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    {loading ? (
                        <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
                    ) : activeProgramsWithRoadmaps.length === 0 && activeProgramsWithoutRoadmaps.length === 0 ? (
                        <Card>
                            <CardContent className="py-10">
                                <p className="text-center text-muted-foreground">No active programs found. You need to be assigned to a program to create roadmaps.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div>
                            {activeProgramsWithRoadmaps.map(programData => renderProgramCard(programData, false))}
                            {activeProgramsWithoutRoadmaps.map(program => renderEmptyProgramCard(program))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                    {loading ? (
                        <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
                    ) : completedProgramsWithRoadmaps.length === 0 ? (
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingRoadmap ? 'Edit' : 'Plan'} Week</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Program</Label>
                                <Select value={formData.program} onValueChange={(v) => setFormData(f => ({...f, program: v}))} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an active program"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myPrograms
                                            .filter(p => p.status === 'Active')
                                            .map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Week #</Label>
                                <Input type="number" value={formData.weekNumber} onChange={(e) => setFormData(f => ({...f, weekNumber: e.target.value}))} required/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Week Title</Label>
                                <Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/>
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(f => ({...f, startDate: e.target.value}))} required/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Objectives (one per line)</Label>
                            <Textarea placeholder="Enter objectives, one per line..." value={formData.objectives} onChange={(e) => setFormData(f => ({...f, objectives: e.target.value}))} />
                        </div>

                        <div className="space-y-3 pt-3 border-t">
                            <Label>Daily Topics</Label>

                            <div className="hidden md:grid grid-cols-12 gap-2 items-center text-sm font-medium text-muted-foreground pb-2 border-b">
                                <div className="col-span-2">Day</div>
                                <div className="col-span-4">Topic Title</div>
                                <div className="col-span-2">Start</div>
                                <div className="col-span-2">End</div>
                                <div className="col-span-2">Type</div>
                            </div>

                            {formData.topics.map((topic, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <Input
                                        value={topic.day}
                                        onChange={(e) => handleTopicChange(index, 'day', e.target.value)}
                                        className="col-span-2"
                                        placeholder="Day"
                                    />
                                    <Input
                                        placeholder="Topic Title"
                                        value={topic.title}
                                        onChange={(e) => handleTopicChange(index, 'title', e.target.value)}
                                        className="col-span-4"
                                    />
                                    <Input
                                        type="time"
                                        value={topic.startTime}
                                        onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                        className="col-span-2"
                                    />
                                    <Input
                                        type="time"
                                        value={topic.endTime}
                                        onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                        className="col-span-2"
                                    />
                                    <div className="col-span-2 flex gap-1 items-center">
                                        <Select
                                            value={topic.sessionType}
                                            onValueChange={(v) => handleTopicChange(index, 'sessionType', v)}
                                        >
                                            <SelectTrigger className="text-xs h-9">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="in-person">In-Person</SelectItem>
                                                <SelectItem value="online">Online</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 h-8 w-8"
                                            onClick={() => removeTopicField(index)}
                                        >
                                            <Trash2 className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addTopicField}>Add Day</Button>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save as Draft
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                disabled={isSubmitting}
                                onClick={(e) => handleSubmit(e, 'submit')}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                <Send className="mr-2 h-4 w-4"/>Submit for Approval
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
                if (!isDeleting) {
                    setDeleteConfirmOpen(open);
                    if (!open) setRoadmapToDelete(null);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Roadmap</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete <strong>Week {roadmapToDelete?.weekNumber}: {roadmapToDelete?.title}</strong>?
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This will permanently delete the weekly roadmap and all its topics. This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
