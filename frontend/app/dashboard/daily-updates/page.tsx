"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
    Loader2, Calendar, Search, Filter, CheckCircle, Clock, Eye, MessageSquare,
    RefreshCw, Users, ChevronLeft, ChevronRight, Wrench, AlertCircle, Lightbulb,
    UserCheck, UserX, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getAllDailyUpdates,
    reviewDailyUpdate,
    getTraineesForProgram,
    getTodaySubmissionStatus,
    TodaySubmissionStatusResponse,
    exportDailyUpdates
} from "@/lib/services/dailyUpdate.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { DailyUpdate, DailyUpdatesResponse, Program } from "@/types";
import { useAuth } from "@/lib/contexts/RoleContext";

export default function DailyUpdatesViewPage() {
    const { loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [trainees, setTrainees] = useState<{ _id: string; name: string; email: string }[]>([]);
    const [updatesData, setUpdatesData] = useState<DailyUpdatesResponse>({
        updates: [],
        total: 0,
        page: 1,
        totalPages: 0
    });

    // Today's status state
    const [todayStatus, setTodayStatus] = useState<TodaySubmissionStatusResponse | null>(null);
    const [loadingTodayStatus, setLoadingTodayStatus] = useState(false);
    const [statusProgram, setStatusProgram] = useState<string>("");

    // Active tab
    const [activeTab, setActiveTab] = useState("today-status");

    // Filters
    const [selectedProgram, setSelectedProgram] = useState<string>("all");
    const [selectedTrainee, setSelectedTrainee] = useState<string>("all");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [reviewFilter, setReviewFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // View/Review modal state
    const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [reviewComment, setReviewComment] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);

    // Export state
    const [isExporting, setIsExporting] = useState(false);
    const [exportStartDate, setExportStartDate] = useState<string>("");
    const [exportEndDate, setExportEndDate] = useState<string>("");
    const [exportProgram, setExportProgram] = useState<string>("all");
    const [isExportModalOpen, setExportModalOpen] = useState(false);

    // Today's date formatted
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fetchPrograms = useCallback(async () => {
        try {
            const programs = await getAllPrograms();
            setMyPrograms(programs);
            // Set first active program for today's status
            const activePrograms = programs.filter(p => p.status === 'Active');
            if (activePrograms.length > 0 && !statusProgram) {
                setStatusProgram(activePrograms[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch programs:", err);
        }
    }, [statusProgram]);

    const fetchTrainees = useCallback(async (programId: string) => {
        if (programId === "all") {
            setTrainees([]);
            return;
        }
        try {
            const traineeList = await getTraineesForProgram(programId);
            setTrainees(traineeList);
        } catch (err) {
            console.error("Failed to fetch trainees:", err);
        }
    }, []);

    const fetchTodayStatus = useCallback(async (programId: string) => {
        if (!programId) return;
        setLoadingTodayStatus(true);
        try {
            const data = await getTodaySubmissionStatus(programId);
            setTodayStatus(data);
        } catch (err: any) {
            console.error("Failed to fetch today's status:", err);
            toast.error(err.response?.data?.message || "Failed to load today's status");
        } finally {
            setLoadingTodayStatus(false);
        }
    }, []);

    const fetchUpdates = useCallback(async (page = 1) => {
        setRefreshing(true);
        try {
            const params: any = {
                page,
                limit: pageSize
            };

            if (selectedProgram !== "all") params.program = selectedProgram;
            if (selectedTrainee !== "all") params.trainee = selectedTrainee;
            if (selectedDate) params.startDate = selectedDate;
            if (selectedDate) params.endDate = selectedDate;
            if (reviewFilter !== "all") params.isReviewed = reviewFilter;

            const data = await getAllDailyUpdates(params);
            setUpdatesData(data);
            setCurrentPage(page);
        } catch (err: any) {
            console.error("Failed to fetch updates:", err);
            toast.error(err.response?.data?.message || "Failed to load daily updates");
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, [selectedProgram, selectedTrainee, selectedDate, reviewFilter]);

    useEffect(() => {
        if (!authLoading) {
            fetchPrograms();
        }
    }, [authLoading, fetchPrograms]);

    useEffect(() => {
        if (!authLoading && myPrograms.length >= 0) {
            fetchUpdates(1);
        }
    }, [authLoading, myPrograms, fetchUpdates]);

    useEffect(() => {
        fetchTrainees(selectedProgram);
        setSelectedTrainee("all");
    }, [selectedProgram, fetchTrainees]);

    useEffect(() => {
        if (statusProgram) {
            fetchTodayStatus(statusProgram);
        }
    }, [statusProgram, fetchTodayStatus]);

    // Client-side search filter
    const filteredUpdates = useMemo(() => {
        if (!searchTerm) return updatesData.updates;
        const term = searchTerm.toLowerCase();
        return updatesData.updates.filter(update =>
            update.trainee?.name?.toLowerCase().includes(term) ||
            update.workDone?.toLowerCase().includes(term) ||
            update.challenges?.toLowerCase().includes(term) ||
            update.learnings?.toLowerCase().includes(term)
        );
    }, [updatesData.updates, searchTerm]);

    const handleViewUpdate = (update: DailyUpdate) => {
        setSelectedUpdate(update);
        setReviewComment(update.reviewComment || "");
        setViewModalOpen(true);
    };

    const handleReview = async () => {
        if (!selectedUpdate) return;

        setIsReviewing(true);
        try {
            await reviewDailyUpdate(selectedUpdate._id, reviewComment);
            toast.success("Update marked as reviewed");
            setViewModalOpen(false);
            fetchUpdates(currentPage);
            if (statusProgram) fetchTodayStatus(statusProgram);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to review update");
        } finally {
            setIsReviewing(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const clearFilters = () => {
        setSelectedProgram("all");
        setSelectedTrainee("all");
        setSelectedDate("");
        setReviewFilter("all");
        setSearchTerm("");
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params: { program?: string; startDate?: string; endDate?: string } = {};
            if (exportProgram !== "all") params.program = exportProgram;
            if (exportStartDate) params.startDate = exportStartDate;
            if (exportEndDate) params.endDate = exportEndDate;

            await exportDailyUpdates(params);
            toast.success("Daily updates exported successfully!");
            setExportModalOpen(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to export daily updates");
        } finally {
            setIsExporting(false);
        }
    };

    // Stats
    const totalUpdates = updatesData.total;
    const reviewedCount = updatesData.updates.filter(u => u.isReviewed).length;
    const pendingCount = updatesData.updates.filter(u => !u.isReviewed).length;

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading daily updates...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Daily Updates</h1>
                    <p className="text-muted-foreground">View and review trainee daily progress updates.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => setExportModalOpen(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{today}</span>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="today-status">
                        <Users className="mr-2 h-4 w-4" />
                        Today&apos;s Status
                    </TabsTrigger>
                    <TabsTrigger value="all-updates">
                        <Calendar className="mr-2 h-4 w-4" />
                        All Updates
                    </TabsTrigger>
                </TabsList>

                {/* Today's Status Tab */}
                <TabsContent value="today-status" className="space-y-4">
                    {/* Program Selector for Today's Status */}
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <Label htmlFor="status-program" className="whitespace-nowrap">Select Program:</Label>
                                <Select value={statusProgram} onValueChange={setStatusProgram}>
                                    <SelectTrigger id="status-program" className="w-[300px]">
                                        <SelectValue placeholder="Select a program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myPrograms.filter(p => p.status === 'Active').map(program => (
                                            <SelectItem key={program._id} value={program._id}>
                                                {program.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchTodayStatus(statusProgram)}
                                    disabled={loadingTodayStatus || !statusProgram}
                                >
                                    {loadingTodayStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {loadingTodayStatus ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : todayStatus ? (
                        <>
                            {/* Stats Cards */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="text-2xl font-bold">{todayStatus.totalTrainees}</div>
                                        <p className="text-xs text-muted-foreground">Total Trainees</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-red-200 bg-red-50/30">
                                    <CardContent className="pt-4">
                                        <div className="text-2xl font-bold text-red-600">{todayStatus.notSubmittedCount}</div>
                                        <p className="text-xs text-muted-foreground">Not Submitted</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-green-200 bg-green-50/30">
                                    <CardContent className="pt-4">
                                        <div className="text-2xl font-bold text-green-600">{todayStatus.submittedCount}</div>
                                        <p className="text-xs text-muted-foreground">Submitted</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Trainees Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        {todayStatus.program.name} - Today&apos;s Submissions
                                    </CardTitle>
                                    <CardDescription>
                                        {todayStatus.notSubmittedCount > 0 ? (
                                            <span className="text-red-600 font-medium">
                                                {todayStatus.notSubmittedCount} trainee{todayStatus.notSubmittedCount !== 1 ? 's' : ''} haven&apos;t submitted yet
                                            </span>
                                        ) : (
                                            <span className="text-green-600 font-medium">All trainees have submitted!</span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Trainee</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Submitted At</TableHead>
                                                <TableHead>Review Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {todayStatus.trainees.map((item) => (
                                                <TableRow
                                                    key={item.trainee._id}
                                                    className={!item.hasSubmitted ? "bg-red-50/50" : ""}
                                                >
                                                    <TableCell>
                                                        {item.hasSubmitted ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                                <UserCheck className="mr-1 h-3 w-3" />
                                                                Submitted
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive">
                                                                <UserX className="mr-1 h-3 w-3" />
                                                                Not Submitted
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{item.trainee.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{item.trainee.email}</TableCell>
                                                    <TableCell>
                                                        {item.update ? formatTime(item.update.createdAt) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.update ? (
                                                            item.update.isReviewed ? (
                                                                <Badge variant="secondary">
                                                                    <CheckCircle className="mr-1 h-3 w-3" />Reviewed
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                                                                    <Clock className="mr-1 h-3 w-3" />Pending
                                                                </Badge>
                                                            )
                                                        ) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-10">
                                <div className="text-center">
                                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-muted-foreground">Select a program to view today&apos;s submission status.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* All Updates Tab */}
                <TabsContent value="all-updates" className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold">{totalUpdates}</div>
                                <p className="text-xs text-muted-foreground">Total Updates</p>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-md" onClick={() => setReviewFilter("false")}>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                                <p className="text-xs text-muted-foreground">Pending Review (this page)</p>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-md" onClick={() => setReviewFilter("true")}>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold text-green-600">{reviewedCount}</div>
                                <p className="text-xs text-muted-foreground">Reviewed (this page)</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardContent className="py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Search */}
                                <div className="lg:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search updates..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Program Filter */}
                                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Programs" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Programs</SelectItem>
                                        {myPrograms.map(program => (
                                            <SelectItem key={program._id} value={program._id}>
                                                {program.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Trainee Filter */}
                                <Select value={selectedTrainee} onValueChange={setSelectedTrainee} disabled={selectedProgram === "all"}>
                                    <SelectTrigger>
                                        <Users className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="All Trainees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Trainees</SelectItem>
                                        {trainees.map(trainee => (
                                            <SelectItem key={trainee._id} value={trainee._id}>
                                                {trainee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Date Filter */}
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Second row of filters */}
                            <div className="flex flex-wrap gap-4 mt-4 items-center">
                                {/* Review Status Filter */}
                                <Select value={reviewFilter} onValueChange={setReviewFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Review Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="false">Pending Review</SelectItem>
                                        <SelectItem value="true">Reviewed</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Clear Filters */}
                                {(selectedProgram !== "all" || selectedTrainee !== "all" || selectedDate || reviewFilter !== "all" || searchTerm) && (
                                    <Button variant="outline" size="sm" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                )}

                                <Button onClick={() => fetchUpdates(currentPage)} variant="outline" size="sm" disabled={refreshing} className="ml-auto">
                                    {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Updates Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Updates</CardTitle>
                            <CardDescription>
                                Showing {filteredUpdates.length} of {updatesData.total} updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredUpdates.length === 0 ? (
                                <div className="text-center py-10">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-muted-foreground">No daily updates found matching your criteria.</p>
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Trainee</TableHead>
                                                <TableHead>Program</TableHead>
                                                <TableHead>Work Summary</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUpdates.map((update) => (
                                                <TableRow key={update._id} className={!update.isReviewed ? "bg-yellow-50/30" : ""}>
                                                    <TableCell className="font-medium">
                                                        <div>{formatDate(update.date)}</div>
                                                        <div className="text-xs text-muted-foreground">{formatTime(update.createdAt)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{update.trainee?.name || 'N/A'}</div>
                                                        <div className="text-xs text-muted-foreground">{update.trainee?.email}</div>
                                                    </TableCell>
                                                    <TableCell>{update.program?.name || 'N/A'}</TableCell>
                                                    <TableCell className="max-w-[300px]">
                                                        <p className="truncate text-sm">{update.workDone}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        {update.isReviewed ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                                <CheckCircle className="mr-1 h-3 w-3" />Reviewed
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                                                                <Clock className="mr-1 h-3 w-3" />Pending
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="outline" onClick={() => handleViewUpdate(update)}>
                                                            <Eye className="mr-1 h-4 w-4" />
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    {updatesData.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                Page {currentPage} of {updatesData.totalPages}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fetchUpdates(currentPage - 1)}
                                                    disabled={currentPage === 1 || refreshing}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fetchUpdates(currentPage + 1)}
                                                    disabled={currentPage === updatesData.totalPages || refreshing}
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* View/Review Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Daily Update Details</DialogTitle>
                        <DialogDescription>
                            {selectedUpdate && (
                                <>
                                    {selectedUpdate.trainee?.name} • {formatDate(selectedUpdate.date)}
                                    {selectedUpdate.program && ` • ${selectedUpdate.program.name}`}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUpdate && (
                        <div className="space-y-4 py-4">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <strong>Status:</strong>
                                {selectedUpdate.isReviewed ? (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="mr-1 h-3 w-3" />Reviewed
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                                        <Clock className="mr-1 h-3 w-3" />Pending Review
                                    </Badge>
                                )}
                            </div>

                            {/* Work Done */}
                            <Card className="bg-blue-50/50 border-blue-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                                        <Wrench className="h-4 w-4" />
                                        What they worked on
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{selectedUpdate.workDone}</p>
                                </CardContent>
                            </Card>

                            {/* Challenges */}
                            {selectedUpdate.challenges && (
                                <Card className="bg-orange-50/50 border-orange-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                                            <AlertCircle className="h-4 w-4" />
                                            Challenges faced
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{selectedUpdate.challenges}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Learnings */}
                            {selectedUpdate.learnings && (
                                <Card className="bg-yellow-50/50 border-yellow-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                                            <Lightbulb className="h-4 w-4" />
                                            What they learned
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{selectedUpdate.learnings}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Review Comment */}
                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="review-comment" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Review Comment (optional)
                                </Label>
                                <Textarea
                                    id="review-comment"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Add feedback or acknowledgment for the trainee..."
                                    rows={3}
                                    disabled={selectedUpdate.isReviewed}
                                    className={selectedUpdate.isReviewed ? "bg-muted" : ""}
                                />
                                {selectedUpdate.isReviewed && selectedUpdate.reviewedBy && (
                                    <p className="text-xs text-muted-foreground">
                                        Reviewed by {selectedUpdate.reviewedBy.name} on {formatDate(selectedUpdate.reviewedAt || '')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                            Close
                        </Button>
                        {selectedUpdate && !selectedUpdate.isReviewed && (
                            <Button onClick={handleReview} disabled={isReviewing}>
                                {isReviewing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Mark as Reviewed
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Modal */}
            <Dialog open={isExportModalOpen} onOpenChange={setExportModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Export Daily Updates
                        </DialogTitle>
                        <DialogDescription>
                            Export trainee daily updates to a CSV file. You can filter by program and date range.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Program Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="export-program">Program</Label>
                            <Select value={exportProgram} onValueChange={setExportProgram}>
                                <SelectTrigger id="export-program">
                                    <SelectValue placeholder="All Programs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Programs</SelectItem>
                                    {myPrograms.map(program => (
                                        <SelectItem key={program._id} value={program._id}>
                                            {program.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="export-start-date">Start Date</Label>
                                <Input
                                    id="export-start-date"
                                    type="date"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="export-end-date">End Date</Label>
                                <Input
                                    id="export-end-date"
                                    type="date"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Leave dates empty to export all available updates.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            {isExporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Export to CSV
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
