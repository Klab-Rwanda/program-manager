"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getMyRoadmaps, saveRoadmap, deleteRoadmap } from "@/lib/services/roadmap.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Roadmap, Program, Topic } from "@/types";

const initialFormData = { program: "", weekNumber: "", title: "", startDate: "", objectives: "", topics: [{ day: "Monday", title: "", duration: "3 hours", sessionType: "in-person" }] };

export default function FacilitatorRoadmapPage() {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRoadmap, setEditingRoadmap] = useState<Roadmap | null>(null);
    const [formData, setFormData] = useState<any>(initialFormData);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [roadmapsData, programsData] = await Promise.all([getMyRoadmaps(), getAllPrograms()]);
            setRoadmaps(roadmapsData);
            setMyPrograms(programsData);
        } catch (err) { toast.error("Failed to load data.");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (roadmap: Roadmap | null = null) => {
        setEditingRoadmap(roadmap);
        if (roadmap) {
            setFormData({
                program: typeof roadmap.program === 'string' ? roadmap.program : roadmap.program._id,
                weekNumber: roadmap.weekNumber,
                title: roadmap.title,
                startDate: new Date(roadmap.startDate).toISOString().split('T')[0],
                objectives: roadmap.objectives.join('\n'),
                topics: roadmap.topics.length > 0 ? roadmap.topics : initialFormData.topics,
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleDelete = (roadmapId: string) => {
        toast("Are you sure?", {
            description: "This will permanently delete the weekly roadmap and all its topics.",
            action: { label: "Delete", onClick: async () => {
                try {
                    await deleteRoadmap(roadmapId);
                    toast.success("Roadmap deleted.");
                    fetchData();
                } catch { toast.error("Failed to delete roadmap."); }
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
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const nextDay = days[formData.topics.length] || `Day ${formData.topics.length + 1}`;
        setFormData({ ...formData, topics: [...formData.topics, { day: nextDay, title: "", duration: "3 hours", sessionType: "in-person" }] });
    };
    
    const removeTopicField = (index: number) => {
        const newTopics = formData.topics.filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, topics: newTopics });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await saveRoadmap(formData);
            toast.success(`Roadmap for Week ${formData.weekNumber} saved successfully!`);
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-bold">Weekly Roadmap</h1><p className="text-muted-foreground">Plan and manage weekly learning schedules.</p></div>
                <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4"/>Plan New Week</Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>My Planned Weeks</CardTitle></CardHeader>
                <CardContent>
                    {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div> :
                    roadmaps.length === 0 ? <p className="text-center py-10 text-muted-foreground">You haven't planned any weeks yet.</p> :
                    <Accordion type="single" collapsible className="w-full">
                        {roadmaps.map(roadmap => (
                            <AccordionItem value={roadmap._id} key={roadmap._id}>
                                <AccordionTrigger className="text-lg p-4 hover:no-underline">
                                    Week {roadmap.weekNumber}: {roadmap.title} ({(roadmap.program as any)?.name})
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 space-y-4">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenModal(roadmap)}><Edit className="mr-2 h-4 w-4"/>Edit Week</Button>
                                        <Button size="sm" variant="destructive-outline" onClick={() => handleDelete(roadmap._id)}><Trash2 className="mr-2 h-4 w-4"/>Delete Week</Button>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Daily Topics</h4>
                                        {roadmap.topics.map(topic => (
                                            <div key={topic._id} className="p-3 border rounded-md bg-gray-50">{topic.day}: {topic.title} ({topic.sessionType})</div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    }
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingRoadmap ? 'Edit' : 'Plan'} Week</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {/* Form content remains largely the same, but is now used for both create and edit */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2"><Label>Program</Label><Select value={formData.program} onValueChange={(v) => setFormData(f => ({...f, program: v}))} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{myPrograms.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Week #</Label><Input type="number" value={formData.weekNumber} onChange={(e) => setFormData(f => ({...f, weekNumber: e.target.value}))} required/></div>
                        </div>
                        <div className="space-y-2"><Label>Week Title</Label><Input value={formData.title} onChange={(e) => setFormData(f => ({...f, title: e.target.value}))} required/></div>
                        <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData(f => ({...f, startDate: e.target.value}))} required/></div>
                        <div className="space-y-2"><Label>Objectives</Label><Textarea placeholder="One per line..." value={formData.objectives} onChange={(e) => setFormData(f => ({...f, objectives: e.target.value}))} /></div>
                        
                        <div className="space-y-3 pt-3 border-t">
                            <Label>Daily Topics</Label>
                            {formData.topics.map((topic: any, index: number) => (
                                <div key={index} className="grid grid-cols-7 gap-2 items-center">
                                    <Input value={topic.day} onChange={(e) => handleTopicChange(index, 'day', e.target.value)} className="col-span-1"/>
                                    <Input placeholder="Topic Title" value={topic.title} onChange={(e) => handleTopicChange(index, 'title', e.target.value)} className="col-span-3"/>
                                    <Input placeholder="Duration" value={topic.duration} onChange={(e) => handleTopicChange(index, 'duration', e.target.value)} className="col-span-1"/>
                                    <Select value={topic.sessionType} onValueChange={(v) => handleTopicChange(index, 'sessionType', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="in-person">In-Person</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent></Select>
                                    <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeTopicField(index)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addTopicField}>Add Day</Button>
                        </div>

                        <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Roadmap</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}