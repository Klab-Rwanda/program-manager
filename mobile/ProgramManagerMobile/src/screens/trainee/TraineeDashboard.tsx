import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import services - Same as web app
import { getAllPrograms } from '../../services/program.service';
import { getMyAttendanceHistory } from '../../services/attendance.service';
import api from '../../services/api';
import { Program, AttendanceRecord, Assignment } from '../../types';

// Extended Program interface with calculated progress - Same as web app
interface DashboardProgram extends Program {
  progress: number;
  nextSession?: string;
  attendanceRate?: number;
}

interface DashboardStats {
  enrolledPrograms: number;
  overallProgress: number;
  nextSession: string;
  pendingTasks: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string;
  program: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  type: 'assignment' | 'session';
}

export default function TraineeDashboard() {
  const [myPrograms, setMyPrograms] = useState<DashboardProgram[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    enrolledPrograms: 0,
    overallProgress: 0,
    nextSession: "No upcoming sessions",
    pendingTasks: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);

  // Calculate attendance rate for a program - Same logic as web app
  const calculateAttendanceRate = (programId: string, attendanceRecords: AttendanceRecord[]): number => {
    const programAttendance = attendanceRecords.filter(record => {
      if (!record.programId) return false;
      // Handle both populated object and string cases
      const recordProgramId = typeof record.programId === 'object' 
        ? record.programId._id 
        : record.programId;
      return recordProgramId === programId;
    });
    
    if (programAttendance.length === 0) return 100;
    
    const presentCount = programAttendance.filter(record => 
      record.status === 'Present' || record.status === 'Late'
    ).length;
    
    return Math.round((presentCount / programAttendance.length) * 100);
  };

  // Calculate overall progress based on attendance rate - Same logic as web app
  const calculateProgress = (attendanceRate: number): number => {
    return Math.min(attendanceRate, 100);
  };

  // Generate upcoming tasks from assignments and sessions - Same logic as web app
  const generateUpcomingTasks = (programs: Program[], assignments: Assignment[]): UpcomingTask[] => {
    const tasks: UpcomingTask[] = [];

    // Add assignment-based tasks
    assignments.forEach(assignment => {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      
      if (dueDate > now) {
        tasks.push({
          id: assignment._id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          program: typeof assignment.program === 'object' ? assignment.program.name : 'Unknown Program',
          status: 'Pending',
          type: 'assignment'
        });
      }
    });

    return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  // Find next session - Same logic as web app
  const findNextSession = (programs: DashboardProgram[]): string => {
    if (programs.length === 0) return "No upcoming sessions";
    return "Today, 2:00 PM"; // Placeholder - same as web app
  };

  // Fetch all dashboard data - Same logic as web app
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch programs and attendance in parallel - Same as web app
        const [programsData, attendanceData] = await Promise.all([
          getAllPrograms(),
          getMyAttendanceHistory().catch(() => []), // Don't fail if attendance service fails
        ]);

        // Fetch assignments for active programs - Same as web app
        let assignmentsData: Assignment[] = [];
        try {
          const assignmentPromises = programsData
            .filter(p => p.status === 'Active')
            .map(program => 
              api.get(`/assignments/program/${program._id}`)
                .then(res => res.data.data)
                .catch(() => [])
            );
          
          const assignmentArrays = await Promise.all(assignmentPromises);
          assignmentsData = assignmentArrays.flat();
        } catch (error) {
          console.error("Failed to fetch assignments:", error);
        }

        // Filter active programs and calculate progress - Same as web app
        const activePrograms = programsData.filter(p => p.status === 'Active');
        const enhancedPrograms: DashboardProgram[] = activePrograms.map(program => {
          const attendanceRate = calculateAttendanceRate(program._id, attendanceData);
          return {
            ...program,
            progress: calculateProgress(attendanceRate),
            attendanceRate,
            nextSession: "Next session info"
          };
        });

        // Calculate dashboard stats - Same as web app
        const overallProgress = enhancedPrograms.length > 0 
          ? Math.round(enhancedPrograms.reduce((sum, p) => sum + p.progress, 0) / enhancedPrograms.length)
          : 0;

        const tasks = generateUpcomingTasks(programsData, assignmentsData);
        const pendingTasksCount = tasks.filter(t => t.status === 'Pending').length;

        setMyPrograms(enhancedPrograms);
        setAttendanceHistory(attendanceData);
        setAssignments(assignmentsData);
        setUpcomingTasks(tasks);
        setStats({
          enrolledPrograms: enhancedPrograms.length,
          overallProgress,
          nextSession: findNextSession(enhancedPrograms),
          pendingTasks: pendingTasksCount
        });

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f497d" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const dashboardStats = [
    {
      title: "Enrolled Programs",
      value: stats.enrolledPrograms.toString(),
      change: "Active courses",
      icon: "book-outline",
      color: "#1f497d",
    },
    {
      title: "Overall Progress",
      value: `${stats.overallProgress}%`,
      change: "Based on attendance",
      icon: "trending-up-outline",
      color: "#1f497d",
    },
    {
      title: "Next Session",
      value: stats.nextSession,
      change: "Today's schedule",
      icon: "time-outline",
      color: "#1f497d",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks.toString(),
      change: "Assignments due",
      icon: "checkmark-circle-outline",
      color: "#1f497d",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomeSubtitle}>Ready to continue your learning journey?</Text>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        {dashboardStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statChange}>{stat.change}</Text>
          </View>
        ))}
      </View>

      {/* My Learning Path */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Learning Path</Text>
        {myPrograms.map((program) => (
          <View key={program._id} style={styles.programCard}>
            <View style={styles.programHeader}>
              <Text style={styles.programName}>{program.name}</Text>
              <Text style={styles.programStatus}>{program.status}</Text>
            </View>
            <Text style={styles.programDescription}>{program.description}</Text>
            <View style={styles.programStats}>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Progress: {program.progress}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${program.progress}%` }]} />
                </View>
              </View>
              <Text style={styles.attendanceText}>Attendance: {program.attendanceRate}%</Text>
            </View>
            <View style={styles.programActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="camera-outline" size={16} color="#1f497d" />
                <Text style={styles.actionText}>Mark Attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="document-outline" size={16} color="#1f497d" />
                <Text style={styles.actionText}>Submit Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Upcoming Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
        {upcomingTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Ionicons 
                name={task.type === 'assignment' ? 'document-outline' : 'time-outline'} 
                size={20} 
                color="#1f497d" 
              />
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>
            <Text style={styles.taskProgram}>{task.program}</Text>
            <Text style={styles.taskDueDate}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
            <View style={styles.taskStatus}>
              <Text style={styles.taskStatusText}>{task.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  welcomeSection: {
    backgroundColor: '#1f497d',
    padding: 20,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    margin: 5,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f497d',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 10,
    color: '#999',
  },
  section: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  programName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  programStatus: {
    fontSize: 12,
    color: '#1f497d',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  programDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  programStats: {
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#1f497d',
    borderRadius: 3,
  },
  attendanceText: {
    fontSize: 12,
    color: '#666',
  },
  programActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#1f497d',
    marginLeft: 4,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  taskProgram: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  taskStatus: {
    alignSelf: 'flex-start',
  },
  taskStatusText: {
    fontSize: 10,
    color: '#1f497d',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
}); 