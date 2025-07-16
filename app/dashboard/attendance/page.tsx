"use client";

import React, { useState } from "react";
import {
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  Mail,
  UserCheck,
  GraduationCap,
  Download,
  CalendarRange,
  BarChart3,
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  name: string;
  email: string;
  type: "student" | "facilitator";
  program: string;
  subGroup: string;
  status: "present" | "absent" | "late";
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: number;
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
}

interface Programs {
  [key: string]: {
    [key: string]: string[];
  };
}

const AttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days ago
    to: new Date().toISOString().split("T")[0], // today
  });
  const [viewMode, setViewMode] = useState<"daily" | "range">("daily");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedSubGroup, setSelectedSubGroup] = useState("all");
  const [selectedType, setSelectedType] = useState<"students" | "facilitators">("students");
  const [searchTerm, setSearchTerm] = useState("");

  const programs: Programs = {
    "Tekeher Experts": {
      "Data Analytics": [],
      Software: ["Mobile", "Web"],
    },
    "Digital Marketing Bootcamp": {
      "Social Media": [],
      "Content Creation": [],
      "SEO & Analytics": [],
    },
    "Cybersecurity Program": {
      "Ethical Hacking": [],
      "Network Security": [],
    },
  };

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Software - Web",
      status: "present",
      checkInTime: "09:00",
      checkOutTime: "17:00",
      totalHours: 8,
      attendanceRate: 85,
      totalDays: 20,
      presentDays: 17,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Data Analytics",
      status: "present",
      checkInTime: "08:45",
      checkOutTime: "16:30",
      totalHours: 7.75,
      attendanceRate: 92,
      totalDays: 18,
      presentDays: 16,
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Software - Mobile",
      status: "absent",
      checkInTime: null,
      checkOutTime: null,
      totalHours: 0,
      attendanceRate: 65,
      totalDays: 15,
      presentDays: 10,
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah.wilson@facilitator.klab.rw",
      type: "facilitator",
      program: "Tekeher Experts",
      subGroup: "Software - Web",
      status: "present",
      checkInTime: "08:30",
      checkOutTime: "17:00",
      totalHours: 8.5,
      attendanceRate: 96,
      totalDays: 25,
      presentDays: 24,
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@student.klab.rw",
      type: "student",
      program: "Tekeher Experts",
      subGroup: "Data Analytics",
      status: "late",
      checkInTime: "10:30",
      checkOutTime: "17:15",
      totalHours: 6.75,
      attendanceRate: 78,
      totalDays: 22,
      presentDays: 17,
    },
    {
      id: 6,
      name: "Emily Davis",
      email: "emily.davis@facilitator.klab.rw",
      type: "facilitator",
      program: "Tekeher Experts",
      subGroup: "Software - Mobile",
      status: "present",
      checkInTime: "09:00",
      checkOutTime: "17:30",
      totalHours: 8.5,
      attendanceRate: 98,
      totalDays: 20,
      presentDays: 20,
    },
  ]);

  const filteredAttendance = attendanceData.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = selectedProgram === "all" || record.program === selectedProgram;
    const matchesSubGroup = selectedSubGroup === "all" || record.subGroup === selectedSubGroup;
    const matchesType = record.type === selectedType;
    return matchesSearch && matchesProgram && matchesSubGroup && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return "excellent";
    if (rate >= 80) return "good";
    if (rate >= 70) return "warning";
    return "critical";
  };

  const attendanceStats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter((r) => r.status === "present").length,
    absent: filteredAttendance.filter((r) => r.status === "absent").length,
    late: filteredAttendance.filter((r) => r.status === "late").length,
    students: attendanceData.filter((r) => r.type === "student").length,
    facilitators: attendanceData.filter((r) => r.type === "facilitator").length,
    criticalStudents: attendanceData.filter((r) => r.type === "student" && r.attendanceRate < 70).length,
  };

  const attendanceRate =
    attendanceStats.total > 0 ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1) : 0;

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Type",
      "Program",
      "Sub Group",
      "Status",
      "Check In",
      "Check Out",
      "Hours",
      "Attendance Rate",
      "Present Days",
      "Total Days",
    ];

    const csvData = filteredAttendance.map((record) => [
      record.name,
      record.email,
      record.type,
      record.program,
      record.subGroup,
      record.status,
      record.checkInTime || "-",
      record.checkOutTime || "-",
      record.totalHours,
      `${record.attendanceRate}%`,
      record.presentDays,
      record.totalDays,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateWeeklyReport = () => {
    // Implementation for weekly report generation
    console.log("Generating weekly report...");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Attendance Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage attendance across all programs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Present</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceStats.present}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceStats.absent}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceStats.late}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Programs</option>
                {Object.keys(programs).map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as "students" | "facilitators")}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="students">Students</option>
                <option value="facilitators">Facilitators</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{record.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{record.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.type === "student"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      }`}>
                        {record.type === "student" ? (
                          <>
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Student
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Facilitator
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{record.program}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{record.subGroup}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">{record.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.checkInTime || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.checkOutTime || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.totalHours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              getAttendanceStatus(record.attendanceRate) === "excellent"
                                ? "bg-green-500"
                                : getAttendanceStatus(record.attendanceRate) === "good"
                                ? "bg-blue-500"
                                : getAttendanceStatus(record.attendanceRate) === "warning"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${record.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">{record.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEmailClick(record.email)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      {record.attendanceRate < 70 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Critical
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Students Alert */}
        {attendanceStats.criticalStudents > 0 && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {attendanceStats.criticalStudents} student(s) with attendance rate below 70%
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Consider sending follow-up emails or scheduling meetings to address attendance issues.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage; 