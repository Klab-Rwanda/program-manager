"use client"

import { useState } from "react"
import { Calendar, Clock, BookOpen, Users, CheckCircle, AlertCircle, Plus } from "lucide-react"

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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function WeeklyRoadmap() {
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedWeek, setSelectedWeek] = useState("current")
  const [planWeekOpen, setPlanWeekOpen] = useState(false)
  const [weekPlan, setWeekPlan] = useState({
    program: "",
    weekNumber: "",
    title: "",
    startDate: "",
    objectives: "",
    topics: ["", "", "", "", ""],
  })

  const programs = [
    { id: "all", name: "All Programs" },
    { id: "software", name: "Software Engineering Bootcamp" },
    { id: "web", name: "Web Development Course" },
    { id: "mobile", name: "Mobile App Development" },
  ]

  const [weeklyRoadmap, setWeeklyRoadmap] = useState([
    {
      program: "Software Engineering Bootcamp",
      week: 3,
      title: "JavaScript Fundamentals",
      startDate: "2024-01-22",
      endDate: "2024-01-26",
      status: "current",
      topics: [
        {
          day: "Monday",
          topic: "Variables and Data Types",
          duration: "3 hours",
          type: "in-person",
          completed: true,
        },
        {
          day: "Tuesday",
          topic: "Functions and Scope",
          duration: "3 hours",
          type: "in-person",
          completed: true,
        },
        {
          day: "Wednesday",
          topic: "DOM Manipulation",
          duration: "3 hours",
          type: "in-person",
          completed: false,
        },
        {
          day: "Thursday",
          topic: "Event Handling",
          duration: "3 hours",
          type: "online",
          completed: false,
        },
        {
          day: "Friday",
          topic: "Project: Interactive Web Page",
          duration: "4 hours",
          type: "in-person",
          completed: false,
        },
      ],
      objectives: [
        "Understand JavaScript data types and variables",
        "Master function declaration and expressions",
        "Learn DOM manipulation techniques",
        "Implement event-driven programming",
        "Build an interactive web application",
      ],
      resources: 12,
      assignments: 3,
      students: 20,
    },
    {
      program: "Web Development Course",
      week: 5,
      title: "React Components",
      startDate: "2024-01-22",
      endDate: "2024-01-26",
      status: "current",
      topics: [
        {
          day: "Monday",
          topic: "Component Basics",
          duration: "2 hours",
          type: "online",
          completed: true,
        },
        {
          day: "Tuesday",
          topic: "Props and State",
          duration: "2 hours",
          type: "in-person",
          completed: true,
        },
        {
          day: "Wednesday",
          topic: "Event Handling in React",
          duration: "2 hours",
          type: "in-person",
          completed: false,
        },
        {
          day: "Thursday",
          topic: "Component Lifecycle",
          duration: "2 hours",
          type: "online",
          completed: false,
        },
        {
          day: "Friday",
          topic: "Project: Todo App",
          duration: "3 hours",
          type: "in-person",
          completed: false,
        },
      ],
      objectives: [
        "Create functional and class components",
        "Manage component state effectively",
        "Handle user interactions",
        "Understand component lifecycle",
        "Build a complete React application",
      ],
      resources: 8,
      assignments: 2,
      students: 15,
    },
  ])

  const upcomingWeeks = [
    {
      program: "Software Engineering Bootcamp",
      week: 4,
      title: "Advanced JavaScript",
      startDate: "2024-01-29",
      topics: ["Async Programming", "Promises & Async/Await", "API Integration", "Error Handling"],
    },
    {
      program: "Web Development Course",
      week: 6,
      title: "React Hooks",
      startDate: "2024-01-29",
      topics: ["useState Hook", "useEffect Hook", "Custom Hooks", "Context API"],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "upcoming":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeColor = (type: string) => {
    return type === "in-person" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
  }

  const handlePlanWeek = () => {
    if (!weekPlan.program || !weekPlan.weekNumber || !weekPlan.title) {
      alert("Please fill in all required fields")
      return
    }

    const newWeek = {
      program: programs.find((p) => p.id === weekPlan.program)?.name || "",
      week: Number.parseInt(weekPlan.weekNumber),
      title: weekPlan.title,
      startDate: weekPlan.startDate,
      endDate: new Date(new Date(weekPlan.startDate).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "upcoming" as const,
      topics: weekPlan.topics
        .filter((topic) => topic.trim())
        .map((topic, index) => ({
          day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index],
          topic: topic,
          duration: "3 hours",
          type: "in-person" as const,
          completed: false,
        })),
      objectives: weekPlan.objectives.split("\n").filter((obj) => obj.trim()),
      resources: 0,
      assignments: 0,
      students: 20,
    }

    setWeeklyRoadmap((prev) => [...prev, newWeek])
    setPlanWeekOpen(false)
    setWeekPlan({
      program: "",
      weekNumber: "",
      title: "",
      startDate: "",
      objectives: "",
      topics: ["", "", "", "", ""],
    })
    alert(`Week ${weekPlan.weekNumber} planned successfully!`)
  }

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...weekPlan.topics]
    newTopics[index] = value
    setWeekPlan({ ...weekPlan, topics: newTopics })
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

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-website-primary hover:bg-website-primary/90"
                    onClick={handlePlanWeek}
                  >
                    Create Week Plan
                  </Button>
                  <Button variant="outline" onClick={() => setPlanWeekOpen(false)}>
                    Cancel
                  </Button>
                </div>
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
          {weeklyRoadmap.map((week, index) => (
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
          ))}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          <div className="space-y-4">
            {upcomingWeeks.map((week, index) => (
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
                    <Button variant="outline" size="sm" onClick={() => setPlanWeekOpen(true)}>
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
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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