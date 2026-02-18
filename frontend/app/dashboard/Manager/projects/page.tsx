"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2, Plus, Edit, Trash2, Search, Users, Building2, Eye,
    FolderOpen, CheckCircle, Clock, Pause, RefreshCw, Crown, ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    getProjects,
    deleteProject,
    getProjectUpdates,
    reviewProjectUpdate,
    getProjectTasks,
    createTask,
    deleteTask,
    updateTask
} from "@/lib/services/project.service";
import { getAllPrograms } from "@/lib/services/program.service";
import { Project, Program, ProjectUpdate as PUpdate, ProjectUpdatesResponse, ProjectTask, CreateTaskData } from "@/types";

export default function ProjectManagementPage() {
    const router = useRouter();
    const pathname = usePathname();

    const [projects, setProjects] = useState<Project[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [programFilter, setProgramFilter] = useState<string>("all");

    // Delete confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View project updates & tasks
    const [viewProject, setViewProject] = useState<Project | null>(null);
    const [viewUpdates, setViewUpdates] = useState<PUpdate[]>([]);
    const [viewTasks, setViewTasks] = useState<ProjectTask[]>([]);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewTab, setViewTab] = useState<"updates" | "tasks">("tasks");
    const [reviewingUpdate, setReviewingUpdate] = useState<string | null>(null);
    const [reviewComment, setReviewComment] = useState("");

    // Task creation & filtering
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskForm, setTaskForm] = useState<CreateTaskData>({ title: "", assignedTo: "", description: "", dueDate: "" });
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>("all");
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
    const [editTaskForm, setEditTaskForm] = useState<CreateTaskData>({ title: "", assignedTo: "", description: "", dueDate: "" });
    const [isUpdatingTask, setIsUpdatingTask] = useState(false);

    // Determine base path for navigation (Manager or Facilitator)
    const basePath = pathname.includes('/Facilitator/') ? '/dashboard/Facilitator/projects' : '/dashboard/Manager/projects';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [projectsData, programsData] = await Promise.all([
                getProjects(),
                getAllPrograms()
            ]);
            setProjects(projectsData);
            setPrograms(programsData.filter(p => p.status === 'Active'));
        } catch (err) {
            toast.error("Failed to load data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch =
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.program?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || p.status === statusFilter;
            const matchesProgram = programFilter === "all" || p.program?._id === programFilter;
            return matchesSearch && matchesStatus && matchesProgram;
        });
    }, [projects, searchTerm, statusFilter, programFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
            case 'completed':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
            case 'on_hold':
                return <Badge variant="secondary"><Pause className="mr-1 h-3 w-3" />On Hold</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            await deleteProject(projectToDelete._id);
            toast.success("Project deleted successfully.");
            setDeleteConfirmOpen(false);
            setProjectToDelete(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete project.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleViewUpdates = async (project: Project) => {
        setViewProject(project);
        setViewTab("tasks");
        setViewLoading(true);
        setShowTaskForm(false);
        setTaskAssigneeFilter("all");
        try {
            const [updatesData, tasksData] = await Promise.all([
                getProjectUpdates(project._id, { limit: 50 }),
                getProjectTasks(project._id)
            ]);
            setViewUpdates(updatesData.updates);
            setViewTasks(tasksData);
        } catch (err) {
            toast.error("Failed to load project data.");
            console.error(err);
        } finally {
            setViewLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!viewProject || !taskForm.title.trim()) return;
        setIsCreatingTask(true);
        try {
            await createTask(viewProject._id, {
                title: taskForm.title.trim(),
                assignedTo: taskForm.assignedTo || undefined,
                description: taskForm.description?.trim() || undefined,
                dueDate: taskForm.dueDate || undefined
            });
            toast.success("Task created.");
            setTaskForm({ title: "", assignedTo: "", description: "", dueDate: "" });
            setShowTaskForm(false);
            const tasksData = await getProjectTasks(viewProject._id);
            setViewTasks(tasksData);
            fetchData(); // refresh project cards for task count
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create task.");
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!viewProject) return;
        setDeletingTaskId(taskId);
        try {
            await deleteTask(taskId);
            toast.success("Task deleted.");
            setViewTasks(prev => prev.filter(t => t._id !== taskId));
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete task.");
        } finally {
            setDeletingTaskId(null);
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
        if (!editingTask || !editTaskForm.title.trim() || !viewProject) return;
        setIsUpdatingTask(true);
        try {
            await updateTask(editingTask._id, {
                title: editTaskForm.title.trim(),
                description: editTaskForm.description?.trim() || undefined,
                assignedTo: editTaskForm.assignedTo,
                dueDate: editTaskForm.dueDate || undefined
            });
            toast.success("Task updated.");
            setEditingTask(null);
            const tasksData = await getProjectTasks(viewProject._id);
            setViewTasks(tasksData);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update task.");
        } finally {
            setIsUpdatingTask(false);
        }
    };

    const handleReviewUpdate = async (updateId: string) => {
        try {
            await reviewProjectUpdate(updateId, reviewComment);
            toast.success("Update reviewed.");
            setReviewingUpdate(null);
            setReviewComment("");
            // Refresh updates
            if (viewProject) {
                const data = await getProjectUpdates(viewProject._id, { limit: 50 });
                setViewUpdates(data.updates);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to review update.");
        }
    };

    const taskAssignees = useMemo(() => {
        const map = new Map<string, string>();
        viewTasks.forEach(t => { if (t.assignedTo) map.set(t.assignedTo._id, t.assignedTo.name); });
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [viewTasks]);

    const filteredViewTasks = useMemo(() => {
        if (taskAssigneeFilter === "all") return viewTasks;
        if (taskAssigneeFilter === "unassigned") return viewTasks.filter(t => !t.assignedTo);
        return viewTasks.filter(t => t.assignedTo?._id === taskAssigneeFilter);
    }, [viewTasks, taskAssigneeFilter]);

    // Stats
    const activeCount = projects.filter(p => p.status === 'active').length;
    const completedCount = projects.filter(p => p.status === 'completed').length;
    const onHoldCount = projects.filter(p => p.status === 'on_hold').length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading projects...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Project Tracking</h1>
                    <p className="text-muted-foreground">Create projects, assign trainees, and track progress.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchData} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />Refresh
                    </Button>
                    <Button onClick={() => router.push(`${basePath}/new`)}>
                        <Plus className="mr-2 h-4 w-4" />New Project
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter("all")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{projects.length}</div>
                        <p className="text-xs text-muted-foreground">Total Projects</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md ${statusFilter === 'active' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setStatusFilter("active")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md ${statusFilter === 'completed' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setStatusFilter("completed")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md ${statusFilter === 'on_hold' ? 'ring-2 ring-gray-500' : ''}`} onClick={() => setStatusFilter("on_hold")}>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-gray-600">{onHoldCount}</div>
                        <p className="text-xs text-muted-foreground">On Hold</p>
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
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={programFilter} onValueChange={setProgramFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by program" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Programs</SelectItem>
                                {programs.map(p => (
                                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(searchTerm || statusFilter !== "all" || programFilter !== "all") && (
                            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setProgramFilter("all"); }}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Projects List */}
            {filteredProjects.length === 0 ? (
                <Card>
                    <CardContent className="py-10">
                        <div className="text-center">
                            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-muted-foreground">No projects found.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredProjects.map(project => (
                        <Card key={project._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-semibold text-lg">{project.title}</h3>
                                            {getStatusBadge(project.status)}
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
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />{project.assignedTrainees.length} trainee{project.assignedTrainees.length !== 1 ? 's' : ''}
                                            </span>
                                            {project.teamLead && (
                                                <span className="flex items-center gap-1">
                                                    <Crown className="h-3.5 w-3.5 text-amber-500" />{project.teamLead.name}
                                                </span>
                                            )}
                                            {(project.totalTasks ?? 0) > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <ListTodo className="h-3.5 w-3.5" />{project.totalTasks} task{project.totalTasks !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {project.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />Due: {new Date(project.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        {/* Progress bar */}
                                        <div className="flex items-center gap-3">
                                            <Progress value={project.averageCompletion || 0} className="flex-1 h-2" />
                                            <span className="text-sm font-medium w-12 text-right">{project.averageCompletion || 0}%</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button size="sm" variant="outline" onClick={() => handleViewUpdates(project)}>
                                            <Eye className="mr-1 h-4 w-4" />Details
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => router.push(`${basePath}/edit/${project._id}`)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(project)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!isDeleting) { setDeleteConfirmOpen(open); if (!open) setProjectToDelete(null); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete <strong>{projectToDelete?.title}</strong>? This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Project Details Modal */}
            <Dialog open={!!viewProject} onOpenChange={(open) => { if (!open) { setViewProject(null); setViewUpdates([]); setViewTasks([]); setShowTaskForm(false); } }}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {viewProject?.title}
                            {viewProject?.teamLead && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 font-normal">
                                    <Crown className="mr-1 h-3 w-3" />Lead: {viewProject.teamLead.name}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {viewProject?.program?.name}
                            {viewProject?.companyName && ` | ${viewProject.companyName}`}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tab Switcher */}
                    <div className="flex gap-2 border-b pb-2">
                        <Button
                            variant={viewTab === "tasks" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewTab("tasks")}
                        >
                            <ListTodo className="mr-1 h-4 w-4" />Tasks ({viewTasks.length})
                        </Button>
                        <Button
                            variant={viewTab === "updates" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewTab("updates")}
                        >
                            <Eye className="mr-1 h-4 w-4" />Updates ({viewUpdates.length})
                        </Button>
                    </div>

                    {viewLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : viewTab === "tasks" ? (
                        /* ---- Tasks Tab ---- */
                        <div className="space-y-3 py-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                {taskAssignees.length > 1 && (
                                    <Select value={taskAssigneeFilter} onValueChange={setTaskAssigneeFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Members</SelectItem>
                                            {taskAssignees.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <p className="text-sm text-muted-foreground flex-1">
                                    {viewTasks.length === 0 ? "No tasks created yet." : `${filteredViewTasks.length} of ${viewTasks.length} task${viewTasks.length !== 1 ? "s" : ""}`}
                                </p>
                                <Button size="sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                                    <Plus className="mr-1 h-4 w-4" />{showTaskForm ? "Cancel" : "Add Task"}
                                </Button>
                            </div>

                            {/* Task Creation Form */}
                            {showTaskForm && viewProject && (
                                <Card className="border-dashed">
                                    <CardContent className="py-3 space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <Label className="text-xs">Title *</Label>
                                                <Input
                                                    placeholder="Task title"
                                                    value={taskForm.title}
                                                    onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Assign To</Label>
                                                <Select value={taskForm.assignedTo} onValueChange={(v) => setTaskForm(f => ({ ...f, assignedTo: v }))}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select trainee" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {viewProject.assignedTrainees.map(t => (
                                                            <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Description</Label>
                                            <Textarea
                                                placeholder="Optional description"
                                                value={taskForm.description || ""}
                                                onChange={(e) => setTaskForm(f => ({ ...f, description: e.target.value }))}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <div>
                                                <Label className="text-xs">Due Date</Label>
                                                <Input
                                                    type="date"
                                                    value={taskForm.dueDate || ""}
                                                    onChange={(e) => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                                                />
                                            </div>
                                            <Button size="sm" onClick={handleCreateTask} disabled={isCreatingTask || !taskForm.title.trim()}>
                                                {isCreatingTask && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Create Task
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Task List */}
                            {filteredViewTasks.map(task => (
                                <Card key={task._id}>
                                    <CardContent className="py-3 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-sm">{task.title}</span>
                                                    <Badge variant={task.assignedTo ? "outline" : "secondary"} className="text-xs">{task.assignedTo?.name || "Unassigned"}</Badge>
                                                    {task.dueDate && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleEditTask(task)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                                    onClick={() => handleDeleteTask(task._id)}
                                                    disabled={deletingTaskId === task._id}
                                                >
                                                    {deletingTaskId === task._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Progress value={task.completionPercentage} className="flex-1 h-2" />
                                            <span className="text-xs font-medium w-10 text-right">{task.completionPercentage}%</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        /* ---- Updates Tab ---- */
                        <div className="space-y-3 py-2">
                            {viewUpdates.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No updates submitted yet.</p>
                            ) : viewUpdates.map(update => (
                                <Card key={update._id} className={`${!update.isReviewed ? 'border-yellow-200' : ''}`}>
                                    <CardContent className="py-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{update.trainee.name}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(update.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {update.completionPercentage != null && (
                                                    <Badge variant="outline">{update.completionPercentage}%</Badge>
                                                )}
                                                {update.isReviewed ? (
                                                    <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Reviewed</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
                                                )}
                                            </div>
                                        </div>
                                        {update.completionPercentage != null && (
                                            <Progress value={update.completionPercentage} className="h-1.5" />
                                        )}
                                        <p className="text-sm">{update.description}</p>
                                        {update.blockers && (
                                            <p className="text-sm text-orange-600"><strong>Blockers:</strong> {update.blockers}</p>
                                        )}
                                        {update.reviewComment && (
                                            <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                                                <strong>Review:</strong> {update.reviewComment} — {update.reviewedBy?.name}
                                            </p>
                                        )}
                                        {!update.isReviewed && (
                                            <div>
                                                {reviewingUpdate === update._id ? (
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            placeholder="Review comment (optional)"
                                                            value={reviewComment}
                                                            onChange={(e) => setReviewComment(e.target.value)}
                                                            className="text-sm"
                                                        />
                                                        <Button size="sm" onClick={() => handleReviewUpdate(update._id)}>
                                                            <CheckCircle className="mr-1 h-3 w-3" />Review
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => { setReviewingUpdate(null); setReviewComment(""); }}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => setReviewingUpdate(update._id)}>
                                                        Mark as Reviewed
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Task Dialog */}
            <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) setEditingTask(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs">Title *</Label>
                            <Input
                                value={editTaskForm.title}
                                onChange={(e) => setEditTaskForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Task title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Description</Label>
                            <Textarea
                                value={editTaskForm.description || ""}
                                onChange={(e) => setEditTaskForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Task details..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Assign To</Label>
                            <Select value={editTaskForm.assignedTo} onValueChange={(v) => setEditTaskForm(f => ({ ...f, assignedTo: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select trainee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {viewProject?.assignedTrainees.map(t => (
                                        <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Due Date</Label>
                            <Input
                                type="date"
                                value={editTaskForm.dueDate || ""}
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
