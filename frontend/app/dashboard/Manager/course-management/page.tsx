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
    GraduationCap,
    Calendar,
    BarChart3,
    Map,
    Target,
    RefreshCw
} from "lucide-react";
import { 
    getAllRoadmaps, 
    getRoadmapsByCourse, 
    getRoadmapAssignmentsWithMarks,
    approveRoadmap,
    rejectRoadmap,
    getPendingApprovalRoadmaps
} from "@/lib/services/roadmap.service";
import { Course, Roadmap, RoadmapAssignmentsData } from "@/types";
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
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
    
    // Roadmap management states
    const [selectedRoadmap, setSelectedRoadmap] = useState<string | null>(null);
    const [isRoadmapRejectModalOpen, setRoadmapRejectModalOpen] = useState(false);
    const [roadmapRejectionReason, setRoadmapRejectionReason] = useState("");
    const [isProcessingRoadmapId, setIsProcessingRoadmapId] = useState<string | null>(null);
    const [isRefreshingRoadmaps, setIsRefreshingRoadmaps] = useState(false);
    
    // Assignments states
    const [selectedCourseForAssignments, setSelectedCourseForAssignments] = useState<Course | null>(null);
    const [courseRoadmaps, setCourseRoadmaps] = useState<Roadmap[]>([]);
    const [selectedRoadmapForAssignments, setSelectedRoadmapForAssignments] = useState<Roadmap | null>(null);
    const [roadmapAssignmentsData, setRoadmapAssignmentsData] = useState<RoadmapAssignmentsData | null>(null);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    
    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [roadmapStatusFilter, setRoadmapStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [roadmapSearchTerm, setRoadmapSearchTerm] = useState<string>("");
    const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let data;
            if (statusFilter === "all") {
                data = await getAllCourses();
            } else {
                data = await getCoursesByStatus(statusFilter);
            }
            setCourses(data);
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load courses.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const fetchAllRoadmaps = useCallback(async () => {
        try {
            const data = await getAllRoadmaps();
            setAllRoadmaps(data);
        } catch (err: any) {
            console.error("Failed to load roadmaps:", err);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
        fetchAllRoadmaps();
    }, []);

    // Course management functions
    const handleApprove = async (courseId: string) => {
        setIsProcessingId(courseId);
        try {
            await approveCourse(courseId);
            toast.success("Course approved successfully!");
            fetchCourses();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve course.");
        } finally {
            setIsProcessingId(null);
        }
    };

    const handleActivate = async (courseId: string) => {
        setIsProcessingId(courseId);
        try {
            await activateCourse(courseId);
            toast.success("Course activated successfully!");
            fetchCourses();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to activate course.");
        } finally {
            setIsProcessingId(null);
        }
    };

    const handleOpenRejectModal = (course: Course) => {
        setSelectedCourse(course);
        setRejectionReason("");
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedCourse || !rejectionReason.trim()) {
            return toast.error("Rejection reason cannot be empty.");
        }
        setIsProcessingId(selectedCourse._id);
        try {
            await rejectCourse(selectedCourse._id, rejectionReason);
            toast.success("Course rejected successfully.");
            setRejectModalOpen(false);
            fetchCourses();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject course.");
        } finally {
            setIsProcessingId(null);
            setSelectedCourse(null);
        }
    };

    // Roadmap functions
    const fetchRoadmaps = async () => {
        setIsRefreshingRoadmaps(true);
        try {
            console.log('Fetching all roadmaps...');
            const data = await getAllRoadmaps();
            console.log('Roadmaps data received:', data);
            console.log('Number of roadmaps:', data.length);
            setAllRoadmaps(data);
        } catch (err: any) {
            console.error('Error fetching roadmaps:', err);
            const message = err.response?.data?.message || "Failed to load roadmaps.";
            toast.error(message);
        } finally {
            setIsRefreshingRoadmaps(false);
        }
    };

    const handleApproveRoadmap = async (roadmapId: string) => {
        try {
            setIsProcessingRoadmapId(roadmapId);
            await approveRoadmap(roadmapId);
            toast.success("Roadmap approved successfully!");
            fetchRoadmaps();
        } catch (err: any) {
            console.error('Error approving roadmap:', err);
            const message = err.response?.data?.message || "Failed to approve roadmap.";
            toast.error(message);
        } finally {
            setIsProcessingRoadmapId(null);
        }
    };

    const handleOpenRoadmapRejectModal = (roadmapId: string) => {
        setSelectedRoadmap(roadmapId);
        setRoadmapRejectModalOpen(true);
    };

    const handleRejectRoadmap = async () => {
        if (!selectedRoadmap || !roadmapRejectionReason.trim()) {
            toast.error("Please provide rejection feedback.");
            return;
        }

        try {
            setIsProcessingRoadmapId(selectedRoadmap);
            await rejectRoadmap(selectedRoadmap, roadmapRejectionReason);
            toast.success("Roadmap rejected successfully!");
            setRoadmapRejectModalOpen(false);
            setRoadmapRejectionReason("");
            setSelectedRoadmap(null);
            fetchRoadmaps();
        } catch (err: any) {
            console.error('Error rejecting roadmap:', err);
            const message = err.response?.data?.message || "Failed to reject roadmap.";
            toast.error(message);
        } finally {
            setIsProcessingRoadmapId(null);
        }
    };

    // Assignments functions
    const fetchCourseRoadmaps = async (courseId: string) => {
        try {
            console.log('Fetching roadmaps for course:', courseId);
            const data = await getRoadmapsByCourse(courseId);
            console.log('Roadmaps data received:', data);
            setCourseRoadmaps(data.roadmaps);
            if (data.roadmaps.length > 0) {
                setSelectedRoadmapForAssignments(data.roadmaps[0]);
                await fetchRoadmapAssignmentsData(data.roadmaps[0]._id);
            } else {
                setSelectedRoadmapForAssignments(null);
                setRoadmapAssignmentsData(null);
            }
        } catch (err: any) {
            console.error('Error fetching course roadmaps:', err);
            const message = err.response?.data?.message || "Failed to load course roadmaps.";
            toast.error(message);
            setCourseRoadmaps([]);
            setSelectedRoadmapForAssignments(null);
            setRoadmapAssignmentsData(null);
        }
    };

    const fetchRoadmapAssignmentsData = async (roadmapId: string) => {
        setLoadingAssignments(true);
        try {
            const data = await getRoadmapAssignmentsWithMarks(roadmapId);
            setRoadmapAssignmentsData(data);
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load roadmap assignments data.";
            toast.error(message);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const handleCourseChangeForAssignments = async (courseId: string) => {
        const course = courses.find(c => c._id === courseId);
        setSelectedCourseForAssignments(course || null);
        if (course) {
            await fetchCourseRoadmaps(courseId);
        }
    };

    const handleRoadmapChangeForAssignments = async (roadmapId: string) => {
        const roadmap = courseRoadmaps.find(r => r._id === roadmapId);
        setSelectedRoadmapForAssignments(roadmap || null);
        if (roadmap) {
            await fetchRoadmapAssignmentsData(roadmapId);
        }
    };

    // Auto-load first course's roadmaps when courses are loaded
    useEffect(() => {
        if (courses.length > 0 && !selectedCourseForAssignments) {
            const firstCourse = courses[0];
            setSelectedCourseForAssignments(firstCourse);
            fetchCourseRoadmaps(firstCourse._id);
        }
    }, [courses, selectedCourseForAssignments]);

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

    // Filter courses based on search term
    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.facilitator?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.program?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter roadmaps based on search term and status
    const filteredRoadmaps = allRoadmaps.filter(roadmap => {
        const matchesSearch = 
            roadmap.title.toLowerCase().includes(roadmapSearchTerm.toLowerCase()) ||
            (typeof roadmap.program === 'object' ? roadmap.program.name.toLowerCase() : '').includes(roadmapSearchTerm.toLowerCase()) ||
            (typeof roadmap.facilitator === 'object' ? roadmap.facilitator.name.toLowerCase() : '').includes(roadmapSearchTerm.toLowerCase()) ||
            (typeof roadmap.course === 'object' ? roadmap.course.title.toLowerCase() : '').includes(roadmapSearchTerm.toLowerCase());
        
        const matchesStatus = roadmapStatusFilter === "all" || roadmap.status === roadmapStatusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (loading || authLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
                <p className="text-muted-foreground">Manage courses, weekly roadmaps, and view student performance.</p>
            </div>

            <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="courses">Course Management</TabsTrigger>
                    <TabsTrigger value="roadmaps">Weekly Roadmap Management</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments & Marks</TabsTrigger>
                </TabsList>

                {/* Course Management Tab */}
                <TabsContent value="courses" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Course Management</h3>
                            <p className="text-sm text-muted-foreground">
                                Review and approve courses submitted by facilitators
                            </p>
                        </div>
                        <Button onClick={fetchCourses} variant="outline" size="sm" disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {loading ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search courses, facilitators, or programs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="PendingApproval">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(searchTerm || statusFilter !== "all") && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter("all");
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Results Summary */}
                    {(searchTerm || statusFilter !== "all") && (
                        <div className="text-sm text-muted-foreground">
                            Showing {filteredCourses.length} of {courses.length} courses
                        </div>
                    )}

                    {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                    {!error && filteredCourses.length === 0 ? (
                        <Card className="text-center py-16">
                            <CardContent>
                                <Inbox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold">No Courses Found</h3>
                                <p className="text-muted-foreground mt-2">
                                    {searchTerm || statusFilter !== "all" 
                                        ? "Try adjusting your search or filter criteria." 
                                        : "There are no courses available at the moment."}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredCourses.map(course => (
                                <Card key={course._id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{course.title}</CardTitle>
                                            {getStatusBadge(course.status)}
                                        </div>
                                        <CardDescription className="line-clamp-2 h-10">{course.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 flex-grow">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground"/>
                                                <span>Facilitator: <strong>{course.facilitator?.name || "N/A"}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground"/>
                                                <span>Program: <strong>{course.program?.name || "N/A"}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(course.status)}
                                                <span>Status: <strong>{course.status}</strong></span>
                                            </div>
                                        </div>
                                        {course.contentUrl && (
                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${course.contentUrl.replace(/\\/g, '/')}`;
                                                        window.open(url, '_blank', 'noopener,noreferrer');
                                                    }}
                                                    className="w-full"
                                                >
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Content Document
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-4 pt-0 mt-auto">
                                        {(course.status === "Draft" || course.status === "PendingApproval") && (
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="sm"
                                                    variant="destructive" 
                                                    onClick={() => handleOpenRejectModal(course)} 
                                                    disabled={isProcessingId === course._id}
                                                    className="w-24"
                                                >
                                                    <X className="mr-2 h-4 w-4" /> Reject
                                                </Button>
                                                <Button 
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleApprove(course._id)} 
                                                    disabled={isProcessingId === course._id} 
                                                    className="w-24"
                                                >
                                                    {isProcessingId === course._id ? 
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 
                                                        <Check className="mr-2 h-4 w-4" />
                                                    }
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                        {course.status === "Rejected" && (
                                            <div className="flex justify-end">
                                                <Button 
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleActivate(course._id)} 
                                                    disabled={isProcessingId === course._id} 
                                                    className="w-24"
                                                >
                                                    {isProcessingId === course._id ? 
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                    }
                                                    Activate
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                        {/* Weekly Roadmap Management Tab */}
                        <TabsContent value="roadmaps" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Weekly Roadmap Management</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Review and approve weekly roadmaps submitted by facilitators
                                    </p>
                                </div>
                                <Button onClick={fetchRoadmaps} variant="outline" size="sm" disabled={isRefreshingRoadmaps}>
                                    {isRefreshingRoadmaps ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    {isRefreshingRoadmaps ? "Refreshing..." : "Refresh"}
                                </Button>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search roadmaps, facilitators, programs, or courses..."
                                        value={roadmapSearchTerm}
                                        onChange={(e) => setRoadmapSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="w-full sm:w-48">
                                    <Select value={roadmapStatusFilter} onValueChange={setRoadmapStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roadmaps</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="pending_approval">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(roadmapSearchTerm || roadmapStatusFilter !== "all") && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            setRoadmapSearchTerm("");
                                            setRoadmapStatusFilter("all");
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>

                            {/* Results Summary */}
                            {(roadmapSearchTerm || roadmapStatusFilter !== "all") && (
                                <div className="text-sm text-muted-foreground">
                                    Showing {filteredRoadmaps.length} of {allRoadmaps.length} roadmaps
                                </div>
                            )}

                            {filteredRoadmaps.length === 0 ? (
                                <Card>
                                    <CardContent className="text-center py-8">
                                        <p className="text-muted-foreground">
                                            {roadmapSearchTerm || roadmapStatusFilter !== "all" 
                                                ? "No roadmaps match your search or filter criteria." 
                                                : "No roadmaps found."}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredRoadmaps.map((roadmap) => (
                                        <Card key={roadmap._id}>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            Week {roadmap.weekNumber}: {roadmap.title}
                                                        </CardTitle>
                                                        <p className="text-sm text-muted-foreground">
                                                            Program: {typeof roadmap.program === 'object' ? roadmap.program.name : 'Unknown Program'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Course: {typeof roadmap.course === 'object' ? roadmap.course.title : 'Unknown Course'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Facilitator: {typeof roadmap.facilitator === 'object' ? roadmap.facilitator.name : 'Unknown Facilitator'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(roadmap.status ?? "")}
                                                        {roadmap.status === 'pending_approval' && (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => roadmap._id && handleApproveRoadmap(roadmap._id)}
                                                                    disabled={isProcessingRoadmapId === roadmap._id}
                                                                    className="w-24"
                                                                >
                                                                    {isProcessingRoadmapId === roadmap._id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive" 
                                                                    onClick={() => roadmap._id && handleOpenRoadmapRejectModal(roadmap._id)} 
                                                                    disabled={isProcessingRoadmapId === roadmap._id}
                                                                    className="w-24"
                                                                >
                                                                    {isProcessingRoadmapId === roadmap._id ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="font-medium text-sm">Objectives:</h4>
                                                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                                                            {roadmap.objectives?.map((objective, index) => (
                                                                <li key={index}>{objective}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    {roadmap.feedback && (
                                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                            <p className="text-sm font-medium text-red-800">Rejection Feedback:</p>
                                                            <p className="text-sm text-red-700">{roadmap.feedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                {/* Assignments & Marks Tab */}
                <TabsContent value="assignments" className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Assignments & Student Performance</h2>
                        <p className="text-muted-foreground">View assignments, student marks, and attendance by course and weekly roadmap.</p>
                    </div>

                    {/* Course and Roadmap selection dropdowns */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
                        <div className="w-full sm:w-80">
                            <Select
                                value={selectedCourseForAssignments?._id || ""}
                                onValueChange={(value) => value && handleCourseChangeForAssignments(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course._id} value={course._id}>
                                            {course.title} ({course.program?.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedCourseForAssignments && (
                            <div className="w-full sm:w-80">
                                                            <Select
                                value={selectedRoadmapForAssignments?._id || ""}
                                onValueChange={(value) => value && handleRoadmapChangeForAssignments(value)}
                            >
                                    <SelectTrigger>
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
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : roadmapAssignmentsData ? (
                        <div className="space-y-6">
                            {/* Roadmap Info */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Week {roadmapAssignmentsData.roadmap.weekNumber}: {roadmapAssignmentsData.roadmap.title}</CardTitle>
                                            <CardDescription>
                                                {roadmapAssignmentsData.roadmap.program} • {roadmapAssignmentsData.roadmap.facilitator}
                                            </CardDescription>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <div>Start Date: {new Date(roadmapAssignmentsData.roadmap.startDate).toLocaleDateString()}</div>
                                            <div>Objectives: {roadmapAssignmentsData.roadmap.objectives.length}</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Weekly Objectives:</h4>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                            {roadmapAssignmentsData.roadmap.objectives.map((objective, index) => (
                                                <li key={index}>{objective}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            {roadmapAssignmentsData.assignments.map(assignment => (
                                <Card key={assignment.assignmentId} className="mb-6">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl">{assignment.assignmentTitle}</CardTitle>
                                                <div className="mt-2 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground prose-pre:text-muted-foreground">
                                                    <div 
                                                        dangerouslySetInnerHTML={{ __html: assignment.assignmentDescription }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">Due Date</div>
                                                <div className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 mt-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Max Grade:</span>
                                                <span className="font-medium ml-1">{assignment.maxGrade} points</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Facilitator:</span>
                                                <span className="font-medium ml-1">{assignment.facilitatorName}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Submissions:</span>
                                                <span className="font-medium ml-1">{assignment.submissions.length}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {assignment.submissions.length === 0 ? (
                                            <div className="text-center py-8">
                                                <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-muted-foreground">No submissions for this assignment yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-lg font-semibold">Student Submissions & Performance</h4>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-sm text-muted-foreground">
                                                            {(() => {
                                                                const filteredCount = assignment.submissions.filter(submission => {
                                                                    const statusMatch = (() => {
                                                                        switch (assignmentFilter) {
                                                                            case 'submitted':
                                                                                return submission.hasSubmitted;
                                                                            case 'not-submitted':
                                                                                return !submission.hasSubmitted;
                                                                            case 'reviewed':
                                                                                return submission.status === 'Reviewed';
                                                                            case 'needs-revision':
                                                                                return submission.status === 'NeedsRevision';
                                                                            case 'pending':
                                                                                return submission.hasSubmitted && submission.status === 'Submitted';
                                                                            default:
                                                                                return true;
                                                                        }
                                                                    })();

                                                                    const searchMatch = !searchTerm || 
                                                                        submission.traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                        submission.traineeEmail.toLowerCase().includes(searchTerm.toLowerCase());

                                                                    return statusMatch && searchMatch;
                                                                }).length;
                                                                return `${filteredCount} of ${assignment.submissions.length} student${assignment.submissions.length !== 1 ? 's' : ''}`;
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                placeholder="Search students..."
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                className="w-[200px] h-8"
                                                            />
                                                            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                                                                <SelectTrigger className="w-[180px] h-8">
                                                                    <SelectValue placeholder="Filter students" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">All Students</SelectItem>
                                                                    <SelectItem value="submitted">Submitted</SelectItem>
                                                                    <SelectItem value="not-submitted">Not Submitted</SelectItem>
                                                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                                                    <SelectItem value="needs-revision">Needs Revision</SelectItem>
                                                                    <SelectItem value="pending">Pending Review</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[200px]">Student</TableHead>
                                                            <TableHead className="w-[120px]">Submission Date</TableHead>
                                                            <TableHead className="w-[100px]">Status</TableHead>
                                                            <TableHead className="w-[100px] text-center">Assignment Grade</TableHead>
                                                            <TableHead className="w-[120px] text-center">Attendance</TableHead>
                                                            <TableHead className="w-[100px] text-center">Overall Performance</TableHead>
                                                            <TableHead>Feedback</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {assignment.submissions
                                                            .filter(submission => {
                                                                // First apply status filter
                                                                const statusMatch = (() => {
                                                                    switch (assignmentFilter) {
                                                                        case 'submitted':
                                                                            return submission.hasSubmitted;
                                                                        case 'not-submitted':
                                                                            return !submission.hasSubmitted;
                                                                        case 'reviewed':
                                                                            return submission.status === 'Reviewed';
                                                                        case 'needs-revision':
                                                                            return submission.status === 'NeedsRevision';
                                                                        case 'pending':
                                                                            return submission.hasSubmitted && submission.status === 'Submitted';
                                                                        default:
                                                                            return true;
                                                                    }
                                                                })();

                                                                // Then apply search filter
                                                                const searchMatch = !searchTerm || 
                                                                    submission.traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                                    submission.traineeEmail.toLowerCase().includes(searchTerm.toLowerCase());

                                                                return statusMatch && searchMatch;
                                                            })
                                                            .map(submission => (
                                                            <TableRow key={submission.submissionId || submission.traineeEmail} className={
                                                                !submission.hasSubmitted ? 'bg-gray-50' : ''
                                                            }>
                                                                <TableCell>
                                                                    <div className="space-y-1">
                                                                        <div className="font-medium text-sm">{submission.traineeName}</div>
                                                                        <div className="text-xs text-muted-foreground">{submission.traineeEmail}</div>
                                                                        {!submission.hasSubmitted && (
                                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                                Not Enrolled
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {submission.hasSubmitted ? (
                                                                        <div className="text-sm">
                                                                            {new Date(submission.submittedAt!).toLocaleDateString()}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground">-</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={
                                                                        submission.status === 'Reviewed' ? 'default' :
                                                                        submission.status === 'NeedsRevision' ? 'destructive' :
                                                                        submission.status === 'Not Submitted' ? 'secondary' : 'outline'
                                                                    } className="text-xs">
                                                                        {submission.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="space-y-1">
                                                                        <div className="font-semibold text-sm">
                                                                            {submission.grade === 'Not graded' ? 
                                                                                <span className="text-muted-foreground">-</span> : 
                                                                                submission.grade
                                                                            }
                                                                        </div>
                                                                        {submission.grade !== 'Not graded' && (
                                                                            <div className="text-xs text-muted-foreground">
                                                                                / {assignment.maxGrade}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="space-y-1">
                                                                        <div className="font-semibold text-sm">
                                                                            {submission.attendancePercentage}%
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {submission.presentSessions}/{submission.totalSessions} sessions
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="space-y-1">
                                                                        {submission.hasSubmitted && submission.grade !== 'Not graded' && submission.attendancePercentage > 0 ? (
                                                                            <>
                                                                                <div className="font-semibold text-sm">
                                                                                    {(() => {
                                                                                        const grade = parseFloat(submission.grade);
                                                                                        const attendance = submission.attendancePercentage;
                                                                                        const overall = Math.round((grade / assignment.maxGrade * 0.7 + attendance / 100 * 0.3) * 100);
                                                                                        return `${overall}%`;
                                                                                    })()}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    Combined Score
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">-</span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="max-w-xs">
                                                                        {submission.feedback ? (
                                                                            <div className="text-sm" title={submission.feedback}>
                                                                                {submission.feedback.length > 50 ? 
                                                                                    `${submission.feedback.substring(0, 50)}...` : 
                                                                                    submission.feedback
                                                                                }
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">No feedback</span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                
                                                {/* Summary Statistics */}
                                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                                    <h5 className="font-semibold mb-3">Assignment Summary</h5>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground">Average Grade</div>
                                                            <div className="font-semibold">
                                                                {(() => {
                                                                    const gradedSubmissions = assignment.submissions.filter(s => s.hasSubmitted && s.grade !== 'Not graded');
                                                                    if (gradedSubmissions.length === 0) return 'N/A';
                                                                    const avg = gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.grade), 0) / gradedSubmissions.length;
                                                                    return `${avg.toFixed(1)}/${assignment.maxGrade}`;
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Average Attendance</div>
                                                            <div className="font-semibold">
                                                                {(() => {
                                                                    const avg = assignment.submissions.reduce((sum, s) => sum + s.attendancePercentage, 0) / assignment.submissions.length;
                                                                    return `${avg.toFixed(1)}%`;
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Submitted</div>
                                                            <div className="font-semibold">
                                                                {assignment.submissions.filter(s => s.hasSubmitted).length}/{assignment.submissions.length}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Not Submitted</div>
                                                            <div className="font-semibold">
                                                                {assignment.submissions.filter(s => !s.hasSubmitted).length}/{assignment.submissions.length}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t">
                                                        <div>
                                                            <div className="text-muted-foreground">Reviewed</div>
                                                            <div className="font-semibold">
                                                                {assignment.submissions.filter(s => s.status === 'Reviewed').length}/{assignment.submissions.filter(s => s.hasSubmitted).length || 0}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Needs Revision</div>
                                                            <div className="font-semibold">
                                                                {assignment.submissions.filter(s => s.status === 'NeedsRevision').length}/{assignment.submissions.filter(s => s.hasSubmitted).length || 0}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Pending Review</div>
                                                            <div className="font-semibold">
                                                                {assignment.submissions.filter(s => s.hasSubmitted && s.status === 'Submitted').length}/{assignment.submissions.filter(s => s.hasSubmitted).length || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-16">
                            <CardContent>
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold">No Data Available</h3>
                                <p className="text-muted-foreground mt-2">
                                    Select a course and weekly roadmap to view assignments and student performance.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
            
            {/* Course Rejection Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent>
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
                        <Button size="sm" variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button 
                            size="sm"
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={!!isProcessingId || !rejectionReason.trim()}
                        >
                            {isProcessingId === selectedCourse?._id ? 
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 
                                <X className="mr-2 h-4 w-4" />
                            }
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Roadmap Rejection Modal */}
            <Dialog open={isRoadmapRejectModalOpen} onOpenChange={setRoadmapRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Reject Roadmap: {selectedRoadmap && allRoadmaps.find(r => r._id === selectedRoadmap) ? 
                                `Week ${allRoadmaps.find(r => r._id === selectedRoadmap)?.weekNumber} - ${allRoadmaps.find(r => r._id === selectedRoadmap)?.title}` : 
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
                        <Button size="sm" variant="outline" onClick={() => setRoadmapRejectModalOpen(false)}>Cancel</Button>
                        <Button 
                            size="sm"
                            variant="destructive" 
                            onClick={handleRejectRoadmap} 
                            disabled={!!isProcessingRoadmapId || !roadmapRejectionReason.trim()}
                        >
                            {isProcessingRoadmapId === selectedRoadmap ? 
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