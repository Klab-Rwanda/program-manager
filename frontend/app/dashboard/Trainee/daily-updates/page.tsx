"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    Loader2, Calendar, Clock, CheckCircle, Edit2, Send, BookOpen,
    AlertCircle, Lightbulb, Wrench, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    createDailyUpdate,
    updateDailyUpdate,
    getMyDailyUpdates,
    getTodayUpdate
} from "@/lib/services/dailyUpdate.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { DailyUpdate, Program } from "@/types";

export default function TraineeDailyUpdatesPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>("");
    const [todayUpdate, setTodayUpdate] = useState<DailyUpdate | null>(null);
    const [pastUpdates, setPastUpdates] = useState<DailyUpdate[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [workDone, setWorkDone] = useState("");
    const [challenges, setChallenges] = useState("");
    const [learnings, setLearnings] = useState("");

    // Get today's date formatted
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fetchPrograms = useCallback(async () => {
        try {
            const programs = await getAllPrograms();
            // Filter only active programs the trainee is enrolled in
            const activePrograms = programs.filter(p => p.status === 'Active');
            setMyPrograms(activePrograms);
            if (activePrograms.length > 0 && !selectedProgram) {
                setSelectedProgram(activePrograms[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch programs:", err);
            toast.error("Failed to load programs");
        }
    }, [selectedProgram]);

    const fetchTodayUpdate = useCallback(async (programId: string) => {
        try {
            const update = await getTodayUpdate(programId);
            setTodayUpdate(update);
            if (update) {
                setWorkDone(update.workDone);
                setChallenges(update.challenges || "");
                setLearnings(update.learnings || "");
                setIsEditing(false);
            } else {
                // Clear form for new entry
                setWorkDone("");
                setChallenges("");
                setLearnings("");
                setIsEditing(true);
            }
        } catch (err) {
            console.error("Failed to fetch today's update:", err);
        }
    }, []);

    const fetchPastUpdates = useCallback(async (programId: string) => {
        try {
            const updates = await getMyDailyUpdates({ program: programId, limit: 30 });
            // Filter out today's update from the list
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const past = updates.filter(u => new Date(u.date) < todayStart);
            setPastUpdates(past);
        } catch (err) {
            console.error("Failed to fetch past updates:", err);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchPrograms();
            setLoading(false);
        };
        init();
    }, [fetchPrograms]);

    useEffect(() => {
        if (selectedProgram) {
            fetchTodayUpdate(selectedProgram);
            fetchPastUpdates(selectedProgram);
        }
    }, [selectedProgram, fetchTodayUpdate, fetchPastUpdates]);

    const handleSubmit = async () => {
        if (!workDone.trim()) {
            toast.error("Please describe what you worked on today");
            return;
        }

        if (!selectedProgram) {
            toast.error("Please select a program");
            return;
        }

        setSubmitting(true);
        try {
            if (todayUpdate && todayUpdate.isEditable) {
                // Update existing
                const updated = await updateDailyUpdate(todayUpdate._id, {
                    workDone,
                    challenges,
                    learnings
                });
                setTodayUpdate({ ...updated, isEditable: todayUpdate.isEditable });
                toast.success("Daily update updated successfully!");
            } else {
                // Create new
                const created = await createDailyUpdate({
                    program: selectedProgram,
                    workDone,
                    challenges,
                    learnings
                });
                setTodayUpdate(created);
                toast.success("Daily update submitted successfully!");
            }
            setIsEditing(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit update");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = () => {
        if (todayUpdate && !todayUpdate.isEditable) {
            toast.error("This update can no longer be edited (24 hours have passed)");
            return;
        }
        setIsEditing(true);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (myPrograms.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You are not enrolled in any active programs. Please contact your program manager.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Daily Updates</h1>
                    <p className="text-muted-foreground">Record what you worked on, challenges faced, and what you learned.</p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{today}</span>
                </div>
            </div>

            {/* Program Selector */}
            {myPrograms.length > 1 && (
                <Card>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="program-select" className="whitespace-nowrap">Select Program:</Label>
                            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                                <SelectTrigger id="program-select" className="w-[300px]">
                                    <SelectValue placeholder="Select a program" />
                                </SelectTrigger>
                                <SelectContent>
                                    {myPrograms.map(program => (
                                        <SelectItem key={program._id} value={program._id}>
                                            {program.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Today's Update Form */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle>Today&apos;s Update</CardTitle>
                                <CardDescription>
                                    {myPrograms.find(p => p._id === selectedProgram)?.name || 'Select a program'}
                                </CardDescription>
                            </div>
                        </div>
                        {todayUpdate && (
                            <div className="flex items-center gap-2">
                                {todayUpdate.isReviewed ? (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="mr-1 h-3 w-3" />Reviewed
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        <Clock className="mr-1 h-3 w-3" />Pending Review
                                    </Badge>
                                )}
                                {todayUpdate.isEditable ? (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                        <Edit2 className="mr-1 h-3 w-3" />Editable
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500">
                                        <Lock className="mr-1 h-3 w-3" />Locked
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Work Done - Required */}
                    <div className="space-y-2">
                        <Label htmlFor="work-done" className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-blue-500" />
                            What did you work on today? <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="work-done"
                            value={workDone}
                            onChange={(e) => setWorkDone(e.target.value)}
                            placeholder="Describe the tasks, projects, or activities you worked on today..."
                            rows={3}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-muted" : ""}
                            maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground text-right">{workDone.length}/1000</p>
                    </div>

                    {/* Challenges - Optional */}
                    <div className="space-y-2">
                        <Label htmlFor="challenges" className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            What challenges did you face? <span className="text-muted-foreground text-sm">(optional)</span>
                        </Label>
                        <Textarea
                            id="challenges"
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                            placeholder="Describe any obstacles, blockers, or difficulties you encountered..."
                            rows={2}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-muted" : ""}
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-right">{challenges.length}/500</p>
                    </div>

                    {/* Learnings - Optional */}
                    <div className="space-y-2">
                        <Label htmlFor="learnings" className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            What did you learn? <span className="text-muted-foreground text-sm">(optional)</span>
                        </Label>
                        <Textarea
                            id="learnings"
                            value={learnings}
                            onChange={(e) => setLearnings(e.target.value)}
                            placeholder="Share any new skills, concepts, or insights you gained today..."
                            rows={2}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-muted" : ""}
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-right">{learnings.length}/500</p>
                    </div>

                    {/* Review Comment */}
                    {todayUpdate?.reviewComment && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Reviewer Comment:</strong> {todayUpdate.reviewComment}
                                {todayUpdate.reviewedBy && (
                                    <span className="text-muted-foreground ml-2">
                                        - {todayUpdate.reviewedBy.name}
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        {isEditing ? (
                            <>
                                {todayUpdate && (
                                    <Button variant="outline" onClick={() => {
                                        setWorkDone(todayUpdate.workDone);
                                        setChallenges(todayUpdate.challenges || "");
                                        setLearnings(todayUpdate.learnings || "");
                                        setIsEditing(false);
                                    }}>
                                        Cancel
                                    </Button>
                                )}
                                <Button onClick={handleSubmit} disabled={submitting || !workDone.trim()}>
                                    {submitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    {todayUpdate ? 'Update' : 'Submit'} Daily Update
                                </Button>
                            </>
                        ) : (
                            todayUpdate && todayUpdate.isEditable && (
                                <Button variant="outline" onClick={handleEdit}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit Update
                                </Button>
                            )
                        )}
                    </div>

                    {/* Info about editing lock */}
                    {!todayUpdate && (
                        <p className="text-xs text-muted-foreground text-center">
                            Note: You can edit your update within 24 hours of submission.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Past Updates */}
            {pastUpdates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Past Updates</CardTitle>
                        <CardDescription>Your previous daily updates for this program</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {pastUpdates.map((update) => (
                                <AccordionItem key={update._id} value={update._id}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{formatDate(update.date)}</span>
                                            {update.isReviewed ? (
                                                <Badge variant="secondary" className="text-xs">
                                                    <CheckCircle className="mr-1 h-3 w-3" />Reviewed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs">Pending</Badge>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-2">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600 flex items-center gap-1">
                                                <Wrench className="h-3 w-3" /> What I worked on:
                                            </p>
                                            <p className="text-sm text-muted-foreground ml-4">{update.workDone}</p>
                                        </div>
                                        {update.challenges && (
                                            <div>
                                                <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Challenges:
                                                </p>
                                                <p className="text-sm text-muted-foreground ml-4">{update.challenges}</p>
                                            </div>
                                        )}
                                        {update.learnings && (
                                            <div>
                                                <p className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                                                    <Lightbulb className="h-3 w-3" /> What I learned:
                                                </p>
                                                <p className="text-sm text-muted-foreground ml-4">{update.learnings}</p>
                                            </div>
                                        )}
                                        {update.reviewComment && (
                                            <Alert className="mt-2">
                                                <AlertDescription className="text-sm">
                                                    <strong>Reviewer:</strong> {update.reviewComment}
                                                    {update.reviewedBy && (
                                                        <span className="text-muted-foreground ml-1">
                                                            - {update.reviewedBy.name}
                                                        </span>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
