"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    Loader2,
    Check,
    X,
    BookOpen,
    Search,
    AlertCircle,
    RefreshCw,
    Eye
} from "lucide-react";
import {
    getAllRoadmaps,
    approveRoadmap,
    rejectRoadmap,
} from "@/lib/services/roadmap.service";
import { Roadmap } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/contexts/RoleContext";

export default function RoadmapManagementPage() {
    const { loading: authLoading } = useAuth();
    const [allRoadmaps, setAllRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Roadmap management states
    const [selectedRoadmapForAction, setSelectedRoadmapForAction] = useState<Roadmap | null>(null);
    const [isRejectRoadmapModalOpen, setRejectRoadmapModalOpen] = useState(false);
    const [roadmapRejectionReason, setRoadmapRejectionReason] = useState("");
    const [isProcessingRoadmapAction, setIsProcessingRoadmapAction] = useState<string | null>(null);
    const [isViewRoadmapModalOpen, setViewRoadmapModalOpen] = useState(false);

    // Filter states
    const [roadmapStatusFilter, setRoadmapStatusFilter] = useState<string>("all");
    const [roadmapSearchTerm, setRoadmapSearchTerm] = useState<string>("");

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
            setAllRoadmaps(data);
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

    // Roadmap actions
    const handleApproveRoadmap = async (roadmapId: string) => {
        setIsProcessingRoadmapAction(roadmapId);
        try {
            await approveRoadmap(roadmapId);
            toast.success("Roadmap approved successfully!");
            fetchAllRoadmaps();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve roadmap.");
        } finally {
            setIsProcessingRoadmapAction(null);
        }
    };

    const handleOpenRejectRoadmapModal = (roadmap: Roadmap) => {
        setSelectedRoadmapForAction(roadmap);
        setRoadmapRejectionReason("");
        setRejectRoadmapModalOpen(true);
    };

    const handleRejectRoadmap = async () => {
        if (!selectedRoadmapForAction || !roadmapRejectionReason.trim()) {
            toast.error("Please provide rejection feedback.");
            return;
        }

        setIsProcessingRoadmapAction(selectedRoadmapForAction._id);
        try {
            await rejectRoadmap(selectedRoadmapForAction._id, roadmapRejectionReason);
            toast.success("Roadmap rejected successfully!");
            setRejectRoadmapModalOpen(false);
            setRoadmapRejectionReason("");
            setSelectedRoadmapForAction(null);
            fetchAllRoadmaps();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject roadmap.");
        } finally {
            setIsProcessingRoadmapAction(null);
        }
    };

    const handleOpenViewRoadmapModal = (roadmap: Roadmap) => {
        setSelectedRoadmapForAction(roadmap);
        setViewRoadmapModalOpen(true);
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-custom-blue text-white hover:bg-custom-blue">Approved</Badge>;
            case "pending_approval":
                return <Badge className="bg-gray-500 text-white hover:bg-gray">Pending</Badge>;
            case "draft":
                return <Badge variant="secondary">Draft</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Filter roadmaps
    const filteredRoadmaps = allRoadmaps.filter(roadmap => {
        const matchesSearch =
            roadmap.title.toLowerCase().includes(roadmapSearchTerm.toLowerCase()) ||
            getNestedName(roadmap, 'program.name').toLowerCase().includes(roadmapSearchTerm.toLowerCase()) ||
            getNestedName(roadmap, 'facilitator.name').toLowerCase().includes(roadmapSearchTerm.toLowerCase());

        const matchesStatus = roadmapStatusFilter === "all" || roadmap.status === roadmapStatusFilter;

        return matchesSearch && matchesStatus;
    });

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
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Weekly Roadmap Management</h1>
                <p className="text-muted-foreground">Review and approve weekly roadmaps submitted by facilitators.</p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center mb-2">
                        <CardTitle className="text-xl">Roadmaps</CardTitle>
                        <Button onClick={fetchAllRoadmaps} variant="outline" size="sm" disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                    </div>
                    <CardDescription>Review and approve weekly roadmaps submitted by facilitators.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search roadmaps..."
                                value={roadmapSearchTerm}
                                onChange={(e) => setRoadmapSearchTerm(e.target.value)}
                                className="w-full pl-10"
                            />
                        </div>
                        <Select value={roadmapStatusFilter} onValueChange={setRoadmapStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        {(roadmapSearchTerm || roadmapStatusFilter !== "all") && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setRoadmapSearchTerm("");
                                    setRoadmapStatusFilter("all");
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Roadmap List */}
                    {filteredRoadmaps.length === 0 ? (
                        <div className="text-center py-8">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-muted-foreground">No roadmaps found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredRoadmaps.map((roadmap) => (
                                <Card key={roadmap._id} className="flex flex-col overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <CardTitle className="text-lg leading-snug">
                                                Week {roadmap.weekNumber}: {roadmap.title}
                                            </CardTitle>
                                            {getStatusBadge(roadmap.status ?? "")}
                                        </div>
                                        <CardDescription className="text-xs">
                                            Program: {getNestedName(roadmap, 'program.name')}
                                            <br/>Facilitator: {getNestedName(roadmap, 'facilitator.name')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-3 pt-0 text-sm text-muted-foreground">
                                        <div>
                                            <h4 className="font-medium">Objectives:</h4>
                                            <ul className="list-disc list-inside mt-1">
                                                {roadmap.objectives?.map((objective, index) => (
                                                    <li key={index} className="line-clamp-1">{objective}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        {roadmap.status === 'rejected' && roadmap.feedback && (
                                            <Alert variant="destructive" className="py-2 px-3 text-xs">
                                                <AlertCircle className="h-3 w-3" />
                                                <AlertDescription>
                                                    <strong>Feedback:</strong> {roadmap.feedback}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                    <div className="p-4 pt-0 flex flex-wrap gap-2 justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenViewRoadmapModal(roadmap)}
                                            className="flex-1 min-w-[80px]"
                                        >
                                            <Eye className="mr-1 h-3 w-3" /> View
                                        </Button>
                                        {roadmap.status === 'pending_approval' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleOpenRejectRoadmapModal(roadmap)}
                                                    disabled={isProcessingRoadmapAction === roadmap._id}
                                                    className="flex-1 min-w-[80px]"
                                                >
                                                    <X className="mr-1 h-3 w-3" /> Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    style={{backgroundColor: '#1f497d'}}
                                                    className="flex-1 min-w-[80px] hover:bg-[#1a3f6b] text-white"
                                                    onClick={() => roadmap._id && handleApproveRoadmap(roadmap._id)}
                                                    disabled={isProcessingRoadmapAction === roadmap._id}
                                                >
                                                    {isProcessingRoadmapAction === roadmap._id ? (
                                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Check className="mr-1 h-3 w-3" />
                                                    )}
                                                    Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Roadmap Rejection Modal */}
            <Dialog open={isRejectRoadmapModalOpen} onOpenChange={setRejectRoadmapModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Reject Roadmap: {selectedRoadmapForAction ?
                                `Week ${selectedRoadmapForAction.weekNumber} - ${selectedRoadmapForAction.title}` :
                                'Roadmap'
                            }
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a clear reason for the rejection. The facilitator will see this feedback.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="roadmap-reason">Rejection Reason *</Label>
                        <Textarea
                            id="roadmap-reason"
                            value={roadmapRejectionReason}
                            onChange={e => setRoadmapRejectionReason(e.target.value)}
                            placeholder="e.g., The weekly objectives are unclear, timeline is unrealistic, needs more detail..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button size="sm" variant="outline" onClick={() => setRejectRoadmapModalOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleRejectRoadmap}
                            disabled={!!isProcessingRoadmapAction || !roadmapRejectionReason.trim()}
                        >
                            {isProcessingRoadmapAction === selectedRoadmapForAction?._id ?
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :
                                <X className="mr-2 h-4 w-4" />
                            }
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Roadmap Modal */}
            <Dialog open={isViewRoadmapModalOpen} onOpenChange={setViewRoadmapModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Weekly Roadmap Details</DialogTitle>
                        <DialogDescription>
                            Comprehensive overview of Week {selectedRoadmapForAction?.weekNumber}: {selectedRoadmapForAction?.title}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRoadmapForAction && (
                        <div className="space-y-4 py-4">
                            <Card className="bg-muted/50 border-dashed">
                                <CardContent className="p-4 space-y-2">
                                    <p className="text-sm"><strong>Program:</strong> {getNestedName(selectedRoadmapForAction, 'program.name')}</p>
                                    <p className="text-sm"><strong>Facilitator:</strong> {getNestedName(selectedRoadmapForAction, 'facilitator.name')}</p>
                                    <p className="text-sm"><strong>Start Date:</strong> {new Date(selectedRoadmapForAction.startDate).toLocaleDateString()}</p>
                                    <p className="text-sm flex items-center gap-2">
                                        <strong>Status:</strong> {getStatusBadge(selectedRoadmapForAction.status ?? "")}
                                        {selectedRoadmapForAction.status === 'rejected' && selectedRoadmapForAction.feedback && (
                                            <span className="text-xs text-red-600 ml-2">Reason: {selectedRoadmapForAction.feedback}</span>
                                        )}
                                    </p>
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
                                                    `${topic.startTime} - ${topic.endTime} (${topic.duration})` :
                                                    topic.duration || 'No time specified'
                                                }
                                            </p>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewRoadmapModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
