"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, QrCode, Clock, Users, CheckCircle, Share2, Copy, Eye, UserCheck } from "lucide-react";

import { AppSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AttendanceTracking() {
  const [sessionType, setSessionType] = useState<"in-person" | "online" | "qr-individual" | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [attendanceLink, setAttendanceLink] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [viewQRCodesOpen, setViewQRCodesOpen] = useState(false);
  const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [excuseReason, setExcuseReason] = useState("");

  const programs = [
    { id: "1", name: "Software Engineering Bootcamp" },
    { id: "2", name: "Web Development Course" },
    { id: "3", name: "Mobile App Development" },
    { id: "4", name: "Data Science Fundamentals" },
  ];

  const attendanceStats = [
    {
      title: "Weekly Attendance",
      value: "89%",
      description: "Average this week",
      icon: Clock,
      color: "text-green-500",
    },
    {
      title: "Monthly Attendance",
      value: "92%",
      description: "January average",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Today's Sessions",
      value: "3",
      description: "2 QR-based, 1 online",
      icon: CheckCircle,
      color: "text-yellow-500",
    },
  ];

  const [studentAttendance, setStudentAttendance] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@klab.rw",
      status: "Present",
      time: "9:15 AM",
      method: "QR Code Scan",
      program: "Software Engineering",
      qrCode: "QR-ALICE-SE-20240111-001",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob.smith@klab.rw",
      status: "Present",
      time: "9:10 AM",
      method: "QR Code Scan",
      program: "Software Engineering",
      qrCode: "QR-BOB-SE-20240111-002",
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol.davis@klab.rw",
      status: "Present",
      time: "9:20 AM",
      method: "QR Code Scan",
      program: "Web Development",
      qrCode: "QR-CAROL-WD-20240111-003",
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david.wilson@klab.rw",
      status: "Absent",
      time: "-",
      method: "-",
      program: "Software Engineering",
      qrCode: "QR-DAVID-SE-20240111-004",
    },
    {
      id: 5,
      name: "Emma Brown",
      email: "emma.brown@klab.rw",
      status: "Present",
      time: "9:05 AM",
      method: "QR Code Scan",
      program: "Web Development",
      qrCode: "QR-EMMA-WD-20240111-005",
    },
  ]);

  const weeklyAttendance = [
    { date: "2024-01-22", qrBased: 95, online: 92, inPerson: 85, overall: 91 },
    { date: "2024-01-23", qrBased: 97, online: 95, inPerson: 88, overall: 93 },
    { date: "2024-01-24", qrBased: 94, online: 89, inPerson: 82, overall: 88 },
    { date: "2024-01-25", qrBased: 96, online: 94, inPerson: 90, overall: 93 },
    { date: "2024-01-26", qrBased: 98, online: 91, inPerson: 87, overall: 92 },
  ];

  const monthlyAttendance = [
    { week: "Week 1", qrBased: 96, online: 93, inPerson: 88, overall: 92 },
    { week: "Week 2", qrBased: 94, online: 91, inPerson: 85, overall: 90 },
    { week: "Week 3", qrBased: 97, online: 94, inPerson: 89, overall: 93 },
    { week: "Week 4", qrBased: 98, online: 96, inPerson: 92, overall: 95 },
  ];

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationEnabled(true);
          alert(
            `Location enabled! Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
          );
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Location access denied. Please enable location services.");
        },
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  const startInPersonSession = useCallback(() => {
    getCurrentLocation();
    setSessionType("in-person");
    setSessionStarted(true);

    // Generate session ID for tracking
    const sessionId = Math.random().toString(36).substr(2, 9).toUpperCase();
    setCurrentSessionId(sessionId);
    console.log("In-person session started with location tracking:", sessionId);
  }, [getCurrentLocation]);

  const startOnlineSession = useCallback(() => {
    setSessionType("online");
    setSessionStarted(true);

    // Generate QR code and shareable link
    const sessionId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const qrCodeValue = `KLAB-ONLINE-${sessionId}`;
    const shareableLink = `https://klab-attendance.vercel.app/online-attendance?session=${sessionId}&type=online`;

    setQrCode(qrCodeValue);
    setAttendanceLink(shareableLink);
    setCurrentSessionId(sessionId);

    console.log("Online session started with QR code:", qrCodeValue);
  }, []);

  const createQRBasedSession = useCallback(() => {
    if (!sessionName || !selectedProgram) {
      alert("Please fill in session name and select a program");
      return;
    }

    setSessionType("qr-individual");
    setSessionStarted(true);

    // Generate unique session ID
    const sessionId = `${selectedProgram}-${new Date().toISOString().split("T")[0]}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setCurrentSessionId(sessionId);

    // Generate individual QR codes for each student
    const updatedStudents = studentAttendance.map((student, index) => ({
      ...student,
      qrCode: `QR-${student.name.replace(/\s+/g, "").toUpperCase()}-${sessionId}-${String(index + 1).padStart(3, "0")}`,
      status: "Absent", // Reset status for new session
      time: "-",
      method: "-",
    }));

    setStudentAttendance(updatedStudents);
    setCreateSessionOpen(false);

    console.log("QR-based session created:", sessionId);
  }, [sessionName, selectedProgram, studentAttendance]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const shareAttendanceLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Klab Online Class Attendance",
          text: "Join the online class and mark your attendance",
          url: attendanceLink,
        });
      } catch (error) {
        console.log("Error sharing:", error);
        copyToClipboard(attendanceLink);
      }
    } else {
      copyToClipboard(attendanceLink);
    }
  };

  const markStudentExcused = () => {
    if (!selectedStudent || !excuseReason.trim()) {
      alert("Please provide a reason for the excuse");
      return;
    }

    setStudentAttendance((prev) =>
      prev.map((student) =>
        student.id === selectedStudent.id
          ? {
              ...student,
              status: "Excused",
              method: "Manual Override",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          : student,
      ),
    );

    setExcuseDialogOpen(false);
    setSelectedStudent(null);
    setExcuseReason("");
    alert(`${selectedStudent.name} has been marked as excused: ${excuseReason}`);
  };

  // Simulate QR code scanning
  useEffect(() => {
    if (sessionStarted && sessionType === "qr-individual") {
      const interval = setInterval(() => {
        setStudentAttendance((prev) => {
          const updated = [...prev];
          const absentStudent = updated.find((s) => s.status === "Absent");
          if (absentStudent && Math.random() > 0.7) {
            absentStudent.status = "Present";
            absentStudent.time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            absentStudent.method = "QR Code Scan";
          }
          return updated;
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sessionStarted, sessionType]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Attendance Tracking</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Session Start Section */}
          <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0">
            <CardHeader>
              <CardTitle className="text-xl">Start Attendance Session</CardTitle>
              <CardDescription className="text-gray-300">
                Choose your session type to begin tracking attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!sessionStarted ? (
                <div className="space-y-4">
                  {/* Primary QR-Based Method */}
                  <div className="p-4 bg-white/10 rounded-lg border-2 border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <QrCode className="h-6 w-6 text-yellow-400" />
                      <div>
                        <h3 className="font-semibold text-white">QR Code-Based Attendance (Recommended)</h3>
                        <p className="text-sm text-gray-300">Each student gets their unique QR code for the session</p>
                      </div>
                    </div>
                    <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 w-full">
                          <QrCode className="mr-2 h-5 w-5" />
                          Create QR-Based Session
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create QR-Based Session</DialogTitle>
                          <DialogDescription>
                            Set up a new class session with individual QR codes for each student
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="session-name">Session Name</Label>
                            <Input
                              id="session-name"
                              placeholder="e.g., Math Class - July 11"
                              value={sessionName}
                              onChange={(e) => setSessionName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="program">Select Program</Label>
                            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a program" />
                              </SelectTrigger>
                              <SelectContent>
                                {programs.map((program) => (
                                  <SelectItem key={program.id} value={program.id}>
                                    {program.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-[#1f497d] hover:bg-[#1a3d6b]" onClick={createQRBasedSession}>
                              Create Session
                            </Button>
                            <Button variant="outline" onClick={() => setCreateSessionOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Other Methods */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100" onClick={startInPersonSession}>
                      <MapPin className="mr-2 h-5 w-5" />
                      Start In-Person Session
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                      onClick={startOnlineSession}
                    >
                      <QrCode className="mr-2 h-5 w-5" />
                      Start Online Session
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <div>
                      <p className="font-medium">
                        {sessionType === "qr-individual"
                          ? "QR-Based"
                          : sessionType === "in-person"
                            ? "In-Person"
                            : "Online"}{" "}
                        Session Active
                      </p>
                      <p className="text-sm text-gray-300">
                        {sessionName && `${sessionName} • `}
                        Started at {new Date().toLocaleTimeString()} • Session ID: {currentSessionId}
                      </p>
                    </div>
                  </div>

                  {/* QR Codes Display for Individual Method */}
                  {sessionType === "qr-individual" && (
                    <div className="p-4 bg-white/10 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">Individual Student QR Codes</h4>
                        <Dialog open={viewQRCodesOpen} onOpenChange={setViewQRCodesOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View All QR Codes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Student QR Codes - {sessionName}</DialogTitle>
                              <DialogDescription>
                                Individual QR codes for each student. Share these with students for attendance.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {studentAttendance.map((student) => (
                                <div key={student.id} className="p-4 border rounded-lg text-center space-y-2">
                                  <div className="bg-white p-4 rounded-lg">
                                    <div className="w-24 h-24 bg-black mx-auto flex items-center justify-center text-white text-xs">
                                      QR: {student.name.split(" ")[0]}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                    <p className="text-xs font-mono bg-muted p-1 rounded mt-1">{student.qrCode}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(student.qrCode)}
                                    className="w-full"
                                  >
                                    <Copy className="mr-1 h-3 w-3" />
                                    Copy Code
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <p className="text-sm text-gray-300">
                        Each student has a unique QR code for this session. Students scan their code to mark attendance.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                          onClick={() => setViewQRCodesOpen(true)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View QR Codes
                        </Button>
                        <Button variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share with Students
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Location Info for In-Person */}
                  {sessionType === "in-person" && currentLocation && (
                    <div className="p-4 bg-white/10 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Session Location</h4>
                      <p className="text-sm text-gray-300">
                        Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Students must be within 100m radius to mark attendance
                      </p>
                    </div>
                  )}

                  {/* QR Code for Online */}
                  {sessionType === "online" && qrCode && attendanceLink && (
                    <div className="p-4 bg-white/10 rounded-lg space-y-4">
                      <div className="text-center">
                        <h4 className="font-medium text-white mb-2">Student Attendance QR Code</h4>

                        {/* QR Code Display */}
                        <div className="bg-white p-4 rounded-lg inline-block mb-4">
                          <div className="w-32 h-32 bg-black flex items-center justify-center text-white text-xs">
                            QR: {qrCode}
                          </div>
                        </div>
                      </div>

                      {/* Shareable Link */}
                      <div className="space-y-2">
                        <Label className="text-white">Attendance Link:</Label>
                        <div className="flex gap-2">
                          <Input value={attendanceLink} readOnly className="bg-white/20 text-white border-white/30" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(attendanceLink)}
                            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Share Button */}
                      <Button
                        variant="outline"
                        onClick={shareAttendanceLink}
                        className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share with Students
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            {attendanceStats.map((stat, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="live" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="live">Live Attendance</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-4 mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">
                        Today's Attendance
                        {sessionStarted && <Badge className="ml-2 bg-green-500">Live</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {sessionStarted ? "Real-time attendance tracking" : "Start a session to monitor attendance"}
                      </CardDescription>
                    </div>
                    {sessionStarted && sessionType === "qr-individual" && (
                      <Button
                        variant="outline"
                        onClick={() => setViewQRCodesOpen(true)}
                        className="border-[#1f497d] text-[#1f497d] hover:bg-[#1f497d] hover:text-white bg-transparent"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        View QR Codes
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentAttendance.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-3 w-3 rounded-full transition-colors ${
                              student.status === "Present"
                                ? "bg-green-500"
                                : student.status === "Excused"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                            <p className="text-xs text-muted-foreground">{student.program}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <Badge
                              variant={
                                student.status === "Present"
                                  ? "default"
                                  : student.status === "Excused"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className={
                                student.status === "Present"
                                  ? "bg-green-500"
                                  : student.status === "Excused"
                                    ? "bg-blue-500"
                                    : ""
                              }
                            >
                              {student.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {student.time !== "-" && (
                                <>
                                  <p>{student.time}</p>
                                  <p className="flex items-center gap-1">
                                    {student.method === "QR Code Scan" ? (
                                      <QrCode className="h-3 w-3" />
                                    ) : student.method === "Geolocation" ? (
                                      <MapPin className="h-3 w-3" />
                                    ) : student.method === "Manual Override" ? (
                                      <UserCheck className="h-3 w-3" />
                                    ) : null}
                                    {student.method}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          {student.status === "Absent" && (
                            <Dialog
                              open={excuseDialogOpen && selectedStudent?.id === student.id}
                              onOpenChange={(open) => {
                                setExcuseDialogOpen(open);
                                if (!open) {
                                  setSelectedStudent(null);
                                  setExcuseReason("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedStudent(student)}
                                  className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white bg-transparent"
                                >
                                  <UserCheck className="mr-1 h-3 w-3" />
                                  Excuse
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Mark Student as Excused</DialogTitle>
                                  <DialogDescription>
                                    Mark {student.name} as excused for this session with a valid reason.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="excuse-reason">Reason for Excuse</Label>
                                    <Textarea
                                      id="excuse-reason"
                                      placeholder="e.g., Medical appointment, Family emergency, etc."
                                      value={excuseReason}
                                      onChange={(e) => setExcuseReason(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                                      onClick={markStudentExcused}
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Mark as Excused
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setExcuseDialogOpen(false);
                                        setSelectedStudent(null);
                                        setExcuseReason("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Weekly Attendance Report</CardTitle>
                  <CardDescription>Attendance breakdown by session type</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>QR-Based</TableHead>
                        <TableHead>Online</TableHead>
                        <TableHead>In-Person</TableHead>
                        <TableHead>Overall</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyAttendance.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{new Date(day.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-yellow-500" />
                              {day.qrBased}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-blue-500" />
                              {day.online}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-500" />
                              {day.inPerson}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              {day.overall}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4 mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Monthly Attendance Report</CardTitle>
                  <CardDescription>January 2024 attendance summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead>QR-Based Sessions</TableHead>
                        <TableHead>Online Sessions</TableHead>
                        <TableHead>In-Person Sessions</TableHead>
                        <TableHead>Overall Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyAttendance.map((week, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{week.week}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-yellow-500" />
                              {week.qrBased}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-blue-500" />
                              {week.online}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-500" />
                              {week.inPerson}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              {week.overall}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Historical attendance data will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
