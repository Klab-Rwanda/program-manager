"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Eye, Clock, CheckCircle, XCircle, FileText, Loader2, UserPlus, Check, X, AlertTriangle, BookOpen, ServerCrash, Plus, Edit, Trash2, Users, Archive } from "lucide-react";

import { useAuth } from "@/lib/contexts/RoleContext";
import { Program, User } from "@/types";
import { getAllPrograms, assignManagerToProgram, createProgram, updateProgram, deleteProgram } from "@/lib/services/program.service";
import { getAllManagers } from "@/lib/services/user.service";
import { archiveProgram } from "@/lib/services/archive.service";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const ProgramApprovalPage: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    
    const [programs, setPrograms] = useState<Program[]>([]);
    const [managers, setManagers] = useState<User[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Create Program Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProgram, setNewProgram] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        programManagerId: "" // Add manager selection during creation
    });

    // Edit Program Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

    // Delete Program Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

    // Manager Assignment Modal States
    const [assignModal, setAssignModal] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });
    const [selectedManagerId, setSelectedManagerId] = useState<string>("");

    const [confirmationDialog, setConfirmationDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });
    
    const [programSearch, setProgramSearch] = useState("");
    const [programFilter, setProgramFilter] = useState("all");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [programsData, managersData] = await Promise.all([
                getAllPrograms(), 
                getAllManagers()
            ]);
            setPrograms(programsData);
            setManagers(managersData);
        } catch (err: any) {
            const message = err.message || "Failed to load management data";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        if (user?.role === 'SuperAdmin') {
            fetchData(); 
        }
    }, [user, fetchData]);

    // Create Program Handler
    const handleCreateProgram = async () => {
        if (!newProgram.name || !newProgram.description || !newProgram.startDate || !newProgram.endDate) {
            toast.error("Please fill in all required fields.");
            return;
        }
        if (new Date(newProgram.startDate) > new Date(newProgram.endDate)) {
            toast.error("Start date cannot be after end date.");
            return;
        }

        setIsProcessing(true);
        try {
            const programData = {
                name: newProgram.name,
                description: newProgram.description,
                startDate: newProgram.startDate,
                endDate: newProgram.endDate
            };

            const createdProgram = await createProgram(programData);
            
            // If a manager was selected, assign them to the program
            if (newProgram.programManagerId && newProgram.programManagerId !== "unassign") {
                await assignManagerToProgram(createdProgram._id, newProgram.programManagerId);
            }

            setNewProgram({ name: "", description: "", startDate: "", endDate: "", programManagerId: "" });
            setShowCreateModal(false);
            toast.success("Program created successfully!");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create program.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Edit Program Handler
    const handleEditProgram = async () => {
        if (!selectedProgram || !newProgram.name || !newProgram.description || !newProgram.startDate || !newProgram.endDate) {
            toast.error("Please fill in all required fields.");
            return;
        }
        if (new Date(newProgram.startDate) > new Date(newProgram.endDate)) {
            toast.error("Start date cannot be after end date.");
            return;
        }

        setIsProcessing(true);
        try {
            const programData = {
                name: newProgram.name,
                description: newProgram.description,
                startDate: newProgram.startDate,
                endDate: newProgram.endDate
            };

            await updateProgram(selectedProgram._id, programData);
            
            // Update manager assignment if changed
            if (newProgram.programManagerId !== (selectedProgram.programManager?._id || "unassign")) {
                await assignManagerToProgram(selectedProgram._id, newProgram.programManagerId === "unassign" ? "" : newProgram.programManagerId);
            }

            setNewProgram({ name: "", description: "", startDate: "", endDate: "", programManagerId: "" });
            setShowEditModal(false);
            setSelectedProgram(null);
            toast.success("Program updated successfully!");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update program.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Delete Program Handler
    const handleDeleteProgram = async () => {
        if (!programToDelete) return;

        setIsProcessing(true);
        try {
            await deleteProgram(programToDelete._id);
            setProgramToDelete(null);
            setShowDeleteModal(false);
            toast.success("Program deleted successfully!");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete program.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAssignManager = async () => {
        if (!assignModal.program) return;
        setIsProcessing(true);
        try {
            await assignManagerToProgram(assignModal.program._id, selectedManagerId);
            toast.success("Program Manager updated successfully!");
            setAssignModal({ open: false, program: null });
            setSelectedManagerId("");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to assign manager.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleArchive = async (program: Program) => {
        setConfirmationDialog({
            open: true,
            title: "Archive Program",
            description: `Are you sure you want to archive "${program.name}"? This action will move it to the archive.`,
            onConfirm: async () => {
                setProcessingId(program._id);
                try {
                    await archiveProgram(program._id);
                    toast.success(`${program.name} has been archived!`);
                    fetchData();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to archive program.");
                } finally {
                    setProcessingId(null);
                }
            }
        });
    };

    const filteredPrograms = programs.filter(p => 
        (p.name.toLowerCase().includes(programSearch.toLowerCase())) && 
        (programFilter === "all" || p.status === programFilter)
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active': 
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="mr-1 h-3 w-3"/>
                        Active
                    </Badge>
                );
            case 'Completed': 
                return (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <CheckCircle className="mr-1 h-3 w-3"/>
                        Completed
                    </Badge>
                );
            case 'Draft': 
                return (
                    <Badge variant="secondary">
                        <FileText className="mr-1 h-3 w-3"/>
                        Draft
                    </Badge>
                );
            default: 
                return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Management Data...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-muted/50 rounded-lg border border-dashed">
                <ServerCrash className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-xl font-semibold text-destructive">Failed to Load Data</h3>
                <p className="text-muted-foreground mt-2 mb-4">{error}</p>
                <Button onClick={fetchData}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Program Management</h1>
                    <p className="text-muted-foreground">Create and manage training programs, assign program managers.</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-[#1f497d] hover:bg-[#1a3f6b]">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Program
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input 
                            placeholder="Search programs..." 
                            value={programSearch} 
                            onChange={(e) => setProgramSearch(e.target.value)} 
                            className="max-w-sm"
                        />
                        <Select value={programFilter} onValueChange={setProgramFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Manager</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPrograms.length > 0 ? (
                                    filteredPrograms.map((program) => (
                                        <TableRow key={program._id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{program.name}</div>
                                                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                        {program.description}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {program.programManager?.name || 'Unassigned'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(program.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div>{new Date(program.startDate).toLocaleDateString()}</div>
                                                <div>to {new Date(program.endDate).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => {
                                                            setSelectedProgram(program);
                                                            setNewProgram({
                                                                name: program.name,
                                                                description: program.description,
                                                                startDate: program.startDate.split('T')[0],
                                                                endDate: program.endDate.split('T')[0],
                                                                programManagerId: program.programManager?._id || "unassign"
                                                            });
                                                            setShowEditModal(true);
                                                        }}
                                                        title="Edit Program"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => {
                                                            setAssignModal({ open: true, program });
                                                            setSelectedManagerId(program.programManager?._id || "unassign");
                                                        }}
                                                        title="Assign Manager"
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => handleArchive(program)}
                                                        disabled={processingId === program._id}
                                                        title="Archive Program"
                                                    >
                                                        {processingId === program._id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Archive className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => {
                                                            setProgramToDelete(program);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        title="Delete Program"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => router.push(`/dashboard/SuperAdmin/program-approval/${program._id}`)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No programs match your filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Create Program Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Program</DialogTitle>
                        <DialogDescription>
                            Create a new training program and optionally assign a program manager.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="program-name">Program Name *</Label>
                            <Input
                                id="program-name"
                                value={newProgram.name}
                                onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                                placeholder="Enter program name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="program-description">Description *</Label>
                            <Textarea
                                id="program-description"
                                value={newProgram.description}
                                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                                placeholder="Enter program description"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start-date">Start Date *</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={newProgram.startDate}
                                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="end-date">End Date *</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={newProgram.endDate}
                                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Program Manager (Optional)</Label>
                            <Select 
                                value={newProgram.programManagerId} 
                                onValueChange={(val) => setNewProgram({ ...newProgram, programManagerId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a manager (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassign">-- No Manager --</SelectItem>
                                    {managers.map(m => (
                                        <SelectItem key={m._id} value={m._id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateProgram} disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Program'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Program Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Program</DialogTitle>
                        <DialogDescription>
                            Update program details and manager assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-program-name">Program Name *</Label>
                            <Input
                                id="edit-program-name"
                                value={newProgram.name}
                                onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                                placeholder="Enter program name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-program-description">Description *</Label>
                            <Textarea
                                id="edit-program-description"
                                value={newProgram.description}
                                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                                placeholder="Enter program description"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-start-date">Start Date *</Label>
                                <Input
                                    id="edit-start-date"
                                    type="date"
                                    value={newProgram.startDate}
                                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-end-date">End Date *</Label>
                                <Input
                                    id="edit-end-date"
                                    type="date"
                                    value={newProgram.endDate}
                                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Program Manager</Label>
                            <Select 
                                value={newProgram.programManagerId} 
                                onValueChange={(val) => setNewProgram({ ...newProgram, programManagerId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassign">-- No Manager --</SelectItem>
                                    {managers.map(m => (
                                        <SelectItem key={m._id} value={m._id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowEditModal(false);
                            setSelectedProgram(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditProgram} disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Program'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Program Modal */}
            <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Program</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{programToDelete?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProgram} disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Program'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Manager Assignment Dialog */}
            <Dialog open={assignModal.open} onOpenChange={(open) => setAssignModal({ ...assignModal, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Manager for "{assignModal.program?.name}"</DialogTitle>
                        <DialogDescription>
                            Select a program manager to oversee this program.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label>Program Manager</Label>
                        <Select value={selectedManagerId} onValueChange={(val) => setSelectedManagerId(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassign">-- Unassign --</SelectItem>
                                {managers.map(m => (
                                    <SelectItem key={m._id} value={m._id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setAssignModal({ open: false, program: null })}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAssignManager} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Reusable Confirmation Dialog */}
            <AlertDialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog({ ...confirmationDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-primary"/>
                            {confirmationDialog.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmationDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmationDialog.onConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ProgramApprovalPage;