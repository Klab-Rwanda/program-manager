"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Loader2, Plus, Megaphone, AlertTriangle, Bell, Clock, Users, Mail, Trash2, Eye,
    CheckCircle, Filter, Search
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/contexts/RoleContext";
import { getMyAnnouncements, createAnnouncement, markAnnouncementAsRead, deleteAnnouncement } from "@/lib/services/announcement.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Announcement, Program } from "@/types";

export default function AnnouncementsPage() {
    const { user, role } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState<string>("all");

    const canCreate = role === 'program_manager' || role === 'facilitator' || role === 'evaluator';

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        program: "",
        priority: "normal" as 'low' | 'normal' | 'high' | 'urgent',
        targetAudience: "all" as 'all' | 'trainees' | 'facilitators',
        sendEmail: false,
        expiresAt: ""
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [announcementsData, programsData] = await Promise.all([
                getMyAnnouncements(),
                canCreate ? getAllPrograms() : Promise.resolve([])
            ]);
            setAnnouncements(announcementsData);
            setPrograms(programsData.filter((p: Program) => p.status === 'Active'));
        } catch (err) {
            toast.error("Failed to load announcements.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [canCreate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = () => {
        setFormData({
            title: "",
            content: "",
            program: "",
            priority: "normal",
            targetAudience: "all",
            sendEmail: false,
            expiresAt: ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content || !formData.program) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createAnnouncement({
                title: formData.title,
                content: formData.content,
                program: formData.program,
                priority: formData.priority,
                targetAudience: formData.targetAudience,
                sendEmail: formData.sendEmail,
                expiresAt: formData.expiresAt || undefined
            });
            toast.success("Announcement created successfully!");
            setIsModalOpen(false);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Failed to create announcement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkAsRead = async (announcement: Announcement) => {
        if (announcement.isRead) return;
        try {
            await markAnnouncementAsRead(announcement._id);
            setAnnouncements(prev =>
                prev.map(a => a._id === announcement._id ? { ...a, isRead: true } : a)
            );
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const handleDelete = async (announcementId: string) => {
        toast("Are you sure?", {
            description: "This will delete the announcement.",
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await deleteAnnouncement(announcementId);
                        toast.success("Announcement deleted.");
                        fetchData();
                    } catch (err) {
                        toast.error("Failed to delete announcement.");
                    }
                }
            }
        });
    };

    const handleViewAnnouncement = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        handleMarkAsRead(announcement);
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Urgent</Badge>;
            case 'high':
                return <Badge className="bg-orange-500 hover:bg-orange-500"><Bell className="mr-1 h-3 w-3" />High</Badge>;
            case 'low':
                return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Low</Badge>;
            default:
                return <Badge variant="outline">Normal</Badge>;
        }
    };

    const getAudienceBadge = (audience: string) => {
        switch (audience) {
            case 'trainees':
                return <Badge variant="outline" className="text-xs"><Users className="mr-1 h-3 w-3" />Trainees</Badge>;
            case 'facilitators':
                return <Badge variant="outline" className="text-xs"><Users className="mr-1 h-3 w-3" />Facilitators</Badge>;
            default:
                return <Badge variant="outline" className="text-xs"><Users className="mr-1 h-3 w-3" />Everyone</Badge>;
        }
    };

    const filteredAnnouncements = announcements.filter(ann => {
        const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ann.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ann.program.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = filterPriority === "all" || ann.priority === filterPriority;
        return matchesSearch && matchesPriority;
    });

    const unreadCount = announcements.filter(a => !a.isRead).length;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Megaphone className="h-8 w-8" />
                        Announcements
                    </h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0 ? `You have ${unreadCount} unread announcement${unreadCount > 1 ? 's' : ''}` : 'Stay updated with program announcements'}
                    </p>
                </div>
                {canCreate && (
                    <Button onClick={handleOpenModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Announcement
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search announcements..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Announcements List */}
            {filteredAnnouncements.length === 0 ? (
                <Card>
                    <CardContent className="py-10">
                        <p className="text-center text-muted-foreground">No announcements found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredAnnouncements.map(announcement => (
                        <Card
                            key={announcement._id}
                            className={`cursor-pointer transition-all hover:shadow-md ${!announcement.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}
                            onClick={() => handleViewAnnouncement(announcement)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {!announcement.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            )}
                                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                                            {getPriorityBadge(announcement.priority)}
                                            {getAudienceBadge(announcement.targetAudience)}
                                        </div>
                                        <CardDescription className="mt-1">
                                            {announcement.program.name} | By {announcement.author.name} | {formatDate(announcement.createdAt)}
                                        </CardDescription>
                                    </div>
                                    {announcement.emailSent && (
                                        <Badge variant="outline" className="text-xs">
                                            <Mail className="mr-1 h-3 w-3" />Emailed
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {announcement.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* View Announcement Dialog */}
            <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2 flex-wrap">
                            <DialogTitle className="text-xl">{selectedAnnouncement?.title}</DialogTitle>
                            {selectedAnnouncement && getPriorityBadge(selectedAnnouncement.priority)}
                        </div>
                        <DialogDescription>
                            {selectedAnnouncement?.program.name} | Posted by {selectedAnnouncement?.author.name} | {selectedAnnouncement && formatDate(selectedAnnouncement.createdAt)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                            {selectedAnnouncement?.content}
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                        <div className="flex gap-2">
                            {selectedAnnouncement && canCreate && selectedAnnouncement.author._id === user?._id && (
                                <Button variant="destructive" size="sm" onClick={() => {
                                    handleDelete(selectedAnnouncement._id);
                                    setSelectedAnnouncement(null);
                                }}>
                                    <Trash2 className="mr-2 h-4 w-4" />Delete
                                </Button>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setSelectedAnnouncement(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Announcement Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Create Announcement</DialogTitle>
                        <DialogDescription>Send an announcement to program participants.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="program">Program *</Label>
                            <Select value={formData.program} onValueChange={(v) => setFormData(f => ({ ...f, program: v }))} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a program" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                                placeholder="Announcement title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content *</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData(f => ({ ...f, content: e.target.value }))}
                                placeholder="Write your announcement..."
                                rows={5}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={formData.priority} onValueChange={(v: 'low' | 'normal' | 'high' | 'urgent') => setFormData(f => ({ ...f, priority: v }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <Select value={formData.targetAudience} onValueChange={(v: 'all' | 'trainees' | 'facilitators') => setFormData(f => ({ ...f, targetAudience: v }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Everyone</SelectItem>
                                        <SelectItem value="trainees">Trainees Only</SelectItem>
                                        <SelectItem value="facilitators">Facilitators Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Expiration Date (Optional)</Label>
                            <Input
                                type="datetime-local"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData(f => ({ ...f, expiresAt: e.target.value }))}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sendEmail"
                                checked={formData.sendEmail}
                                onCheckedChange={(checked) => setFormData(f => ({ ...f, sendEmail: !!checked }))}
                            />
                            <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
                                Also send via email to all recipients
                            </Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Announcement
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
