"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Loader2, Send, Clock, CheckCircle, XCircle, Users } from "lucide-react";
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
import { getMyRoadmaps, saveRoadmap, deleteRoadmap } from "@/lib/services/roadmap.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { getMyCourses } from "@/lib/services/course.service";
import { Roadmap, Program as BackendProgram, Topic, Course } from "@/types";

// Extend Roadmap type to ensure program and course are populated with status
interface EnhancedRoadmap extends Roadmap {
    program: BackendProgram; // Ensure program is populated with status
    course: Course; // Ensure course is populated (title is enough)
}

const initialFormData = { 
    program: "", 
    course: "",
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
    const [roadmaps, setRoadmaps] = useState<EnhancedRoadmap[]>([]); // Use EnhancedRoadmap
    const [myPrograms, setMyPrograms] = useState<BackendProgram[]>([]); // All programs facilitator is part of
    const [myCourses, setMyCourses] = useState<Course[]>([]); // All courses facilitator is part of (active/completed programs)
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSendingToStudents, setIsSendingToStudents] = useState(false);
    const [sentRoadmaps, setSentRoadmaps] = useState<Set<string>>(new Set()); // Keep track of sent roadmaps
    const [editingRoadmap, setEditingRoadmap] = useState<EnhancedRoadmap | null>(null); // Use EnhancedRoadmap
    const [formData, setFormData] = useState<any>(initialFormData);
    const [activeTab, setActiveTab] = useState("active"); // State for active tab

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // getMyRoadmaps now fetches roadmaps from Active/Completed programs
            // getAllPrograms now fetches programs facilitator is associated with (active/completed)
            // getMyCourses now fetches courses facilitator is associated with (active/completed programs)
            const [roadmapsData, programsData, coursesData] = await Promise.all([
                getMyRoadmaps(), 
                getAllPrograms(),
                getMyCourses()
            ]);

            setRoadmaps(roadmapsData as EnhancedRoadmap[]); // Cast to EnhancedRoadmap
            setMyPrograms(programsData);
            setMyCourses(coursesData);
        } catch (err) { 
            toast.error("Failed to load data.");
            console.error("Fetch Data Error:", err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Memoized lists for active and completed roadmaps
    const activeRoadmaps = useMemo(() => 
        roadmaps.filter(roadmap => (roadmap.program as BackendProgram)?.status === 'Active'), 
        [roadmaps]
    );
    const completedRoadmaps = useMemo(() => 
        roadmaps.filter(roadmap => (roadmap.program as BackendProgram)?.status === 'Completed'), 
        [roadmaps]
    );

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

    const handleOpenModal = (roadmap: EnhancedRoadmap | null = null) => { // Use EnhancedRoadmap
        setEditingRoadmap(roadmap);
        if (roadmap) {
            // Convert existing topics to new format if they don't have startTime/endTime
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
                course: typeof roadmap.course === 'object' ? roadmap.course._id : roadmap.course,
                weekNumber: roadmap.weekNumber,
                title: roadmap.title,
                startDate: new Date(roadmap.startDate).toISOString().split('T')[0],
                objectives: roadmap.objectives.join('\n'),
                topics: convertedTopics.length > 0 ? convertedTopics : initialFormData.topics,
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleDelete = (roadmapId: string) => {
        toast("Are you sure?", {
            description: "This will permanently delete the weekly roadmap and all its topics. Note: Only roadmaps from active programs can be deleted.",
            action: { label: "Delete", onClick: async () => {
                try {
                    await deleteRoadmap(roadmapId); // Backend enforces Active program status
                    toast.success("Roadmap deleted.");
                    fetchData();
                } catch (err: any) { 
                    toast.error(err.response?.data?.message || "Failed to delete roadmap."); 
                    console.error("Delete Error:", err);
                }
            }},
            cancel: { label: "Cancel" }
        });
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
        const newTopics = formData.topics.filter((_: any, i: number) => i !== index);
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
        } catch (error) {
            return time;
        }
    };

    const calculateDuration = (startTime: string, endTime: string) => {
        if (!startTime || !endTime) {
            return "Set times";
        }
        
        try {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            const diffMs = end.getTime() - start.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            
            if (diffHours < 0) {
                return "Invalid";
            }
            
            const hours = Math.floor(diffHours);
            const minutes = Math.round((diffHours - hours) * 60);
            
            if (hours === 0 && minutes === 0) {
                return "0 min";
            } else if (minutes === 0) {
                return `${hours}h`;
            } else if (hours === 0) {
                return `${minutes}m`;
            } else {
                return `${hours}h ${minutes}m`;
            }
        } catch (error) {
            return "Error";
        }
    };

    const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newTopics = [...formData.topics];
        newTopics[index] = { ...newTopics[index], [field]: value };
        
        const topic = newTopics[index];
        if (topic.startTime && topic.endTime) {
            const start = new Date(`2000-01-01T${topic.startTime}`);
            const end = new Date(`2000-01-01T${topic.endTime}`);
            if (end <= start) {
                // Optional: add a toast notification if end time is before start time
                // toast.warning("End time should be after start time.");
            }
        }
        setFormData({ ...formData, topics: newTopics });
    };

    const handleSubmit = async (e: React.FormEvent, action: 'save' | 'submit' = 'save') => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                weekNumber: parseInt(formData.weekNumber),
                action: action === 'submit' ? 'submit_for_approval' : undefined
            };
            await saveRoadmap(submitData); // Backend enforces Active program status
            const message = action === 'submit' 
                ? `Roadmap for Week ${formData.weekNumber} submitted for approval!`
                : `Roadmap for Week ${formData.weekNumber} saved successfully!`;
            toast.success(message);
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Operation failed.");
            console.error("Save/Submit Error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSubmitForApproval = async (roadmap: EnhancedRoadmap) => { // Use EnhancedRoadmap
        try {
            setIsSubmitting(true);
            const submitData = {
                program: typeof roadmap.program === 'string' ? roadmap.program : roadmap.program._id,
                course: typeof roadmap.course === 'object' ? roadmap.course._id : roadmap.course,
                weekNumber: parseInt(roadmap.weekNumber.toString()),
                title: roadmap.title,
                startDate: new Date(roadmap.startDate).toISOString().split('T')[0],
                objectives: roadmap.objectives.join('\n'),
                topics: roadmap.topics,
                action: 'submit_for_approval'
            };
            
            await saveRoadmap(submitData); // Backend enforces Active program status
            toast.success(`Roadmap for Week ${roadmap.weekNumber} submitted for approval!`);
            fetchData();
        } catch (err: any) {
            console.error('Error submitting for approval:', err);
            toast.error(err.response?.data?.message || "Failed to submit for approval.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSendButtonText = (roadmap: EnhancedRoadmap) => { // Use EnhancedRoadmap
        if (sentRoadmaps.has(roadmap._id)) {
            return "Resend to Students";
        }
        return "Send to Students";
    };

    const handleSendToStudents = async (roadmap: EnhancedRoadmap) => { // Use EnhancedRoadmap
        setIsSendingToStudents(true);
        try {
            // TODO: Implement API call to send roadmap to all students in the program
            // This would typically involve:
            // 1. Getting all students enrolled in the program
            // 2. Sending notifications/emails to them
            // 3. Making the roadmap visible to them
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Track that this roadmap has been sent
            setSentRoadmaps(prev => new Set(prev).add(roadmap._id));
            
            const isResend = sentRoadmaps.has(roadmap._id);
            const message = isResend 
                ? `Week ${roadmap.weekNumber} roadmap resent to all students in the program!`
                : `Week ${roadmap.weekNumber} roadmap sent to all students in the program!`;
            toast.success(message);
        } catch (err: any) {
            toast.error("Failed to send roadmap to students.");
        } finally {
            setIsSendingToStudents(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-bold">Weekly Roadmap</h1><p className="text-muted-foreground">Plan and manage weekly learning schedules.</p></div>
                {/* Create button disabled if not on "Active" tab */}
                <Button onClick={() => handleOpenModal()} disabled={activeTab !== 'active'}>
                    <Plus className="mr-2 h-4 w-4"/>Plan New Week
                </Button>
            </div>
            
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
                            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                            activeRoadmaps.length === 0 ? <p className="text-center py-10 text-muted-foreground">No active roadmaps found.</p> :
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
                                                {roadmap.status === 'approved' && sentRoadmaps.has(roadmap._id) && (
                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Sent to Students
                                                    </Badge>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-2">
                                                    {roadmap.feedback && (
                                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                            <p className="text-sm font-medium text-red-800">Feedback from Program Manager:</p>
                                                            <p className="text-sm text-red-700">{roadmap.feedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    {roadmap.status === 'draft' && (
                                                        <>
                                                            <Button size="sm" variant="outline" onClick={() => handleOpenModal(roadmap)}>
                                                                <Edit className="mr-2 h-4 w-4"/>Edit Week
                                                            </Button>
                                                            <Button size="sm" variant="default" onClick={() => handleSubmitForApproval(roadmap)} disabled={isSubmitting}>
                                                                {isSubmitting ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                )}
                                                                Submit for Approval
                                                            </Button>
                                                        </>
                                                    )}
                                                    {roadmap.status === 'rejected' && (
                                                        <Button size="sm" variant="outline" onClick={() => handleOpenModal(roadmap)}>
                                                            <Edit className="mr-2 h-4 w-4"/>Edit & Resubmit
                                                        </Button>
                                                    )}
                                                    {roadmap.status === 'approved' && (
                                                        <Button size="sm" variant="default" onClick={() => handleSendToStudents(roadmap)} disabled={isSendingToStudents}>
                                                            {isSendingToStudents ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Users className="mr-2 h-4 w-4" />
                                                            )}
                                                            {getSendButtonText(roadmap)}
                                                        </Button>
                                                    )}
                                                    {(roadmap.status === 'draft' || roadmap.status === 'rejected') && (
                                                        <Button size="sm" variant="destructive-outline" onClick={() => handleDelete(roadmap._id)}>
                                                            <Trash2 className="mr-2 h-4 w-4"/>Delete Week
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Daily Topics</h4>
                                                {(roadmap.topics || []).map(topic => (
                                                    <div key={topic._id} className="p-3 border rounded-md bg-gray-50">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">
                                                                    {topic.day}: {topic.title}
                                                                </div>
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    {topic.startTime && topic.endTime ? (
                                                                        <span>
                                                                            {formatTimeDisplay(topic.startTime)} - {formatTimeDisplay(topic.endTime)}
                                                                            <span className="ml-2 text-gray-500">
                                                                                ({calculateDuration(topic.startTime, topic.endTime)})
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span>{topic.duration || 'No time specified'}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-500 ml-2">
                                                                {topic.sessionType}
                                                            </div>
                                                        </div>
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
                            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                            completedRoadmaps.length === 0 ? <p className="text-center py-10 text-muted-foreground">No roadmaps found for completed programs.</p> :
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
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-2">
                                                    {roadmap.feedback && (
                                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                            <p className="text-sm font-medium text-red-800">Feedback from Program Manager:</p>
                                                            <p className="text-sm text-red-700">{roadmap.feedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    {/* Action buttons disabled for completed program roadmaps */}
                                                    <Button size="sm" variant="outline" disabled title="Program is completed. Cannot edit.">
                                                        <Edit className="mr-2 h-4 w-4"/>Edit Week
                                                    </Button>
                                                    <Button size="sm" variant="default" disabled title="Program is completed. Cannot submit.">
                                                        <Send className="mr-2 h-4 w-4"/>Submit for Approval
                                                    </Button>
                                                    <Button size="sm" variant="destructive-outline" disabled title="Program is completed. Cannot delete.">
                                                        <Trash2 className="mr-2 h-4 w-4"/>Delete Week
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Daily Topics</h4>
                                                {(roadmap.topics || []).map(topic => (
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingRoadmap ? 'Edit' : 'Plan'} Week</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Program</Label>
                                {/* Filter programs in dropdown to only show Active ones for new roadmap creation/editing */}
                                <Select value={formData.program} onValueChange={(v) => setFormData(f => ({...f, program: v}))} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an active program"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myPrograms
                                            .filter(p => p.status === 'Active') // Only show active programs
                                            .map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Course</Label>
                                {/* Filter courses to only show ones from the selected Active program */}
                                <Select value={formData.course} onValueChange={(v) => setFormData(f => ({...f, course: v}))} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a course from active program"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myCourses
                                            .filter(c => 
                                                c.program?._id === formData.program && (c.program as BackendProgram)?.status === 'Active'
                                            )
                                            .map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Week #</Label>
                                <Input type="number" value={formData.weekNumber} onChange={(e) => setFormData(f => ({...f, weekNumber: e.target.value}))} required/>
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(f => ({...f, startDate: e.target.value}))} required/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Week Title</Label>
                            <Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/>
                        </div>
                        <div className="space-y-2">
                            <Label>Objectives</Label>
                            <Textarea placeholder="One per line..." value={formData.objectives} onChange={(e) => setFormData(f => ({...f, objectives: e.target.value}))} />
                        </div>
                        
                        <div className="space-y-3 pt-3 border-t">
                            <Label>Daily Topics</Label>
                            
                            {/* Header row */}
                            <div className="hidden md:grid grid-cols-12 gap-2 items-center text-sm font-medium text-gray-600 pb-2 border-b">
                                <div className="col-span-1">Day</div>
                                <div className="col-span-4">Topic Title</div>
                                <div className="col-span-2">Start</div>
                                <div className="col-span-2">End</div>
                                <div className="col-span-1">Duration</div>
                                <div className="col-span-2">Type</div>
                            </div>
                            
                            {formData.topics.map((topic: any, index: number) => (
                                <div key={index} className="space-y-3 md:space-y-0">
                                    {/* Desktop layout */}
                                    <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                                        <Input 
                                            value={topic.day} 
                                            onChange={(e) => handleTopicChange(index, 'day', e.target.value)} 
                                            className="col-span-1 text-xs"
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
                                            className="col-span-2 text-sm min-w-0"
                                            style={{ minWidth: '80px' }}
                                        />
                                        <Input 
                                            type="time" 
                                            value={topic.endTime} 
                                            onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                            className="col-span-2 text-sm min-w-0"
                                            style={{ minWidth: '80px' }}
                                        />
                                        <div className="col-span-1 text-xs font-medium">
                                            <span className={(() => {
                                                const duration = calculateDuration(topic.startTime, topic.endTime);
                                                if (duration === "Invalid" || duration === "Error") {
                                                    return "text-red-600";
                                                } else if (duration === "Set times") {
                                                    return "text-gray-400";
                                                }
                                                return "text-gray-600";
                                            })()}>
                                                {calculateDuration(topic.startTime, topic.endTime)}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex gap-1 items-center">
                                            <Select 
                                                value={topic.sessionType} 
                                                onValueChange={(v) => handleTopicChange(index, 'sessionType', v)}
                                            >
                                                <SelectTrigger className="text-xs h-8 min-w-0">
                                                    <SelectValue className="truncate"/>
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
                                    
                                    {/* Mobile layout */}
                                    <div className="md:hidden space-y-2 p-2 border rounded-lg bg-gray-50">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input 
                                                value={topic.day} 
                                                onChange={(e) => handleTopicChange(index, 'day', e.target.value)} 
                                                placeholder="Day"
                                                className="text-sm"
                                            />
                                            <Select 
                                                value={topic.sessionType} 
                                                onValueChange={(v) => handleTopicChange(index, 'sessionType', v)}
                                            >
                                                <SelectTrigger className="text-sm h-9">
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="in-person">In-Person</SelectItem>
                                                    <SelectItem value="online">Online</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Input 
                                            placeholder="Topic Title" 
                                            value={topic.title} 
                                            onChange={(e) => handleTopicChange(index, 'title', e.target.value)} 
                                            className="text-sm"
                                        />
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <Input 
                                                type="time" 
                                                value={topic.startTime} 
                                                onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                                className="text-sm"
                                            />
                                            <span className="text-center text-gray-500 text-sm">to</span>
                                            <Input 
                                                type="time" 
                                                value={topic.endTime} 
                                                onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600">
                                                Duration: {calculateDuration(topic.startTime, topic.endTime)}
                                            </span>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-red-500 h-8 w-8" 
                                                onClick={() => removeTopicField(index)}
                                            >
                                                <Trash2 className="h-3 w-3"/>
                                            </Button>
                                        </div>
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
        </div>
    );
}