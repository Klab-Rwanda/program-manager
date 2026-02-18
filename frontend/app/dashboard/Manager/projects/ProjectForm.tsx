"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2, ArrowLeft, Building2, UserPlus, Search, Upload,
    X, FileText, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    createProject,
    updateProject,
    getProjectById,
    removeProjectFile
} from "@/lib/services/project.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Project, Program, Trainee } from "@/types";

interface ProjectFormProps {
    projectId?: string; // If provided, we're editing
}

export default function ProjectForm({ projectId }: ProjectFormProps) {
    const router = useRouter();
    const isEditing = !!projectId;

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [existingProject, setExistingProject] = useState<Project | null>(null);
    const [traineeSearch, setTraineeSearch] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        program: "",
        assignedTrainees: [] as string[],
        teamLead: "",
        companyName: "",
        companyAddress: "",
        companyContactPerson: "",
        companyContactPhone: "",
        startDate: "",
        dueDate: "",
        status: "active" as string
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const programsData = await getAllPrograms();
            const activePrograms = programsData.filter(p => p.status === 'Active');
            setPrograms(activePrograms);

            if (projectId) {
                const project = await getProjectById(projectId);
                setExistingProject(project);
                setFormData({
                    title: project.title,
                    description: project.description || "",
                    program: project.program._id,
                    assignedTrainees: project.assignedTrainees.map(t => t._id),
                    teamLead: project.teamLead?._id || "",
                    companyName: project.companyName || "",
                    companyAddress: project.companyAddress || "",
                    companyContactPerson: project.companyContactPerson || "",
                    companyContactPhone: project.companyContactPhone || "",
                    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
                    dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : "",
                    status: project.status
                });
            } else if (activePrograms.length === 1) {
                setFormData(f => ({ ...f, program: activePrograms[0]._id }));
            }
        } catch (err) {
            toast.error("Failed to load data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Get trainees for selected program
    const selectedProgramTrainees: Trainee[] = useMemo(() => {
        const prog = programs.find(p => p._id === formData.program);
        return (prog?.trainees || []) as Trainee[];
    }, [programs, formData.program]);

    // Filter trainees by search
    const filteredTrainees = useMemo(() => {
        if (!traineeSearch.trim()) return selectedProgramTrainees;
        const query = traineeSearch.toLowerCase();
        return selectedProgramTrainees.filter(t =>
            t.name?.toLowerCase().includes(query) ||
            t.email?.toLowerCase().includes(query)
        );
    }, [selectedProgramTrainees, traineeSearch]);

    const toggleTrainee = (traineeId: string) => {
        setFormData(prev => {
            const newTrainees = prev.assignedTrainees.includes(traineeId)
                ? prev.assignedTrainees.filter(id => id !== traineeId)
                : [...prev.assignedTrainees, traineeId];
            return {
                ...prev,
                assignedTrainees: newTrainees,
                teamLead: newTrainees.includes(prev.teamLead) ? prev.teamLead : ""
            };
        });
    };

    const selectAllFiltered = () => {
        const filteredIds = filteredTrainees.map(t => t._id);
        setFormData(prev => ({
            ...prev,
            assignedTrainees: Array.from(new Set([...prev.assignedTrainees, ...filteredIds]))
        }));
    };

    const deselectAllFiltered = () => {
        const filteredIds = new Set(filteredTrainees.map(t => t._id));
        setFormData(prev => ({
            ...prev,
            assignedTrainees: prev.assignedTrainees.filter(id => !filteredIds.has(id))
        }));
    };

    const handleRemoveFile = async (fileIndex: number) => {
        if (!existingProject) return;
        try {
            await removeProjectFile(existingProject._id, fileIndex);
            toast.success("File removed.");
            // Refresh project data
            const updated = await getProjectById(existingProject._id);
            setExistingProject(updated);
        } catch {
            toast.error("Failed to remove file.");
        }
    };

    // Determine the correct back URL based on current path
    const getBackUrl = () => {
        const path = window.location.pathname;
        if (path.includes('/Facilitator/')) return '/dashboard/Facilitator/projects';
        return '/dashboard/Manager/projects';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.program) {
            toast.error("Title and program are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('description', formData.description);
            fd.append('program', formData.program);
            fd.append('companyName', formData.companyName);
            fd.append('companyAddress', formData.companyAddress);
            fd.append('companyContactPerson', formData.companyContactPerson);
            fd.append('companyContactPhone', formData.companyContactPhone);
            if (formData.startDate) fd.append('startDate', formData.startDate);
            if (formData.dueDate) fd.append('dueDate', formData.dueDate);
            if (isEditing) fd.append('status', formData.status);

            if (formData.teamLead) fd.append('teamLead', formData.teamLead);

            formData.assignedTrainees.forEach(id => fd.append('assignedTrainees', id));
            selectedFiles.forEach(file => fd.append('files', file));

            if (isEditing && projectId) {
                await updateProject(projectId, fd);
                toast.success("Project updated successfully!");
            } else {
                await createProject(fd);
                toast.success("Project created successfully!");
            }
            router.push(getBackUrl());
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save project.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => router.push(getBackUrl())}>
                    <ArrowLeft className="mr-1 h-4 w-4" />Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditing ? 'Edit Project' : 'Create New Project'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isEditing ? 'Update project details and reassign trainees' : 'Set up a new project and assign trainees'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Project Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                                required
                                placeholder="e.g., E-commerce Platform"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                                placeholder="Project description..."
                                rows={4}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Program *</Label>
                                <Select
                                    value={formData.program}
                                    onValueChange={(v) => setFormData(f => ({ ...f, program: v, assignedTrainees: [], teamLead: "" }))}
                                    required
                                >
                                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => (
                                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isEditing && (
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="on_hold">On Hold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(f => ({ ...f, startDate: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData(f => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Company Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5" />Company Information
                        </CardTitle>
                        <CardDescription>Details about the company that owns this project</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input
                                    value={formData.companyName}
                                    onChange={(e) => setFormData(f => ({ ...f, companyName: e.target.value }))}
                                    placeholder="Company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Person</Label>
                                <Input
                                    value={formData.companyContactPerson}
                                    onChange={(e) => setFormData(f => ({ ...f, companyContactPerson: e.target.value }))}
                                    placeholder="Contact person name"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Address</Label>
                                <Input
                                    value={formData.companyAddress}
                                    onChange={(e) => setFormData(f => ({ ...f, companyAddress: e.target.value }))}
                                    placeholder="Company address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Phone</Label>
                                <Input
                                    value={formData.companyContactPhone}
                                    onChange={(e) => setFormData(f => ({ ...f, companyContactPhone: e.target.value }))}
                                    placeholder="e.g., +250 788 000 000"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* File Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Upload className="h-5 w-5" />Description Files
                        </CardTitle>
                        <CardDescription>Upload any relevant project documents (optional)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input
                            type="file"
                            multiple
                            onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                        />
                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file, i) => (
                                    <Badge key={i} variant="outline" className="gap-1">
                                        <FileText className="h-3 w-3" />{file.name}
                                        <button type="button" onClick={() => setSelectedFiles(files => files.filter((_, idx) => idx !== i))}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {existingProject?.files && existingProject.files.length > 0 && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Existing files:</p>
                                <div className="flex flex-wrap gap-2">
                                    {existingProject.files.map((file, i) => (
                                        <Badge key={i} variant="secondary" className="gap-1">
                                            <FileText className="h-3 w-3" />{file.fileName}
                                            <button type="button" onClick={() => handleRemoveFile(i)}>
                                                <X className="h-3 w-3 text-red-500" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Assign Trainees */}
                {formData.program && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <UserPlus className="h-5 w-5" />Assign Trainees
                                    </CardTitle>
                                    <CardDescription>
                                        {formData.assignedTrainees.length} of {selectedProgramTrainees.length} trainees selected
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
                                        Select All
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={deselectAllFiltered}>
                                        Deselect All
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {selectedProgramTrainees.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">No trainees enrolled in this program.</p>
                            ) : (
                                <>
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search trainees by name or email..."
                                            value={traineeSearch}
                                            onChange={(e) => setTraineeSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    {/* Selected summary */}
                                    {formData.assignedTrainees.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.assignedTrainees.map(id => {
                                                const trainee = selectedProgramTrainees.find(t => t._id === id);
                                                if (!trainee) return null;
                                                return (
                                                    <Badge key={id} variant="default" className="gap-1 text-xs">
                                                        {trainee.name}
                                                        <button type="button" onClick={() => toggleTrainee(id)}>
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Trainee list */}
                                    <div className="border rounded-md max-h-80 overflow-y-auto divide-y">
                                        {filteredTrainees.length === 0 ? (
                                            <p className="text-sm text-muted-foreground py-4 text-center">No trainees match your search.</p>
                                        ) : (
                                            filteredTrainees.map(trainee => {
                                                const isSelected = formData.assignedTrainees.includes(trainee._id);
                                                return (
                                                    <label
                                                        key={trainee._id}
                                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleTrainee(trainee._id)}
                                                            className="rounded h-4 w-4"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{trainee.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{trainee.email}</p>
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                                        )}
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Showing {filteredTrainees.length} of {selectedProgramTrainees.length} trainees
                                    </p>

                                    {/* Team Lead Selection */}
                                    {formData.assignedTrainees.length > 0 && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <Label>Team Lead (optional)</Label>
                                            <Select
                                                value={formData.teamLead || "none"}
                                                onValueChange={(v) => setFormData(f => ({ ...f, teamLead: v === "none" ? "" : v }))}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Select team lead" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No team lead</SelectItem>
                                                    {formData.assignedTrainees.map(id => {
                                                        const trainee = selectedProgramTrainees.find(t => t._id === id);
                                                        if (!trainee) return null;
                                                        return (
                                                            <SelectItem key={id} value={id}>{trainee.name}</SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Team lead can create and manage tasks for this project.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-8">
                    <Button variant="outline" type="button" onClick={() => router.push(getBackUrl())}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Update' : 'Create'} Project
                    </Button>
                </div>
            </form>
        </div>
    );
}
