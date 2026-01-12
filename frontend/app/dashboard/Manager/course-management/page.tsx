"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
    Loader2, Check, X, BookOpen, Search, AlertCircle, RefreshCw, Eye, Clock,
    CheckCircle, XCircle, Send, Star, Filter
} from "lucide-react";
import {
    getAllRoadmaps,
    approveRoadmap,
    rejectRoadmap,
} from "@/lib/services/roadmap.service";
import { Roadmap, Program as BackendProgram } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/contexts/RoleContext";

interface EnhancedRoadmap extends Roadmap {
    program: BackendProgram;
}

interface ProgramWithRoadmaps {
    program: BackendProgram;
    roadmaps: EnhancedRoadmap[];
    pendingCount: number;
}

export default function RoadmapManagementPage() {
    const { loading: authLoading } = useAuth();
    const [allRoadmaps, setAllRoadmaps] = useState<EnhancedRoadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("all");

    // Roadmap management states
    const [selectedRoadmapForAction, setSelectedRoadmapForAction] = useState<EnhancedRoadmap | null>(null);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isViewModalOpen, setViewModalOpen] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Helper to get nested properties safely
    const getNestedName = (obj: any, path: string): string => {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = (current as any)[part];
            } else {
                return 'N/A';
            }
        }
        return (current as string) || 'N/A';
    };

    // Fetch all roadmaps
    const fetchAllRoadmaps = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllRoadmaps();
            setAllRoadmaps(data as EnhancedRoadmap[]);
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load roadmaps.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            fetchAllRoadmaps();
        }
    }, [authLoading, fetchAllRoadmaps]);

    // Group roadmaps by program
    const groupRoadmapsByProgram = (roadmapsList: EnhancedRoadmap[]): ProgramWithRoadmaps[] => {
        const programMap = new Map<string, ProgramWithRoadmaps>();

        roadmapsList.forEach(roadmap => {
            const programId = typeof roadmap.program === 'string' ? roadmap.program : roadmap.program?._id;
            const programData = typeof roadmap.program === 'string' ? null : roadmap.program;

            if (!programId) return;

            if (!programMap.has(programId)) {
                programMap.set(programId, {
                    program: programData || { _id: programId, name: 'Unknown Program' } as BackendProgram,
                    roadmaps: [],
                    pendingCount: 0
                });
            }

            const entry = programMap.get(programId);
            if (entry) {
                entry.roadmaps.push(roadmap);
                if (roadmap.status === 'pending_approval') {
                    entry.pendingCount++;
                }
            }
        });

        // Sort roadmaps within each program by week number
        programMap.forEach(entry => {
            entry.roadmaps.sort((a, b) => a.weekNumber - b.weekNumber);
        });

        return Array.from(programMap.values());
    };

    // Filter roadmaps
    const filteredRoadmaps = useMemo(() => {
        return allRoadmaps.filter(roadmap => {
            const matchesSearch =
                roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getNestedName(roadmap, 'program.name').toLowerCase().includes(searchTerm.toLowerCase()) ||
                getNestedName(roadmap, 'facilitator.name').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || roadmap.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [allRoadmaps, searchTerm, statusFilter]);

    // Memoized grouped data
    const programsWithRoadmaps = useMemo(() => {
        return groupRoadmapsByProgram(filteredRoadmaps);
    }, [filteredRoadmaps]);

    // Get counts
    const pendingCount = allRoadmaps.filter(r => r.status === 'pending_approval').length;
    const approvedCount = allRoadmaps.filter(r => r.status === 'approved').length;
    const rejectedCount = allRoadmaps.filter(r => r.status === 'rejected').length;

    // Roadmap actions
    const handleApprove = async (roadmap: EnhancedRoadmap) => {
        setIsProcessing(roadmap._id);
        try {
            await approveRoadmap(roadmap._id);
            toast.success(`Week ${roadmap.weekNumber} approved successfully!`);
            fetchAllRoadmaps();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve roadmap.");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleOpenRejectModal = (roadmap: EnhancedRoadmap) => {
        setSelectedRoadmapForAction(roadmap);
        setRejectionReason("");
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedRoadmapForAction || !rejectionReason.trim()) {
            toast.error("Please provide rejection feedback.");
            return;
        }

        setIsProcessing(selectedRoadmapForAction._id);
        try {
            await rejectRoadmap(selectedRoadmapForAction._id, rejectionReason);
            toast.success(`Week ${selectedRoadmapForAction.weekNumber} rejected. Feedback sent to facilitator.`);
            setRejectModalOpen(false);
            setRejectionReason("");
            setSelectedRoadmapForAction(null);
            fetchAllRoadmaps();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject roadmap.");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleOpenViewModal = (roadmap: EnhancedRoadmap) => {
        setSelectedRoadmapForAction(roadmap);
        setViewModalOpen(true);
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Draft</Badge>;
            case 'pending_approval':
                return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white"><Send className="mr-1 h-3 w-3" />Pending</Badge>;
            case 'approved':
                return <Badge className="bg-green-600 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
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

    const renderWeekCard = (roadmap: EnhancedRoadmap) => (
        <AccordionItem
            value={roadmap._id}
            key={roadmap._id}
            className={`border rounded-lg mb-2 ${roadmap.isCurrent ? 'border-yellow-400 bg-yellow-50/50' : ''} ${roadmap.status === 'pending_approval' ? 'border-yellow-500 bg-yellow-50/30' : ''}`}
        >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-wrap">
                    {roadmap.isCurrent && (
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Current
                        </Badge>
                    )}
                    <span className="font-medium">Week {roadmap.weekNumber}: {roadmap.title}</span>
                    {getStatusBadge(roadmap.status ?? "draft")}
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
                {/* Info Section */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Facilitator:</span>
                        <span className="ml-2 font-medium">{getNestedName(roadmap, 'facilitator.name')}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="ml-2 font-medium">{new Date(roadmap.startDate).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Feedback for rejected */}
                {roadmap.status === 'rejected' && roadmap.feedback && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Rejection Feedback:</strong> {roadmap.feedback}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Objectives */}
                {roadmap.objectives && roadmap.objectives.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Objectives</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {roadmap.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </div>
                )}

                {/* Daily Schedule */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Daily Schedule</h4>
                    {(roadmap.topics || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No topics planned yet.</p>
                    ) : (
                        (roadmap.topics || []).map(topic => (
                            <div key={topic._id} className="p-3 border rounded-md bg-muted/50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{topic.day}: {topic.title}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {topic.startTime && topic.endTime ? (
                                                <span>{formatTimeDisplay(topic.startTime)} - {formatTimeDisplay(topic.endTime)}</span>
                                            ) : (
                                                <span>{topic.duration || 'No time specified'}</span>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">{topic.sessionType}</Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleOpenViewModal(roadmap)}>
                        <Eye className="mr-2 h-4 w-4" />View Full Details
                    </Button>
                    {roadmap.status === 'pending_approval' && (
                        <>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOpenRejectModal(roadmap)}
                                disabled={isProcessing === roadmap._id}
                            >
                                <X className="mr-2 h-4 w-4" />Reject
                            </Button>
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(roadmap)}
                                disabled={isProcessing === roadmap._id}
                            >
                                {isProcessing === roadmap._id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Approve
                            </Button>
                        </>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );

    const renderProgramCard = (programData: ProgramWithRoadmaps) => (
        <Card key={programData.program._id} className="mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{programData.program.name}</CardTitle>
                        <Badge variant="outline">
                            {programData.roadmaps.length} week{programData.roadmaps.length !== 1 ? 's' : ''}
                        </Badge>
                        {programData.pendingCount > 0 && (
                            <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                                {programData.pendingCount} pending
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {programData.roadmaps.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">No roadmaps found.</p>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {programData.roadmaps.map(roadmap => renderWeekCard(roadmap))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading roadmaps...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh] p-4">
                <Alert variant="destructive" className="max-w-md text-center">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roadmap Management</h1>
                    <p className="text-muted-foreground">Review and approve weekly roadmaps submitted by facilitators.</p>
                </div>
                <Button onClick={fetchAllRoadmaps} variant="outline" size="sm" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter("all")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{allRoadmaps.length}</div>
                        <p className="text-xs text-muted-foreground">Total Roadmaps</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md ${statusFilter === 'pending_approval' ? 'ring-2 ring-yellow-500' : ''}`} onClick={() => setStatusFilter("pending_approval")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Pending Approval</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md ${statusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setStatusFilter("approved")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                        <p className="text-xs text-muted-foreground">Approved</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setStatusFilter("rejected")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                        <p className="text-xs text-muted-foreground">Rejected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by title, program, or facilitator..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                        {(searchTerm || statusFilter !== "all") && (
                            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Roadmaps grouped by program */}
            {programsWithRoadmaps.length === 0 ? (
                <Card>
                    <CardContent className="py-10">
                        <div className="text-center">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-muted-foreground">No roadmaps found matching your criteria.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div>
                    {programsWithRoadmaps.map(programData => renderProgramCard(programData))}
                </div>
            )}

            {/* Reject Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Reject Week {selectedRoadmapForAction?.weekNumber}: {selectedRoadmapForAction?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Please provide feedback for the facilitator. They will receive this and can revise and resubmit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="rejection-reason">Feedback for Facilitator *</Label>
                        <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="e.g., The objectives are unclear, please add more detail about the expected outcomes. The timeline seems too aggressive for week 2..."
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!!isProcessing || !rejectionReason.trim()}
                        >
                            {isProcessing === selectedRoadmapForAction?._id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <X className="mr-2 h-4 w-4" />
                            )}
                            Reject & Send Feedback
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Full Details Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Week {selectedRoadmapForAction?.weekNumber}: {selectedRoadmapForAction?.title}</DialogTitle>
                        <DialogDescription>
                            {getNestedName(selectedRoadmapForAction, 'program.name')} | Facilitator: {getNestedName(selectedRoadmapForAction, 'facilitator.name')}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRoadmapForAction && (
                        <div className="space-y-4 py-4">
                            <Card className="bg-muted/50 border-dashed">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <strong>Status:</strong> {getStatusBadge(selectedRoadmapForAction.status ?? "")}
                                        {selectedRoadmapForAction.isCurrent && (
                                            <Badge className="bg-yellow-500 text-white">
                                                <Star className="mr-1 h-3 w-3 fill-current" />Current Week
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm"><strong>Start Date:</strong> {new Date(selectedRoadmapForAction.startDate).toLocaleDateString()}</p>
                                    {selectedRoadmapForAction.status === 'rejected' && selectedRoadmapForAction.feedback && (
                                        <Alert variant="destructive" className="mt-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Rejection Reason:</strong> {selectedRoadmapForAction.feedback}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-lg">Objectives</h4>
                                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                                    {selectedRoadmapForAction.objectives?.map((obj, index) => (
                                        <li key={index}>{obj}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-lg">Daily Schedule</h4>
                                {selectedRoadmapForAction.topics?.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No topics planned for this roadmap yet.</p>
                                ) : (
                                    selectedRoadmapForAction.topics?.map((topic, index) => (
                                        <Card key={index} className="p-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="font-medium">{topic.day}: {topic.title}</div>
                                                <Badge variant="outline" className="capitalize">{topic.sessionType}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {topic.startTime && topic.endTime ?
                                                    `${formatTimeDisplay(topic.startTime)} - ${formatTimeDisplay(topic.endTime)}` :
                                                    topic.duration || 'No time specified'
                                                }
                                            </p>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        {selectedRoadmapForAction?.status === 'pending_approval' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setViewModalOpen(false);
                                        handleOpenRejectModal(selectedRoadmapForAction);
                                    }}
                                >
                                    <X className="mr-2 h-4 w-4" />Reject
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => {
                                        handleApprove(selectedRoadmapForAction);
                                        setViewModalOpen(false);
                                    }}
                                    disabled={isProcessing === selectedRoadmapForAction._id}
                                >
                                    {isProcessing === selectedRoadmapForAction._id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}
                                    Approve
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
