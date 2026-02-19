"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
    Loader2, Calendar, Clock, CheckCircle, Edit2, Building2,
    FolderOpen, ArrowLeft, FileText, Plus, Trash2, Crown, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    getMyProjects,
    getProjectTasks,
    updateTaskCompletion,
    createTask,
    deleteTask as deleteTaskApi,
    updateTask
} from "@/lib/services/project.service";
import { Project, ProjectTask, CreateTaskData } from "@/types";
import { useAuth } from "@/lib/contexts/RoleContext";

export default function TraineeProjectsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Tasks
    const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
    const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>("all");

    // Task creation (for team lead)
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");
    const [newTaskDueDate, setNewTaskDueDate] = useState("");
    const [creatingTask, setCreatingTask] = useState(false);

    // Task detail view
    const [viewingTask, setViewingTask] = useState<ProjectTask | null>(null);
    const [viewProgress, setViewProgress] = useState(0);
    const [savingProgress, setSavingProgress] = useState(false);

    // Task editing
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
    const [editTaskForm, setEditTaskForm] = useState({ title: "", description: "", assignedTo: "", dueDate: "" });
    const [isUpdatingTask, setIsUpdatingTask] = useState(false);

    // Task comment
    const [taskComment, setTaskComment] = useState("");

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const isTeamLead = selectedProject?.teamLead?._id === user?._id;

    const taskAssignees = useMemo(() => {
        const map = new Map<string, string>();
        projectTasks.forEach(t => { if (t.assignedTo) map.set(t.assignedTo._id, t.assignedTo.name); });
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [projectTasks]);

    const filteredTasks = useMemo(() => {
        if (taskAssigneeFilter === "all") return projectTasks;
        if (taskAssigneeFilter === "unassigned") return projectTasks.filter(t => !t.assignedTo);
        return projectTasks.filter(t => t.assignedTo?._id === taskAssigneeFilter);
    }, [projectTasks, taskAssigneeFilter]);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMyProjects();
            setProjects(data);
        } catch (err) {
            toast.error("Failed to load projects.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const fetchTasks = useCallback(async (projectId: string) => {
        try {
            const tasks = await getProjectTasks(projectId);
            setProjectTasks(tasks);
            // Keep viewingTask in sync
            setViewingTask(prev => prev ? tasks.find(t => t._id === prev._id) || null : null);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        }
    }, []);

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
        setProjectTasks([]);
        setTaskAssigneeFilter("all");
        fetchTasks(project._id);
    };

    const handleBackToList = () => {
        setSelectedProject(null);
        setProjectTasks([]);
        fetchProjects();
    };

    const handleTaskCompletionChange = async (taskId: string, value: number) => {
        // Optimistic update
        setProjectTasks(prev => prev.map(t => t._id === taskId ? { ...t, completionPercentage: value } : t));
        setViewingTask(prev => prev && prev._id === taskId ? { ...prev, completionPercentage: value } : prev);
        try {
            await updateTaskCompletion(taskId, value);
        } catch {
            toast.error("Failed to update task progress.");
            if (selectedProject) {
                fetchTasks(selectedProject._id);
            }
        }
    };

    const handleSaveProgress = async () => {
        if (!viewingTask) return;
        setSavingProgress(true);
        try {
            const updated = await updateTaskCompletion(
                viewingTask._id,
                viewProgress,
                taskComment.trim() || undefined
            );
            setProjectTasks(prev => prev.map(t => t._id === viewingTask._id ? updated : t));
            setViewingTask(updated);
            setTaskComment("");
            toast.success("Progress updated!");
        } catch {
            toast.error("Failed to update progress.");
        } finally {
            setSavingProgress(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim() || !selectedProject) return;
        setCreatingTask(true);
        try {
            await createTask(selectedProject._id, {
                title: newTaskTitle,
                description: newTaskDescription,
                assignedTo: newTaskAssignedTo || undefined,
                dueDate: newTaskDueDate || undefined
            });
            toast.success("Task created successfully!");
            setShowCreateTask(false);
            setNewTaskTitle("");
            setNewTaskDescription("");
            setNewTaskAssignedTo("");
            setNewTaskDueDate("");
            fetchTasks(selectedProject._id);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create task.");
        } finally {
            setCreatingTask(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!selectedProject) return;
        try {
            await deleteTaskApi(taskId);
            toast.success("Task deleted.");
            fetchTasks(selectedProject._id);
        } catch {
            toast.error("Failed to delete task.");
        }
    };

    const handleEditTask = (task: ProjectTask) => {
        setEditingTask(task);
        setEditTaskForm({
            title: task.title,
            description: task.description || "",
            assignedTo: task.assignedTo?._id || "",
            dueDate: task.dueDate ? task.dueDate.split("T")[0] : ""
        });
    };

    const handleUpdateTask = async () => {
        if (!editingTask || !editTaskForm.title.trim() || !selectedProject) return;
        setIsUpdatingTask(true);
        try {
            const data: Partial<CreateTaskData> = {
                title: editTaskForm.title.trim(),
                description: editTaskForm.description.trim() || undefined,
                dueDate: editTaskForm.dueDate || undefined
            };
            // Only team lead can reassign
            if (isTeamLead && editTaskForm.assignedTo !== (editingTask.assignedTo?._id || "")) {
                data.assignedTo = editTaskForm.assignedTo || undefined;
            }
            await updateTask(editingTask._id, data);
            toast.success("Task updated successfully!");
            setEditingTask(null);
            fetchTasks(selectedProject._id);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update task.");
        } finally {
            setIsUpdatingTask(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
            case 'completed':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
            case 'on_hold':
                return <Badge variant="secondary">On Hold</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading projects...</span>
            </div>
        );
    }

    // ==================== PROJECT LIST VIEW ====================
    if (!selectedProject) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
                    <p className="text-muted-foreground">View your assigned projects and track task progress.</p>
                </div>

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="py-10">
                            <div className="text-center">
                                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-muted-foreground">You are not assigned to any projects yet.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {projects.map(project => (
                            <Card
                                key={project._id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => handleSelectProject(project)}
                            >
                                <CardContent className="py-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="font-semibold text-lg">{project.title}</h3>
                                                {getStatusBadge(project.status)}
                                                {project.teamLead?._id === user?._id && (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                                                        <Crown className="mr-1 h-3 w-3" />Team Lead
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button size="sm" variant="outline">
                                                View Tasks
                                            </Button>
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FolderOpen className="h-3.5 w-3.5" />{project.program?.name}
                                            </span>
                                            {project.companyName && (
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3.5 w-3.5" />{project.companyName}
                                                </span>
                                            )}
                                            {project.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />Due: {new Date(project.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {(project.myTaskCount ?? 0) > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="h-3.5 w-3.5" />{project.myTaskCount} task{project.myTaskCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        {/* My progress */}
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">My progress:</span>
                                            <Progress value={project.myLatestCompletion || 0} className="flex-1 h-2" />
                                            <span className="text-sm font-medium w-12 text-right">{project.myLatestCompletion || 0}%</span>
                                        </div>
                                        {project.files && project.files.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{project.files.length} file{project.files.length !== 1 ? 's' : ''} attached</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ==================== PROJECT UPDATE VIEW ====================
    return (
        <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleBackToList}>
                        <ArrowLeft className="mr-1 h-4 w-4" />Back
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{selectedProject.title}</h1>
                            {isTeamLead && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600">
                                    <Crown className="mr-1 h-3 w-3" />Team Lead
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{selectedProject.program?.name}</span>
                            {selectedProject.companyName && (
                                <>
                                    <span>|</span>
                                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{selectedProject.companyName}</span>
                                </>
                            )}
                            {getStatusBadge(selectedProject.status)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{today}</span>
                </div>
            </div>

            {/* Project Details */}
            {(selectedProject.description || (selectedProject.files && selectedProject.files.length > 0)) && (
                <Card>
                    <CardContent className="py-4 space-y-2">
                        {selectedProject.description && (
                            <p className="text-sm">{selectedProject.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {selectedProject.companyContactPerson && (
                                <span>Contact: {selectedProject.companyContactPerson}{selectedProject.companyContactPhone ? ` (${selectedProject.companyContactPhone})` : ''}</span>
                            )}
                            {selectedProject.companyAddress && (
                                <span>Address: {selectedProject.companyAddress}</span>
                            )}
                            {selectedProject.startDate && (
                                <span>Started: {new Date(selectedProject.startDate).toLocaleDateString()}</span>
                            )}
                            {selectedProject.dueDate && (
                                <span>Due: {new Date(selectedProject.dueDate).toLocaleDateString()}</span>
                            )}
                        </div>
                        {selectedProject.files && selectedProject.files.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selectedProject.files.map((file, i) => (
                                    <Badge key={i} variant="outline" className="gap-1">
                                        <FileText className="h-3 w-3" />{file.fileName}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ==================== TASKS ==================== */}
            <div className="space-y-4">
                {/* Header row: filter + add task */}
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold">Tasks ({projectTasks.length})</h2>
                    {taskAssignees.length > 1 && (
                        <Select value={taskAssigneeFilter} onValueChange={setTaskAssigneeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Members</SelectItem>
                                {taskAssignees.map(a => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.id === user?._id ? `${a.name} (You)` : a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <div className="flex-1" />
                    {isTeamLead && (
                        <Button size="sm" onClick={() => setShowCreateTask(true)}>
                            <Plus className="mr-1 h-4 w-4" />Add Task
                        </Button>
                    )}
                </div>

                {filteredTasks.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-sm text-muted-foreground text-center">
                                {projectTasks.length === 0 ? "No tasks created yet." : "No tasks match the selected filter."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredTasks.map(task => {
                        const isMyTask = task.assignedTo?._id === user?._id;
                        return (
                            <Card
                                key={task._id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => { setViewingTask(task); setViewProgress(task.completionPercentage); setTaskComment(""); }}
                            >
                                <CardContent className="py-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{task.title}</h4>
                                            {isMyTask ? (
                                                <Badge className="bg-blue-100 text-blue-800 text-xs">You</Badge>
                                            ) : task.assignedTo ? (
                                                <Badge variant="outline" className="text-xs">{task.assignedTo.name}</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                                            )}
                                            {task.dueDate && (
                                                <span className="text-xs text-muted-foreground">
                                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {task.comments && task.comments.length > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MessageSquare className="h-3 w-3" />{task.comments.length}
                                                </span>
                                            )}
                                            <span className="text-sm font-bold text-primary">{task.completionPercentage}%</span>
                                        </div>
                                    </div>
                                    <Progress value={task.completionPercentage} className="h-2" />
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Create Task Dialog (Team Lead) */}
            <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Task Title *</Label>
                            <Input
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="e.g., Implement login page"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder="Task details..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Assign To</Label>
                            <Select value={newTaskAssignedTo} onValueChange={setNewTaskAssignedTo}>
                                <SelectTrigger><SelectValue placeholder="Select trainee" /></SelectTrigger>
                                <SelectContent>
                                    {selectedProject?.assignedTrainees.map(t => (
                                        <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date (optional)</Label>
                            <Input
                                type="date"
                                value={newTaskDueDate}
                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowCreateTask(false)}>Cancel</Button>
                        <Button onClick={handleCreateTask} disabled={creatingTask || !newTaskTitle.trim()}>
                            {creatingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task Detail Dialog */}
            {viewingTask && (() => {
                const isMyViewedTask = viewingTask.assignedTo?._id === user?._id;
                const canEdit = isTeamLead || isMyViewedTask;
                const canUpdateProgress = isTeamLead || isMyViewedTask;
                const progressChanged = viewProgress !== viewingTask.completionPercentage;
                const hasChanges = progressChanged || taskComment.trim().length > 0;
                return (
                    <Dialog open={!!viewingTask} onOpenChange={(open) => { if (!open) { setViewingTask(null); setTaskComment(""); } }}>
                        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{viewingTask.title}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 pt-1">
                                    <span>Assigned to:</span>
                                    {isMyViewedTask ? (
                                        <Badge className="bg-blue-100 text-blue-800 text-xs">You</Badge>
                                    ) : viewingTask.assignedTo ? (
                                        <Badge variant="outline" className="text-xs">{viewingTask.assignedTo.name}</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                                    )}
                                    {viewingTask.dueDate && (
                                        <>
                                            <span className="text-muted-foreground">|</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Due: {new Date(viewingTask.dueDate).toLocaleDateString()}
                                            </span>
                                        </>
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                {viewingTask.description ? (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Description</Label>
                                        <p className="text-sm whitespace-pre-wrap">{viewingTask.description}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No description provided.</p>
                                )}

                                {/* Progress Section */}
                                <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">Progress</span>
                                        <span className="font-bold text-primary">{viewProgress}%</span>
                                    </div>
                                    {canUpdateProgress ? (
                                        <Slider
                                            value={[viewProgress]}
                                            onValueChange={(v) => setViewProgress(v[0])}
                                            max={100}
                                            step={5}
                                            className="py-2"
                                        />
                                    ) : (
                                        <Progress value={viewingTask.completionPercentage} className="h-2" />
                                    )}
                                </div>

                                {/* Comment Input */}
                                {canUpdateProgress && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Add a comment</Label>
                                        <Textarea
                                            value={taskComment}
                                            onChange={(e) => setTaskComment(e.target.value)}
                                            placeholder="What did you work on? Any blockers?"
                                            rows={2}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-muted-foreground text-right">{taskComment.length}/500</p>
                                    </div>
                                )}

                                {/* Save button */}
                                {canUpdateProgress && hasChanges && (
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={handleSaveProgress}
                                        disabled={savingProgress}
                                    >
                                        {savingProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Save Progress
                                    </Button>
                                )}

                                {/* Comment History */}
                                {viewingTask.comments && viewingTask.comments.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" />
                                            Comments ({viewingTask.comments.length})
                                        </Label>
                                        <div className="max-h-48 overflow-y-auto space-y-2">
                                            {[...viewingTask.comments].reverse().map((c) => (
                                                <div key={c._id} className="bg-muted rounded p-2 text-sm">
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                        <span className="font-medium">{c.user?.name || "Unknown"}</span>
                                                        <div className="flex items-center gap-2">
                                                            {c.completionPercentage !== undefined && (
                                                                <Badge variant="outline" className="text-xs py-0">{c.completionPercentage}%</Badge>
                                                            )}
                                                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <p className="whitespace-pre-wrap">{c.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                    Created by {viewingTask.createdBy.name} on {new Date(viewingTask.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                {isTeamLead && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => { handleDeleteTask(viewingTask._id); setViewingTask(null); }}
                                    >
                                        <Trash2 className="mr-1 h-4 w-4" />Delete
                                    </Button>
                                )}
                                <div className="flex-1" />
                                {canEdit && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { handleEditTask(viewingTask); setViewingTask(null); }}
                                    >
                                        <Edit2 className="mr-1 h-4 w-4" />Edit
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setViewingTask(null)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                );
            })()}

            {/* Edit Task Dialog */}
            <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Task Title *</Label>
                            <Input
                                value={editTaskForm.title}
                                onChange={(e) => setEditTaskForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Task title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={editTaskForm.description}
                                onChange={(e) => setEditTaskForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Task details..."
                                rows={2}
                            />
                        </div>
                        {isTeamLead && (
                            <div className="space-y-2">
                                <Label>Assign To</Label>
                                <Select value={editTaskForm.assignedTo} onValueChange={(v) => setEditTaskForm(f => ({ ...f, assignedTo: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select trainee" /></SelectTrigger>
                                    <SelectContent>
                                        {selectedProject?.assignedTrainees.map(t => (
                                            <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={editTaskForm.dueDate}
                                onChange={(e) => setEditTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                        <Button onClick={handleUpdateTask} disabled={isUpdatingTask || !editTaskForm.title.trim()}>
                            {isUpdatingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
