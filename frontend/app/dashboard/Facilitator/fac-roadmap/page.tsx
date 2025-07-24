"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, Users, CheckCircle, AlertCircle, Plus, Loader2, Edit, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/RoleContext";
import api from "@/lib/api";

interface ProgramForRoadmap {
  _id: string;
  name: string;
}

interface WeeklyRoadmapItem {
  _id: string;
  program: string;
  weekNumber: number;
  title: string;
  startDate: string;
  endDate?: string;
  status?: "current" | "completed" | "upcoming";
  approvalStatus?: "draft" | "pending_approval" | "approved" | "rejected";
  topics: Array<{
    day: string;
    topic: string;
    duration: string;
    type: "in-person" | "online";
    completed: boolean;
  }>;
  objectives: string[];
  resources?: number;
  assignments?: number;
  students?: number;
  feedback?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export default function WeeklyRoadmapPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [programs, setPrograms] = useState<ProgramForRoadmap[]>([]);
  const [weeklyRoadmap, setWeeklyRoadmap] = useState<WeeklyRoadmapItem[]>([]);
  const [planWeekOpen, setPlanWeekOpen] = useState(false);
  const [editWeekOpen, setEditWeekOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyRoadmapItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [weekPlan, setWeekPlan] = useState({
    program: "",
    weekNumber: "",
    title: "",
    startDate: "",
    objectives: "",
    topics: ["", "", "", "", ""]
  });
  const [feedback, setFeedback] = useState("");
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get("/programs");
        const programsData = response.data.data || [];
        setPrograms(programsData);
        if (programsData.length > 0) {
          setSelectedProgram(programsData[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch programs:", error);
        toast.error("Failed to load programs");
      }
    };

    fetchPrograms();
  }, []);

  // Fetch roadmap when program changes
  useEffect(() => {
    if (!selectedProgram) return;

    const fetchRoadmap = async () => {
      setIsLoadingRoadmap(true);
      try {
        const response = await api.get(`/roadmap/${selectedProgram}`);
        const roadmapData = response.data.data || [];
        setWeeklyRoadmap(roadmapData);
      } catch (error) {
        console.error("Failed to fetch roadmap:", error);
        setWeeklyRoadmap([]);
      } finally {
        setIsLoadingRoadmap(false);
      }
    };

    fetchRoadmap();
  }, [selectedProgram]);

  // Fetch student count when selectedProgram changes
  useEffect(() => {
    if (!selectedProgram) return;
    setLoadingStudents(true);
    api.get(`/programs/${selectedProgram}/student-count`)
      .then(res => setStudentCount(res.data.data.count))
      .catch(() => setStudentCount(null))
      .finally(() => setLoadingStudents(false));
  }, [selectedProgram]);

  const handlePlanWeek = async () => {
    if (!weekPlan.program || !weekPlan.weekNumber || !weekPlan.title || !weekPlan.startDate) {
      toast.error("Please fill in all required fields to plan a week.");
      return;
    }

    // Prevent duplicate week plan
    const weekExists = weeklyRoadmap.some(
      w => w.weekNumber === parseInt(weekPlan.weekNumber)
    );
    if (weekExists) {
      toast.error("A week plan for this week already exists.");
      return;
    }

    setIsProcessing(true);
    try {
      await api.post("/roadmap", {
        program: weekPlan.program,
        weekNumber: parseInt(weekPlan.weekNumber),
        title: weekPlan.title,
        startDate: weekPlan.startDate,
        objectives: weekPlan.objectives.split("\n").filter(obj => obj.trim()),
        topics: weekPlan.topics.map((topic, index) => ({
          day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index],
          topic,
          duration: "3 hours",
          type: (index % 2 === 0 ? "in-person" : "online") as "in-person" | "online",
          completed: false
        }))
      });

      setPlanWeekOpen(false);
      setWeekPlan({
        program: "",
        weekNumber: "",
        title: "",
        startDate: "",
        objectives: "",
        topics: ["", "", "", "", ""]
      });

      // Refresh roadmap data
      const response = await api.get(`/roadmap/${selectedProgram}`);
      setWeeklyRoadmap(response.data.data || []);
      
      toast.success("Week plan created successfully!");
    } catch (error: any) {
      console.error("Failed to create week plan:", error);
      toast.error(error.response?.data?.message || "Failed to create week plan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...weekPlan.topics];
    newTopics[index] = value;
    setWeekPlan({ ...weekPlan, topics: newTopics });
  };

  const handleEditWeek = (week: WeeklyRoadmapItem) => {
    setSelectedWeek(week);
    setWeekPlan({
      program: week.program,
      weekNumber: week.weekNumber.toString(),
      title: week.title,
      startDate: week.startDate.split('T')[0],
      objectives: week.objectives.join('\n'),
      topics: week.topics.map(t => t.topic)
    });
    setEditWeekOpen(true);
  };

  const handleUpdateWeek = async () => {
    if (!selectedWeek || !weekPlan.title || !weekPlan.startDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsProcessing(true);
    try {
      await api.put(`/roadmap/week/${selectedWeek._id}`, {
        title: weekPlan.title,
        startDate: weekPlan.startDate,
        objectives: weekPlan.objectives.split("\n").filter(obj => obj.trim()),
        topics: weekPlan.topics.map((topic, index) => ({
          day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index],
          topic,
          duration: "3 hours",
          type: (index % 2 === 0 ? "in-person" : "online") as "in-person" | "online",
          completed: false
        }))
      });

      setEditWeekOpen(false);
      setSelectedWeek(null);
      setWeekPlan({
        program: "",
        weekNumber: "",
        title: "",
        startDate: "",
        objectives: "",
        topics: ["", "", "", "", ""]
      });

      // Refresh roadmap data
      const response = await api.get(`/roadmap/${selectedProgram}`);
      setWeeklyRoadmap(response.data.data || []);
      
      toast.success("Week plan updated successfully!");
    } catch (error: any) {
      console.error("Failed to update week plan:", error);
      toast.error(error.response?.data?.message || "Failed to update week plan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!confirm("Are you sure you want to delete this week plan? This action cannot be undone.")) {
      return;
    }

    setIsProcessing(true);
    try {
      await api.delete(`/roadmap/week/${weekId}`);
      
      // Refresh roadmap data
      const response = await api.get(`/roadmap/${selectedProgram}`);
      setWeeklyRoadmap(response.data.data || []);
      
      toast.success("Week plan deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete week plan:", error);
      toast.error(error.response?.data?.message || "Failed to delete week plan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopicStatusChange = async (weekId: string, topicIndex: number, completed: boolean) => {
    try {
      await api.patch(`/roadmap/week/${weekId}/topic-status`, {
        topicIndex,
        completed
      });
      
      // Refresh roadmap data
      const response = await api.get(`/roadmap/${selectedProgram}`);
      setWeeklyRoadmap(response.data.data || []);
      
      toast.success("Topic status updated successfully!");
    } catch (error: any) {
      console.error("Failed to update topic status:", error);
      toast.error(error.response?.data?.message || "Failed to update topic status.");
    }
  };

  const handleFeedback = (week: WeeklyRoadmapItem) => {
    setSelectedWeek(week);
    setFeedback("");
    setFeedbackOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter feedback.");
      return;
    }

    toast.success("Feedback submitted successfully!");
    setFeedbackOpen(false);
    setSelectedWeek(null);
    setFeedback("");
  };

  const handleSubmitForApproval = async (weekId: string) => {
    try {
      await api.post(`/roadmap/week/${weekId}/submit`);
      
      // Refresh roadmap data
      const response = await api.get(`/roadmap/${selectedProgram}`);
      setWeeklyRoadmap(response.data.data || []);
      
      toast.success("Week plan submitted for approval!");
    } catch (error: any) {
      console.error("Failed to submit for approval:", error);
      toast.error(error.response?.data?.message || "Failed to submit for approval.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "upcoming": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "pending_approval": return "bg-yellow-500";
      case "approved": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getApprovalStatusText = (status: string) => {
    switch (status) {
      case "draft": return "Draft";
      case "pending_approval": return "Pending Approval";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return "Draft";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "in-person" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700";
  };

  const filteredRoadmap = weeklyRoadmap.filter((item: WeeklyRoadmapItem) => {
    const matchesProgram = selectedProgram === "all" || item.program === selectedProgram;
    return matchesProgram;
  });

  // Helper function to determine if a week is current
  const isCurrentWeek = (week: WeeklyRoadmapItem) => {
    const today = new Date();
    const weekStart = new Date(week.startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return today >= weekStart && today <= weekEnd;
  };

  // Helper function to determine if a week is upcoming
  const isUpcomingWeek = (week: WeeklyRoadmapItem) => {
    const today = new Date();
    const weekStart = new Date(week.startDate);
    return today < weekStart;
  };

  // Get current week
  const currentWeek = filteredRoadmap.find(isCurrentWeek);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || role !== 'facilitator') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly Roadmap</h2>
          <p className="text-muted-foreground">Plan and track weekly learning objectives and schedules</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program: ProgramForRoadmap) => (
                <SelectItem key={program._id} value={program._id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={planWeekOpen} onOpenChange={setPlanWeekOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Plan Week
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Plan New Week</DialogTitle>
                <DialogDescription>Create a weekly roadmap for your program</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <Select
                    value={weekPlan.program}
                    onValueChange={(value) => setWeekPlan({ ...weekPlan, program: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program: ProgramForRoadmap) => (
                        <SelectItem key={program._id} value={program._id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="week-number">Week Number *</Label>
                    <Input
                      id="week-number"
                      type="number"
                      placeholder="e.g., 4"
                      value={weekPlan.weekNumber}
                      onChange={(e) => setWeekPlan({ ...weekPlan, weekNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={weekPlan.startDate}
                      onChange={(e) => setWeekPlan({ ...weekPlan, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Week Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Advanced JavaScript Concepts"
                    value={weekPlan.title}
                    onChange={(e) => setWeekPlan({ ...weekPlan, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily Topics</Label>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
                    <div key={day} className="space-y-1">
                      <Label className="text-sm text-muted-foreground">{day}</Label>
                      <Input
                        placeholder={`${day} topic...`}
                        value={weekPlan.topics[index]}
                        onChange={(e) => handleTopicChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectives">Learning Objectives</Label>
                  <Textarea
                    id="objectives"
                    placeholder="Enter learning objectives (one per line)..."
                    value={weekPlan.objectives}
                    onChange={(e) => setWeekPlan({ ...weekPlan, objectives: e.target.value })}
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPlanWeekOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePlanWeek}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Week Plan"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Week {currentWeek?.weekNumber || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {currentWeek?.startDate 
                ? <span suppressHydrationWarning>{new Date(currentWeek.startDate).toLocaleDateString()}</span>
                : "No current week"
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentWeek?.topics.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentWeek?.topics.filter(t => t.type === "in-person").length || 0} in-person,{" "}
              {currentWeek?.topics.filter(t => t.type === "online").length || 0} online
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                if (!currentWeek || currentWeek.topics.length === 0) return "0%";
                const completed = currentWeek.topics.filter(t => t.completed).length;
                return `${Math.round((completed / currentWeek.topics.length) * 100)}%`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                if (!currentWeek) return "No current week";
                const completed = currentWeek.topics.filter(t => t.completed).length;
                return `${completed} of ${currentWeek.topics.length} sessions done`;
              })()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStudents ? <Loader2 className="inline h-5 w-5 animate-spin" /> : (studentCount !== null ? studentCount : "-")}
            </div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Weeks</TabsTrigger>
          <TabsTrigger value="overview">Program Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4 mt-4">
          {isLoadingRoadmap ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading roadmap...</p>
              </CardContent>
            </Card>
          ) : !currentWeek ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4" />
                No current roadmap found for selected program.
              </CardContent>
            </Card>
          ) : (
            <Card key={currentWeek._id} className="transition-all duration-200 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{currentWeek.title}</CardTitle>
                      <Badge className="bg-blue-500 text-white border-0">
                        Week {currentWeek.weekNumber}
                      </Badge>
                      <Badge className={`${getApprovalStatusColor(currentWeek.approvalStatus || "draft")} text-white border-0`}>
                        {getApprovalStatusText(currentWeek.approvalStatus || "draft")}
                      </Badge>
                    </div>
                    <CardDescription className="text-lg font-medium">
                      {programs.find(p => p._id === currentWeek.program)?.name || currentWeek.program}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(currentWeek.startDate).toLocaleDateString()}
                      {currentWeek.endDate && ` - ${new Date(currentWeek.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>{currentWeek.resources || 0} resources</span>
                      <span>{currentWeek.assignments || 0} assignments</span>
                      <span>{currentWeek.students || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentWeek.approvalStatus === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmitForApproval(currentWeek._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Submit for Approval
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWeek(currentWeek)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedback(currentWeek)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWeek(currentWeek._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Learning Objectives</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentWeek.objectives.map((objective: string, objIndex: number) => (
                      <div key={objIndex} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Daily Schedule</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Progress:</span>
                      <Progress 
                        value={currentWeek.topics.filter((t: any) => t.completed).length / currentWeek.topics.length * 100} 
                        className="w-20 h-2"
                      />
                      <span>{currentWeek.topics.filter((t: any) => t.completed).length}/{currentWeek.topics.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {currentWeek.topics.map((topic, topicIndex) => (
                      <div
                        key={topicIndex}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          topic.completed ? "bg-green-50 border-green-200" : "bg-muted border-border"
                        }`}
                        onClick={() => handleTopicStatusChange(currentWeek._id, topicIndex, !topic.completed)}
                      >
                        <div className="flex items-center gap-3">
                          {topic.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">{topic.day}</p>
                            <p className="text-sm text-muted-foreground">{topic.topic}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getTypeColor(topic.type)}>
                            {topic.type === "in-person" ? "In-Person" : "Online"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{topic.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {currentWeek.approvalStatus === "rejected" && currentWeek.feedback && (
                  <div className="px-6 pb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h5 className="font-medium text-red-800 mb-1">Feedback from Program Manager:</h5>
                      <p className="text-sm text-red-700">{currentWeek.feedback}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Edit Week Dialog */}
        <Dialog open={editWeekOpen} onOpenChange={setEditWeekOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Week Plan</DialogTitle>
              <DialogDescription>Update the weekly roadmap for your program</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Week Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Advanced JavaScript Concepts"
                  value={weekPlan.title}
                  onChange={(e) => setWeekPlan({ ...weekPlan, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date *</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={weekPlan.startDate}
                  onChange={(e) => setWeekPlan({ ...weekPlan, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Daily Topics</Label>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
                  <div key={day} className="space-y-1">
                    <Label className="text-sm text-muted-foreground">{day}</Label>
                    <Input
                      placeholder={`${day} topic...`}
                      value={weekPlan.topics[index]}
                      onChange={(e) => handleTopicChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-objectives">Learning Objectives</Label>
                <Textarea
                  id="edit-objectives"
                  placeholder="Enter learning objectives (one per line)..."
                  value={weekPlan.objectives}
                  onChange={(e) => setWeekPlan({ ...weekPlan, objectives: e.target.value })}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditWeekOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateWeek}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Week Plan"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Feedback</DialogTitle>
              <DialogDescription>Provide feedback for this week plan</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Enter your feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setFeedbackOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
        
        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {isLoadingRoadmap ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading roadmap...</p>
              </CardContent>
            </Card>
          ) : filteredRoadmap.filter(isUpcomingWeek).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4" />
                No upcoming roadmap found for selected program. Plan a new week!
              </CardContent>
            </Card>
          ) : (
            filteredRoadmap.filter(isUpcomingWeek).map((week: WeeklyRoadmapItem, index: number) => (
              <Card key={week._id || index} className="transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle>{week.title}</CardTitle>
                        <Badge variant="outline">Week {week.weekNumber}</Badge>
                        <Badge className={`${getApprovalStatusColor(week.approvalStatus || "draft")} text-white border-0`}>
                          {getApprovalStatusText(week.approvalStatus || "draft")}
                        </Badge>
                      </div>
                      <CardDescription className="text-lg font-medium">
                        {programs.find(p => p._id === week.program)?.name || week.program}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        Starts: {new Date(week.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {week.approvalStatus === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmitForApproval(week._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Submit for Approval
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEditWeek(week)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleFeedback(week)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWeek(week._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-medium mb-2">Planned Topics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {week.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                          {topic.topic}
                        </div>
                      ))}
                    </div>
                  </div>
                  {week.approvalStatus === "rejected" && week.feedback && (
                    <div className="px-6 pb-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h5 className="font-medium text-red-800 mb-1">Feedback from Program Manager:</h5>
                        <p className="text-sm text-red-700">{week.feedback}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Program overview and long-term planning will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
