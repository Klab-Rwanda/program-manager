"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
    Loader2, 
    Check, 
    X, 
    MessageSquare, 
    FileText, 
    User, 
    BookOpen, 
    Inbox,
    Filter,
    Search,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    GraduationCap, // Not used, but was in original
    Calendar, // Not used, but was in original
    BarChart3, // Not used, but was in original
    Map, // Not used, but was in original
    Target, // Not used, but was in original
    RefreshCw
} from "lucide-react";
import { 
    getAllRoadmaps, 
    getRoadmapsByCourse, 
    getRoadmapAssignmentsWithMarks,
    approveRoadmap,
    rejectRoadmap,
    getPendingApprovalRoadmaps // Not used in this specific file, but imported
} from "@/lib/services/roadmap.service";
import { Course, Roadmap, RoadmapAssignmentsData, Program, User as UserType } from "@/types"; // Import necessary types
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/contexts/RoleContext";
import {
    getAllCourses,
    getCoursesByStatus,
    activateCourse,
    approveCourse,
    rejectCourse
} from "@/lib/services/course.service";

export default function CourseManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [allRoadmaps, setAllRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Course management states
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isRejectCourseModalOpen, setRejectCourseModalOpen] = useState(false); // Renamed to avoid clash
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessingCourseAction, setIsProcessingCourseAction] = useState<string | null>(null); // For per-button loading state

    // Roadmap management states
    const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null); // Renamed to avoid clash
    const [isRejectRoadmapModalOpen, setRejectRoadmapModalOpen] = useState(false); // Renamed to avoid clash
    const [roadmapRejectionReason, setRoadmapRejectionReason] = useState("");
    const [isProcessingRoadmapAction, setIsProcessingRoadmapAction] = useState<string | null>(null); // For per-button loading state
    const [isRefreshingRoadmaps, setIsRefreshingRoadmaps] = useState(false);

    // Assignments states
    const [selectedCourseForAssignments, setSelectedCourseForAssignments] = useState<Course | null>(null);
    const [courseRoadmaps, setCourseRoadmaps] = useState<Roadmap[]>([]);
    const [selectedRoadmapForAssignments, setSelectedRoadmapForAssignments] = useState<Roadmap | null>(null);
    const [roadmapAssignmentsData, setRoadmapAssignmentsData] = useState<RoadmapAssignmentsData | null>(null);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // Filter states
    const [courseStatusFilter, setCourseStatusFilter] = useState<string>("all"); // Renamed
    const [roadmapStatusFilter, setRoadmapStatusFilter] = useState<string>("all");
    const [courseSearchTerm, setCourseSearchTerm] = useState<string>(""); // Renamed
    const [roadmapSearchTerm, setRoadmapSearchTerm] = useState<string>("");
    const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
    const [assignmentSearchTerm, setAssignmentSearchTerm] = useState<string>(""); // Added for assignment search

    // Helper to get nested properties safely (e.g., course.facilitator.name)
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

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let data: Course[];
            if (courseStatusFilter === "all") {
                data = await getAllCourses();
            } else {
                data = await getCoursesByStatus(courseStatusFilter);
            }
            setCourses(data);
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load courses.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [courseStatusFilter]); // Depend on courseStatusFilter

    const fetchAllRoadmaps = useCallback(async () => {
        setIsRefreshingRoadmaps(true); // Set refreshing state
        try {
            const data = await getAllRoadmaps();
            setAllRoadmaps(data);
        } catch (err: any) {
            console.error('Error fetching roadmaps:', err);
            toast.error(err.response?.data?.message || "Failed to load roadmaps.");
        } finally {
            setIsRefreshingRoadmaps(false); // Clear refreshing state
        }
    }, []);

    useEffect(() => {
        if (!authLoading) { // Only fetch data once authentication status is known
            fetchCourses();
            fetchAllRoadmaps();
        }
    }, [authLoading, fetchCourses, fetchAllRoadmaps]); // Add fetchCourses, fetchAllRoadmaps to dependencies

    // Course management functions
    const handleApproveCourse = async (courseId: string) => {
        setIsProcessingCourseAction(courseId);
        try {
            await approveCourse(courseId);
            toast.success("Course approved successfully!");
            fetchCourses(); // Re-fetch all courses to update status
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve course.");
        } finally {
            setIsProcessingCourseAction(null);
        }
    };

    const handleActivateCourse = async (courseId: string) => {
        setIsProcessingCourseAction(courseId);
        try {
            await activateCourse(courseId);
            toast.success("Course activated successfully!");
            fetchCourses(); // Re-fetch all courses to update status
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to activate course.");
        } finally {
            setIsProcessingCourseAction(null);
        }
    };

    const handleOpenRejectCourseModal = (course: Course) => {
        setSelectedCourse(course);
        setRejectionReason("");
        setRejectCourseModalOpen(true);
    };

    const handleRejectCourse = async () => {
        if (!selectedCourse || !rejectionReason.trim()) {
            return toast.error("Rejection reason cannot be empty.");
        }
        setIsProcessingCourseAction(selectedCourse._id);
        try {
            await rejectCourse(selectedCourse._id, rejectionReason);
            toast.success("Course rejected successfully.");
            setRejectCourseModalOpen(false);
            fetchCourses(); // Re-fetch all courses to update status
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject course.");
        } finally {
            setIsProcessingCourseAction(null);
            setSelectedCourse(null);
        }
    };

    // Roadmap functions
    const handleApproveRoadmap = async (roadmapId: string) => {
        setIsProcessingRoadmapAction(roadmapId);
        try {
            await approveRoadmap(roadmapId);
            toast.success("Roadmap approved successfully!");
            fetchAllRoadmaps(); // Re-fetch all roadmaps to update status
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve roadmap.");
        } finally {
            setIsProcessingRoadmapAction(null);
        }
    };

    const handleOpenRejectRoadmapModal = (roadmapId: string) => {
        setSelectedRoadmapId(roadmapId);
        setRoadmapRejectionReason("");
        setRejectRoadmapModalOpen(true);
    };

    const handleRejectRoadmap = async () => {
        if (!selectedRoadmapId || !roadmapRejectionReason.trim()) {
            toast.error("Please provide rejection feedback.");
            return;
        }

        setIsProcessingRoadmapAction(selectedRoadmapId);
        try {
            await rejectRoadmap(selectedRoadmapId, roadmapRejectionReason);
            toast.success("Roadmap rejected successfully!");
            setRejectRoadmapModalOpen(false);
            setRoadmapRejectionReason("");
            setSelectedRoadmapId(null);
            fetchAllRoadmaps(); // Re-fetch all roadmaps to update status
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject roadmap.");
        } finally {
            setIsProcessingRoadmapAction(null);
        }
    };

    // Assignments functions
    const fetchCourseRoadmaps = useCallback(async (courseId: string) => {
        setCourseRoadmaps([]); // Clear previous roadmaps
        setSelectedRoadmapForAssignments(null);
        setRoadmapAssignmentsData(null);
        setLoadingAssignments(true);

        try {
            const data = await getRoadmapsByCourse(courseId);
            const populatedCourseRoadmaps = data.roadmaps; // Assuming this is an array of Roadmap objects
            setCourseRoadmaps(populatedCourseRoadmaps);

            if (populatedCourseRoadmaps.length > 0) {
                const firstRoadmap = populatedCourseRoadmaps[0];
                setSelectedRoadmapForAssignments(firstRoadmap);
                await fetchRoadmapAssignmentsData(firstRoadmap._id);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load course roadmaps.");
            setCourseRoadmaps([]);
            setSelectedRoadmapForAssignments(null);
            setRoadmapAssignmentsData(null);
        } finally {
            setLoadingAssignments(false);
        }
    }, []);

    const fetchRoadmapAssignmentsData = useCallback(async (roadmapId: string) => {
        setLoadingAssignments(true);
        try {
            const data = await getRoadmapAssignmentsWithMarks(roadmapId);
            setRoadmapAssignmentsData(data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load roadmap assignments data.");
            setRoadmapAssignmentsData(null);
        } finally {
            setLoadingAssignments(false);
        }
    }, []);

    const handleCourseChangeForAssignments = useCallback(async (courseId: string) => {
        const course = courses.find(c => c._id === courseId);
        setSelectedCourseForAssignments(course || null);
        if (course) {
            await fetchCourseRoadmaps(courseId);
        }
    }, [courses, fetchCourseRoadmaps]);

    const handleRoadmapChangeForAssignments = useCallback(async (roadmapId: string) => {
        const roadmap = courseRoadmaps.find(r => r._id === roadmapId);
        setSelectedRoadmapForAssignments(roadmap || null);
        if (roadmap) {
            await fetchRoadmapAssignmentsData(roadmapId);
        }
    }, [courseRoadmaps, fetchRoadmapAssignmentsData]);

    // Auto-load first course's roadmaps when courses are loaded
    useEffect(() => {
        if (courses.length > 0 && !selectedCourseForAssignments) {
            const firstCourse = courses[0];
            setSelectedCourseForAssignments(firstCourse);
            fetchCourseRoadmaps(firstCourse._id);
        }
    }, [courses, selectedCourseForAssignments, fetchCourseRoadmaps]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved":
            case "approved":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
            case "PendingApproval":
            case "pending_approval":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
            case "Draft":
            case "draft":
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
            case "Rejected":
            case "rejected":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Approved":
            case "approved":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "PendingApproval":
            case "pending_approval":
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case "Draft":
            case "draft":
                return <FileText className="h-4 w-4 text-gray-600" />;
            case "Rejected":
            case "rejected":
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    // Filter courses based on search term and status filter
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                              (typeof course.description === 'string' && course.description.toLowerCase().includes(courseSearchTerm.toLowerCase())) ||
                              (typeof course.facilitator === 'object' && course.facilitator.name.toLowerCase().includes(courseSearchTerm.toLowerCase())) ||
                              (typeof course.program === 'object' && course.program.name.toLowerCase().includes(courseSearchTerm.toLowerCase()));
        
        const matchesStatus = courseStatusFilter === "all" || course.status === courseStatusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Filter roadmaps based on search term and status filter
    const filteredRoadmaps = allRoadmaps.filter(roadmap => {
        const matchesSearch = 
            roadmap.title.toLowerCase().includes(roadmapSearchTerm.toLowerCase()) ||
            getNestedName(roadmap, 'program.name').toLowerCase().includes(roadmapSearchTerm.toLowerCase()) ||
            getNestedName(roadmap, 'facilitator.name').toLowerCase().includes(roadmapSearchTerm.toLowerCase()) ||
            getNestedName(roadmap, 'course.title').toLowerCase().includes(roadmapSearchTerm.toLowerCase());
        
        const matchesStatus = roadmapStatusFilter === "all" || roadmap.status === roadmapStatusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading data...</span>
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
                <h1 className="text-3xl font-bold tracking-tight">Curriculum & Performance Overview</h1>
                <p className="text-muted-foreground">Manage courses, review weekly roadmaps, and track student performance.</p>
            </div>

            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="courses">Course Management</TabsTrigger>
                    <TabsTrigger value="roadmaps">Weekly Roadmap Management</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments & Performance</TabsTrigger>
                </TabsList>

                {/* Course Management Tab */}
                <TabsContent value="courses" className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center mb-2">
                                <CardTitle className="text-xl">Course Management</CardTitle>
                                <Button onClick={fetchCourses} variant="outline" size="sm" disabled={loading}>
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    Refresh
                                </Button>
                            </div>
                            <CardDescription>Review and approve courses submitted by facilitators.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search courses..."
                                        value={courseSearchTerm}
                                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                                        className="w-full pl-10"
                                    />
                                </div>
                                <Select value={courseStatusFilter} onValueChange={setCourseStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="PendingApproval">Pending Approval</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(courseSearchTerm || courseStatusFilter !== "all") && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            setCourseSearchTerm("");
                                            setCourseStatusFilter("all");
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {/* Course List */}
                            {filteredCourses.length === 0 ? (
                                <div className="text-center py-8">
                                    <Inbox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-muted-foreground">No courses found matching your criteria.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredCourses.map(course => (
                                        <Card key={course._id} className="flex flex-col overflow-hidden">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
                                                    {getStatusBadge(course.status)}
                                                </div>
                                                <CardDescription className="text-xs">
                                                    {getNestedName(course, 'program.name')} • Facilitator: {getNestedName(course, 'facilitator.name')}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-grow space-y-3 pt-0 text-sm text-muted-foreground">
                                                <p className="line-clamp-2">{course.description || 'No description provided.'}</p>
                                                {course.status === 'Rejected' && course.rejectionReason && (
                                                    <Alert variant="destructive" className="py-2 px-3 text-xs">
                                                        <AlertCircle className="h-3 w-3" />
                                                        <AlertDescription>
                                                            <strong>Reason:</strong> {course.rejectionReason}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                                {course.contentUrl && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            const url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${course.contentUrl.replace(/\\/g, '/')}`;
                                                            window.open(url, '_blank', 'noopener,noreferrer');
                                                        }}
                                                        className="w-full flex items-center gap-2 text-xs h-8"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        View Document
                                                    </Button>
                                                )}
                                            </CardContent>
                                            <div className="p-4 pt-0 flex flex-wrap gap-2 justify-end">
                                                {course.status === "PendingApproval" && (
                                                    <>
                                                        <Button 
                                                            size="sm"
                                                            variant="destructive" 
                                                            onClick={() => handleOpenRejectCourseModal(course)} 
                                                            disabled={isProcessingCourseAction === course._id}
                                                            className="flex-1 min-w-[80px]"
                                                        >
                                                            <X className="mr-1 h-3 w-3" /> Reject
                                                        </Button>
                                                        <Button 
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleApproveCourse(course._id)} 
                                                            disabled={isProcessingCourseAction === course._id} 
                                                            className="flex-1 min-w-[80px]"
                                                        >
                                                            {isProcessingCourseAction === course._id ? 
                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : 
                                                                <Check className="mr-1 h-3 w-3" />
                                                            }
                                                            Approve
                                                        </Button>
                                                    </>
                                                )}
                                                {course.status === "Rejected" && (
                                                    <Button 
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => handleActivateCourse(course._id)} 
                                                        disabled={isProcessingCourseAction === course._id} 
                                                        className="flex-1 min-w-[80px]"
                                                    >
                                                        {isProcessingCourseAction === course._id ? 
                                                            <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : 
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                        }
                                                        Activate
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Weekly Roadmap Management Tab */}
                <TabsContent value="roadmaps" className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center mb-2">
                                <CardTitle className="text-xl">Weekly Roadmap Management</CardTitle>
                                <Button onClick={fetchAllRoadmaps} variant="outline" size="sm" disabled={isRefreshingRoadmaps}>
                                    {isRefreshingRoadmaps ? (
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
                                                    Program: {getNestedName(roadmap, 'program.name')} • Course: {getNestedName(roadmap, 'course.title')}
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
                                                {roadmap.status === 'pending_approval' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive" 
                                                            onClick={() => roadmap._id && handleOpenRejectRoadmapModal(roadmap._id)} 
                                                            disabled={isProcessingRoadmapAction === roadmap._id}
                                                            className="flex-1 min-w-[80px]"
                                                        >
                                                            <X className="mr-1 h-3 w-3" /> Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="default" 
                                                            onClick={() => roadmap._id && handleApproveRoadmap(roadmap._id)}
                                                            disabled={isProcessingRoadmapAction === roadmap._id}
                                                            className="flex-1 min-w-[80px]"
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
                </TabsContent>

                {/* Assignments & Performance Tab */}
                <TabsContent value="assignments" className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl">Assignments & Student Performance</CardTitle>
                            <CardDescription>View assignments, student marks, and attendance by course and weekly roadmap.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Course and Roadmap selection dropdowns */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <Label htmlFor="selectCourseAssignments" className="sr-only">Select Course</Label>
                                    <Select
                                        value={selectedCourseForAssignments?._id || ""}
                                        onValueChange={(value) => value && handleCourseChangeForAssignments(value)}
                                    >
                                        <SelectTrigger id="selectCourseAssignments">
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map(course => (
                                                <SelectItem key={course._id} value={course._id}>
                                                    {course.title} ({getNestedName(course, 'program.name')})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedCourseForAssignments && (
                                    <div className="flex-1">
                                        <Label htmlFor="selectRoadmapAssignments" className="sr-only">Select Weekly Roadmap</Label>
                                        <Select
                                            value={selectedRoadmapForAssignments?._id || ""}
                                            onValueChange={(value) => value && handleRoadmapChangeForAssignments(value)}
                                            disabled={courseRoadmaps.length === 0}
                                        >
                                            <SelectTrigger id="selectRoadmapAssignments">
                                                <SelectValue placeholder="Select a weekly roadmap" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courseRoadmaps.map(roadmap => (
                                                    <SelectItem key={roadmap._id} value={roadmap._id}>
                                                        Week {roadmap.weekNumber}: {roadmap.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Assignments data display */}
                            {loadingAssignments ? (
                                <div className="text-center py-10">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-muted-foreground mt-2">Loading assignments data...</p>
                                </div>
                            ) : roadmapAssignmentsData ? (
                                <div className="space-y-6">
                                    {/* Roadmap Info Summary (condensed) */}
                                    <Card className="bg-muted/50 border-dashed">
                                        <CardHeader className="py-3 px-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{roadmapAssignmentsData.roadmap.title}</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        Week {roadmapAssignmentsData.roadmap.weekNumber} • Program: {roadmapAssignmentsData.roadmap.program} • Facilitator: {roadmapAssignmentsData.roadmap.facilitator}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>

                                    {roadmapAssignmentsData.assignments.map(assignment => (
                                        <Card key={assignment.assignmentId} className="mb-6">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <CardTitle className="text-xl">{assignment.assignmentTitle}</CardTitle>
                                                        <CardDescription className="text-sm mt-1">Due: {new Date(assignment.dueDate).toLocaleDateString()}</CardDescription>
                                                        <div className="mt-2 prose prose-sm max-w-none text-muted-foreground">
                                                            <div dangerouslySetInnerHTML={{ __html: assignment.assignmentDescription }} />
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <Badge variant="secondary">{assignment.maxGrade} Points</Badge>
                                                        <p className="text-muted-foreground mt-1">Facilitator: {assignment.facilitatorName}</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                {assignment.submissions.length === 0 ? (
                                                    <div className="text-center py-8 bg-muted rounded-md">
                                                        <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                        <p className="text-muted-foreground">No submissions for this assignment yet.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* Submissions Filters and Summary */}
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="font-semibold text-sm">Student Performance:</span>
                                                            <Input
                                                                placeholder="Search student..."
                                                                value={assignmentSearchTerm}
                                                                onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                                                                className="w-[180px] h-9"
                                                            />
                                                            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                                                                <SelectTrigger className="w-[150px] h-9">
                                                                    <SelectValue placeholder="Filter status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">All Status</SelectItem>
                                                                    <SelectItem value="submitted">Submitted</SelectItem>
                                                                    <SelectItem value="not-submitted">Not Submitted</SelectItem>
                                                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                                                    <SelectItem value="needs-revision">Needs Revision</SelectItem>
                                                                    <SelectItem value="pending">Pending Review</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-[150px]">Student</TableHead>
                                                                    <TableHead className="w-[100px]">Submission Date</TableHead>
                                                                    <TableHead className="w-[90px]">Status</TableHead>
                                                                    <TableHead className="w-[90px] text-center">Grade</TableHead>
                                                                    <TableHead className="w-[90px] text-center">Attendance</TableHead>
                                                                    <TableHead className="w-[100px] text-center">Overall Score</TableHead>
                                                                    <TableHead className="min-w-[150px]">Feedback</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {assignment.submissions
                                                                    .filter(submission => {
                                                                        const statusMatch = (() => {
                                                                            if (assignmentFilter === 'all') return true;
                                                                            if (assignmentFilter === 'submitted') return submission.hasSubmitted;
                                                                            if (assignmentFilter === 'not-submitted') return !submission.hasSubmitted;
                                                                            if (assignmentFilter === 'pending') return submission.hasSubmitted && submission.status === 'Submitted';
                                                                            return submission.status === assignmentFilter.replace('-', ' '); // 'reviewed' -> 'Reviewed' etc.
                                                                        })();
                                                                        const searchMatch = !assignmentSearchTerm || 
                                                                            submission.traineeName.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                                                                            submission.traineeEmail.toLowerCase().includes(assignmentSearchTerm.toLowerCase());
                                                                        return statusMatch && searchMatch;
                                                                    })
                                                                    .map(submission => (
                                                                    <TableRow 
                                                                        key={submission.submissionId || submission.traineeEmail} 
                                                                        className={!submission.hasSubmitted ? 'bg-gray-50 text-muted-foreground' : ''}
                                                                    >
                                                                        <TableCell>
                                                                            <div className="font-medium">{submission.traineeName}</div>
                                                                            <div className="text-xs text-muted-foreground">{submission.traineeEmail}</div>
                                                                            {submission.totalSessions === 0 && (
                                                                                <Badge variant="outline" className="text-xs mt-1">Not Enrolled</Badge>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant={
                                                                                submission.status === 'Reviewed' ? 'default' :
                                                                                submission.status === 'NeedsRevision' ? 'destructive' :
                                                                                submission.status === 'Not Submitted' || submission.totalSessions === 0 ? 'secondary' : 'outline'
                                                                            } className="text-xs">
                                                                                {submission.totalSessions === 0 ? 'N/A' : (submission.status === 'Submitted' ? 'Pending Review' : submission.status)}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            {submission.grade === 'Not graded' ? '-' : `${submission.grade}`}
                                                                            {submission.grade !== 'Not graded' && `/${assignment.maxGrade}`}
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            {submission.attendancePercentage}% ({submission.presentSessions}/{submission.totalSessions})
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            {submission.hasSubmitted && submission.grade !== 'Not graded' && submission.attendancePercentage > 0 ? (
                                                                                `${Math.round((parseFloat(submission.grade) / assignment.maxGrade * 0.7 + submission.attendancePercentage / 100 * 0.3) * 100)}%`
                                                                            ) : '-'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="max-w-xs line-clamp-2">
                                                                                {submission.feedback || 'No feedback'}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        
                                                        {/* Summary Statistics */}
                                                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                                            <h5 className="font-semibold mb-3">Assignment Summary</h5>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div><div className="text-muted-foreground">Average Grade</div><div className="font-semibold">
                                                                    {(() => {
                                                                        const graded = assignment.submissions.filter(s => s.hasSubmitted && s.grade !== 'Not graded');
                                                                        return graded.length > 0 ? `${(graded.reduce((sum, s) => sum + parseFloat(s.grade), 0) / graded.length).toFixed(1)}/${assignment.maxGrade}` : 'N/A';
                                                                    })()}
                                                                </div></div>
                                                                <div><div className="text-muted-foreground">Average Attendance</div><div className="font-semibold">
                                                                    {(() => {
                                                                        const avg = assignment.submissions.reduce((sum, s) => sum + s.attendancePercentage, 0) / assignment.submissions.length;
                                                                        return `${avg.toFixed(1)}%`;
                                                                    })()}
                                                                </div></div>
                                                                <div><div className="text-muted-foreground">Enrolled Students</div><div className="font-semibold">
                                                                    {assignment.submissions.filter(s => s.totalSessions > 0).length}/{assignment.submissions.length}
                                                                </div></div>
                                                                <div><div className="text-muted-foreground">Not Enrolled</div><div className="font-semibold">
                                                                    {assignment.submissions.filter(s => s.totalSessions === 0).length}/{assignment.submissions.length}
                                                                </div></div>
                                                                <div><div className="text-muted-foreground">Submitted</div><div className="font-semibold">
                                                                    {assignment.submissions.filter(s => s.hasSubmitted).length}/{assignment.submissions.filter(s => s.totalSessions > 0).length || 0}
                                                                </div></div>
                                                                <div><div className="text-muted-foreground">Pending Review</div><div className="font-semibold">
                                                                    {assignment.submissions.filter(s => s.hasSubmitted && s.status === 'Submitted').length}/{assignment.submissions.filter(s => s.hasSubmitted).length || 0}
                                                                </div></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted rounded-md">
                                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-xl font-semibold">No Data Available</h3>
                                    <p className="text-muted-foreground mt-2">
                                        Select a course and weekly roadmap to view assignments and student performance.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {/* Course Rejection Modal */}
            <Dialog open={isRejectCourseModalOpen} onOpenChange={setRejectCourseModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Course: {selectedCourse?.title}</DialogTitle>
                        <DialogDescription>
                            Please provide a clear reason for the rejection. The facilitator will see this feedback.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="reason">Rejection Reason *</Label>
                        <Textarea 
                            id="reason" 
                            value={rejectionReason} 
                            onChange={e => setRejectionReason(e.target.value)} 
                            placeholder="e.g., The content is outdated, missing key topics, needs more detail..." 
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button size="sm" variant="outline" onClick={() => setRejectCourseModalOpen(false)}>Cancel</Button>
                        <Button 
                            size="sm"
                            variant="destructive" 
                            onClick={handleRejectCourse} 
                            disabled={!!isProcessingCourseAction || !rejectionReason.trim()}
                        >
                            {isProcessingCourseAction === selectedCourse?._id ? 
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 
                                <X className="mr-2 h-4 w-4" />
                            }
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Roadmap Rejection Modal */}
            <Dialog open={isRejectRoadmapModalOpen} onOpenChange={setRejectRoadmapModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Reject Roadmap: {selectedRoadmapId && allRoadmaps.find(r => r._id === selectedRoadmapId) ? 
                                `Week ${allRoadmaps.find(r => r._id === selectedRoadmapId)?.weekNumber} - ${allRoadmaps.find(r => r._id === selectedRoadmapId)?.title}` : 
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
                            {isProcessingRoadmapAction === selectedRoadmapId ? 
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 
                                <X className="mr-2 h-4 w-4" />
                            }
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}