// app/dashboard/Facilitator/fac-roadmap/page.tsx
"use client"

import { useState } from "react"
import { Calendar, Clock, BookOpen, Users, CheckCircle, AlertCircle, Plus, Loader2 } from "lucide-react" // Added Loader2

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter // Added DialogFooter for submit/cancel buttons
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner" // Import toast

import { useAuth } from "@/lib/contexts/RoleContext" // Import useAuth for role check

// Interface for mock Program data (specific to roadmap context)
interface ProgramForRoadmap {
  id: string;
  name: string;
}

// Interface for mock WeeklyRoadmap data
interface WeeklyRoadmapItem {
  program: string; // Program name
  week: number;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "current" | "completed" | "upcoming";
  topics: Array<{
    day: string;
    topic: string;
    duration: string;
    type: "in-person" | "online";
    completed: boolean;
  }>;
  objectives: string[];
  resources: number;
  assignments: number;
  students: number;
}

export default function WeeklyRoadmapPage() { // Renamed from WeeklyRoadmap to WeeklyRoadmapPage
  const { user, role, loading: authLoading } = useAuth(); // Get user and role from context

  const [selectedProgram, setSelectedProgram] = useState("all")
  const [planWeekOpen, setPlanWeekOpen] = useState(false)
  const [weekPlan, setWeekPlan] = useState({ // Form state for creating new roadmap week
    program: "",
    weekNumber: "",
    title: "",
    startDate: "",
    objectives: "",
    topics: ["", "", "", "", ""], // 5 days for topics
  })

  // Mock programs data for the dropdown (in a real app, this would come from backend)
  const programs: ProgramForRoadmap[] = [
    { id: "all", name: "All Programs" }, // Filter option
    { id: "software", name: "Software Engineering Bootcamp" },
    { id: "web", name: "Web Development Course" },
    { id: "mobile", name: "Mobile App Development" },
  ];

  // Mock weekly roadmap data (managed locally)
  const [weeklyRoadmap, setWeeklyRoadmap] = useState<WeeklyRoadmapItem[]>([
    {
      program: "Software Engineering Bootcamp", week: 3, title: "JavaScript Fundamentals", startDate: "2024-01-22", endDate: "2024-01-26", status: "current",
      topics: [
        { day: "Monday", topic: "Variables and Data Types", duration: "3 hours", type: "in-person", completed: true, },
        { day: "Tuesday", topic: "Functions and Scope", duration: "3 hours", type: "in-person", completed: true, },
        { day: "Wednesday", topic: "DOM Manipulation", duration: "3 hours", type: "in-person", completed: false, },
        { day: "Thursday", topic: "Event Handling", duration: "3 hours", type: "online", completed: false, },
        { day: "Friday", topic: "Project: Interactive Web Page", duration: "4 hours", type: "in-person", completed: false, },
      ],
      objectives: ["Understand JavaScript data types and variables", "Master function declaration and expressions", "Learn DOM manipulation techniques", "Implement event-driven programming", "Build an interactive web application",],
      resources: 12, assignments: 3, students: 20,
    },
    {
      program: "Web Development Course", week: 5, title: "React Components", startDate: "2024-01-22", endDate: "2024-01-26", status: "current",
      topics: [
        { day: "Monday", topic: "Component Basics", duration: "2 hours", type: "online", completed: true, },
        { day: "Tuesday", topic: "Props and State", duration: "2 hours", type: "in-person", completed: true, },
        { day: "Wednesday", topic: "Event Handling in React", duration: "2 hours", type: "in-person", completed: false, },
        { day: "Thursday", topic: "Component Lifecycle", duration: "2 hours", type: "online", completed: false, },
        { day: "Friday", topic: "Project: Todo App", duration: "3 hours", type: "in-person", completed: false, },
      ],
      objectives: ["Create functional and class components", "Manage component state effectively", "Handle user interactions", "Understand component lifecycle", "Build a complete React application",],
      resources: 8, assignments: 2, students: 15,
    },
  ]);

  // Mock upcoming weeks data
  const [upcomingWeeks, setUpcomingWeeks] = useState<WeeklyRoadmapItem[]>([
    {
      program: "Software Engineering Bootcamp", week: 4, title: "Advanced JavaScript", startDate: "2024-01-29", endDate: "2024-02-02", status: "upcoming", // Added endDate for consistency
      topics: [{ day: "Monday", topic: "Async Programming", duration: "3 hours", type: "in-person", completed: false }, { day: "Tuesday", topic: "Promises & Async/Await", duration: "3 hours", type: "in-person", completed: false }, { day: "Wednesday", topic: "API Integration", duration: "3 hours", type: "online", completed: false }, { day: "Thursday", topic: "Error Handling", duration: "3 hours", type: "in-person", completed: false }, { day: "Friday", topic: "Project: Data Fetching", duration: "4 hours", type: "in-person", completed: false }],
      objectives: ["Master asynchronous patterns", "Integrate with external APIs", "Implement robust error handling"], // More detailed objectives
      resources: 10, assignments: 2, students: 20,
    },
    {
      program: "Web Development Course", week: 6, title: "React Hooks", startDate: "2024-01-29", endDate: "2024-02-02", status: "upcoming", // Added endDate
      topics: [{ day: "Monday", topic: "useState Hook", duration: "2 hours", type: "online", completed: false }, { day: "Tuesday", topic: "useEffect Hook", duration: "2 hours", type: "in-person", completed: false }, { day: "Wednesday", topic: "Custom Hooks", duration: "2 hours", type: "in-person", completed: false }, { day: "Thursday", topic: "Context API", duration: "2 hours", type: "online", completed: false }, { day: "Friday", topic: "Project: Global State", duration: "3 hours", type: "in-person", completed: false }],
      objectives: ["Understand core React Hooks", "Create custom reusable Hooks", "Manage global state with Context API"],
      resources: 7, assignments: 1, students: 15,
    },
  ]);


  // UI Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "current": return "bg-blue-500"
      case "completed": return "bg-green-500"
      case "upcoming": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getTypeColor = (type: string) => {
    return type === "in-person" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
  }

  // Filter roadmap items based on selected program
  const filteredRoadmap = weeklyRoadmap.filter(item => {
    // If "All Programs" is selected, show all. Otherwise, filter by program name.
    const matchesProgram = selectedProgram === "all" || item.program === programs.find(p => p.id === selectedProgram)?.name;
    return matchesProgram;
  });

  // Mock handler for planning a new week
  const handlePlanWeek = () => {
    if (!weekPlan.program || !weekPlan.weekNumber || !weekPlan.title || !weekPlan.startDate) {
      toast.error("Please fill in all required fields to plan a week.");
      return;
    }
    if (weekPlan.topics.every(topic => topic.trim() === '') && weekPlan.objectives.trim() === '') {
        toast.error("Please add at least one daily topic or learning objective.");
        return;
    }

    setIsProcessing(true); // Simulate processing
    setTimeout(() => {
      const newWeek: WeeklyRoadmapItem = {
        program: programs.find((p) => p.id === weekPlan.program)?.name || weekPlan.program,
        week: Number.parseInt(weekPlan.weekNumber),
        title: weekPlan.title,
        startDate: weekPlan.startDate,
        endDate: new Date(new Date(weekPlan.startDate).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Mock end date
        status: "upcoming", // Newly planned weeks are upcoming
        topics: weekPlan.topics
          .filter((topic) => topic.trim())
          .map((topic, index) => ({
            day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index],
            topic: topic,
            duration: "3 hours", // Mock duration
            type: (index % 2 === 0 ? "in-person" : "online"), // Alternate mock type
            completed: false,
          })),
        objectives: weekPlan.objectives.split("\n").filter((obj) => obj.trim()),
        resources: Math.floor(Math.random() * 5) + 5, // Mock resources
        assignments: Math.floor(Math.random() * 2) + 1, // Mock assignments
        students: 20, // Mock students
      };

      setWeeklyRoadmap((prev) => [...prev, newWeek]); // Add to existing roadmap
      setPlanWeekOpen(false); // Close modal
      // Reset form fields
      setWeekPlan({
        program: "", weekNumber: "", title: "", startDate: "", objectives: "", topics: ["", "", "", "", ""],
      });
      setIsProcessing(false); // End processing
      toast.success(`Week ${weekPlan.weekNumber} planned successfully for ${newWeek.program}!`);
    }, 1000); // Simulate API call delay
  };

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...weekPlan.topics]
    newTopics[index] = value
    setWeekPlan({ ...weekPlan, topics: newTopics })
  }

  // Render nothing or a loading spinner if authentication is still loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Access control: Only facilitators should see this page
  if (!user || role !== 'facilitator') {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have permission to view this page.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly Roadmap</h2>
          <p className="text-muted-foreground">Plan and track weekly learning objectives and schedules</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={planWeekOpen} onOpenChange={setPlanWeekOpen}>
            <DialogTrigger asChild>
              <Button type="button">
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
                      {programs
                        .filter((p) => p.id !== "all")
                        .map((program) => (
                          <SelectItem key={program.id} value={program.id}>
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
                    type="button"
                    variant="outline"
                    onClick={() => setPlanWeekOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-website-primary hover:bg-website-primary/90"
                    onClick={handlePlanWeek}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Week Plan"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Week Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Week 3 & 5</div>
            <p className="text-xs text-muted-foreground">Jan 22 - Jan 26</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">10</div>
            <p className="text-xs text-muted-foreground">6 in-person, 4 online</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">40%</div>
            <p className="text-xs text-muted-foreground">4 of 10 sessions done</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">35</div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Roadmap Content */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Weeks</TabsTrigger>
          <TabsTrigger value="overview">Program Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4 mt-4">
          {filteredRoadmap.filter(item => item.status === "current").length === 0 ? (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4" />
                    No current roadmap found for selected program.
                </CardContent>
            </Card>
          ) : (
            filteredRoadmap.filter(item => item.status === "current").map((week, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-foreground">{week.program}</CardTitle>
                        <Badge className={`${getStatusColor(week.status)} text-white border-0`}>
                          Week {week.week}
                        </Badge>
                      </div>
                      <CardDescription className="text-lg font-medium">{week.title}</CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(week.startDate).toLocaleDateString()} -{" "}
                        {new Date(week.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{week.resources} resources</span>
                        <span>{week.assignments} assignments</span>
                        <span>{week.students} students</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Learning Objectives */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Learning Objectives</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {week.objectives.map((objective, objIndex) => (
                        <div key={objIndex} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Schedule */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Daily Schedule</h4>
                    <div className="space-y-3">
                      {week.topics.map((topic, topicIndex) => (
                        <div
                          key={topicIndex}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            topic.completed ? "bg-green-50 border-green-200" : "bg-muted border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {topic.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">{topic.day}</p>
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
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          <div className="space-y-4">
            {filteredRoadmap.filter(item => item.status === "upcoming").length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <BookOpen className="mx-auto h-12 w-12 mb-4" />
                        No upcoming roadmap found for selected program. Plan a new week!
                    </CardContent>
                </Card>
            ) : (
                filteredRoadmap.filter(item => item.status === "upcoming").map((week, index) => (
                  <Card key={index} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-foreground">{week.program}</CardTitle>
                            <Badge variant="outline">Week {week.week}</Badge>
                          </div>
                          <CardDescription className="text-lg font-medium">{week.title}</CardDescription>
                          <p className="text-sm text-muted-foreground mt-1">
                            Starts: {new Date(week.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setPlanWeekOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Plan Week
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Planned Topics</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {week.topics.map((topic, topicIndex) => (
                            <div key={topicIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                              {topic.topic} {/* Display topic string */}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Program overview and long-term planning will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}