import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert,
  Dimensions 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme, 
  ActivityIndicator,
  Chip,
  Surface,
  Avatar,
  ProgressBar,
  List,
  Divider,
  FAB,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Import services
import { programService } from '../../services/program.service';
import { attendanceService } from '../../services/attendance.service';
import { assignmentService } from '../../services/assignment.service';
import { sessionService } from '../../services/session.service';
import { Program, Assignment, AttendanceRecord, Submission, ClassSession } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ModernHeader from '../../components/ModernHeader';

const { width } = Dimensions.get('window');

// Define navigation types
type TraineeTabParamList = {
  TraineeDashboard: undefined;
  AttendanceScreen: undefined;
  ProgramsScreen: undefined;
  AssignmentsScreen: undefined;
  ProfileScreen: undefined;
};

type TraineeNavigationProp = BottomTabNavigationProp<TraineeTabParamList>;

interface DashboardStats {
  enrolledPrograms: number;
  overallProgress: number;
  nextSession: string;
  pendingTasks: number;
  totalAssignments: number;
  completedAssignments: number;
  attendanceRate: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  type: 'assignment' | 'session';
  dueDate: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  programName: string;
}

export default function TraineeDashboard() {
  const theme = useTheme();
  const navigation = useNavigation<TraineeNavigationProp>();
  const { user } = useAuth();
  
  console.log('🔍 TraineeDashboard Debug:');
  console.log('User:', user ? 'exists' : 'null');
  console.log('User name:', user?.name);
  
  // Safety check - if user is null, show loading
  if (!user) {
    console.log('⚠️ User is null, showing loading');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading user data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  console.log('✅ User data loaded, rendering dashboard');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [myPrograms, setMyPrograms] = useState<Program[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    enrolledPrograms: 0,
    overallProgress: 0,
    nextSession: "No upcoming sessions",
    pendingTasks: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    attendanceRate: 0,
  });
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);

  // Calculate attendance rate for a program
  const calculateAttendanceRate = (programId: string, attendanceRecords: AttendanceRecord[]): number => {
    const programAttendance = attendanceRecords.filter(record => {
      if (!record.programId) return false;
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

  // Calculate overall progress based on attendance rate
  const calculateProgress = (attendanceRate: number): number => {
    return Math.min(attendanceRate, 100);
  };

  // Generate upcoming tasks from assignments and sessions
  const generateUpcomingTasks = (programs: Program[], assignments: Assignment[]): UpcomingTask[] => {
    const tasks: UpcomingTask[] = [];
    
    // Add assignment tasks
    assignments.forEach(assignment => {
      tasks.push({
        id: assignment._id,
        title: assignment.title,
        type: 'assignment',
        dueDate: assignment.dueDate,
        status: new Date(assignment.dueDate) < new Date() ? 'Overdue' : 'Pending',
        programName: 'Current Program', // Default program name since assignment doesn't have program property
      });
    });
    
    return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  // Find next session from real session data
  const findNextSession = async (): Promise<string> => {
    try {
      const nextSession = await sessionService.getNextSession();
      if (!nextSession) {
        return "No upcoming sessions";
      }
      
      const sessionDate = new Date(nextSession.startTime);
      const now = new Date();
      const diffTime = sessionDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return "Session in progress";
      } else if (diffDays === 0) {
        return `Today, ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `Tomorrow, ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return `${sessionDate.toLocaleDateString()} at ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    } catch (error) {
      console.error('Error finding next session:', error);
      // Return a default message instead of throwing
      return "No upcoming sessions";
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [programsData, attendanceData, assignmentsData, submissionsData] = await Promise.all([
        programService.getMyPrograms(),
        attendanceService.getMyAttendanceHistory(),
        assignmentService.getMyAssignments(),
        assignmentService.getMySubmissions(),
      ]);

      setMyPrograms(programsData);
      setAttendanceHistory(attendanceData);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);

      // Calculate enhanced programs with progress
      const enhancedPrograms = programsData.map(program => ({
        ...program,
        attendanceRate: calculateAttendanceRate(program._id, attendanceData),
        progress: calculateProgress(calculateAttendanceRate(program._id, attendanceData)),
      }));

      // Calculate dashboard stats
      const overallProgress = enhancedPrograms.length > 0 
        ? Math.round(enhancedPrograms.reduce((sum, p) => sum + p.progress, 0) / enhancedPrograms.length)
        : 0;

      const tasks = generateUpcomingTasks(programsData, assignmentsData);
      const pendingTasksCount = tasks.filter(t => t.status === 'Pending').length;
      const completedAssignmentsCount = submissionsData.length;
      const totalAssignmentsCount = assignmentsData.length;
      const overallAttendanceRate = enhancedPrograms.length > 0
        ? Math.round(enhancedPrograms.reduce((sum, p) => sum + p.attendanceRate, 0) / enhancedPrograms.length)
        : 0;

      // Get next session data
      const nextSessionText = await findNextSession();

      setStats({
        enrolledPrograms: programsData.length,
        overallProgress,
        nextSession: nextSessionText,
        pendingTasks: pendingTasksCount,
        totalAssignments: totalAssignmentsCount,
        completedAssignments: completedAssignmentsCount,
        attendanceRate: overallAttendanceRate,
      });

      setUpcomingTasks(tasks.slice(0, 5)); // Show only top 5 tasks

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleMarkAttendance = () => {
    navigation.navigate('AttendanceScreen');
  };

  const handleViewAssignments = () => {
    navigation.navigate('AssignmentsScreen');
  };

  const handleViewPrograms = () => {
    navigation.navigate('ProgramsScreen');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return theme.colors.primary;
      case 'Overdue':
        return theme.colors.error;
      case 'Pending':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={48} 
            color={theme.colors.error} 
          />
          <Text variant="titleMedium" style={{ color: theme.colors.error, marginTop: 16 }}>
            {error}
          </Text>
          <Button 
            mode="contained" 
            onPress={loadDashboardData}
            style={{ marginTop: 16 }}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <ModernHeader 
          title={`${getGreeting()}, ${user?.name ? user.name.split(' ')[0] : 'Trainee'}!`} 
          subtitle="Here's your progress today" 
          icon="view-dashboard"
          showAvatar={true}
          userInitials={user?.name ? user.name.substring(0, 2).toUpperCase() : 'T'}
          gradient={true}
        />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={32} 
                color={theme.colors.primary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer, marginTop: 8 }}>
                {stats.attendanceRate}%
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Attendance
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="file-document" 
                size={32} 
                color={theme.colors.secondary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSecondaryContainer, marginTop: 8 }}>
                {stats.completedAssignments}/{stats.totalAssignments}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Assignments
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="school" 
                size={32} 
                color={theme.colors.tertiary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onTertiaryContainer, marginTop: 8 }}>
                {stats.enrolledPrograms}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Programs
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Overall Progress */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Overall Progress
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {stats.overallProgress}% Complete
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {stats.nextSession}
                </Text>
              </View>
              <ProgressBar 
                progress={stats.overallProgress / 100} 
                color={theme.colors.primary}
                style={{ marginTop: 8 }}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Quick Actions
            </Text>
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="qrcode-scan"
                onPress={handleMarkAttendance}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onPrimary }}
              >
                Mark Attendance
              </Button>
              
              <Button
                mode="outlined"
                icon="file-document-outline"
                onPress={handleViewAssignments}
                style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                View Assignments
              </Button>

              <Button
                mode="outlined"
                icon="school-outline"
                onPress={handleViewPrograms}
                style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                My Programs
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                Upcoming Tasks
              </Text>
              
              {upcomingTasks.map((task, index) => (
                <View key={task.id}>
                  <List.Item
                    title={task.title}
                    description={`${task.programName} • ${formatDate(task.dueDate)}`}
                    left={(props) => (
                      <List.Icon 
                        {...props} 
                        icon={task.type === 'assignment' ? 'file-document' : 'calendar'} 
                        color={getStatusColor(task.status)}
                      />
                    )}
                    right={() => (
                      <Chip 
                        mode="flat" 
                        compact 
                        style={{ 
                          backgroundColor: getStatusColor(task.status) + '20',
                          minWidth: 80,
                          height: 34,
                          marginLeft: 8,
                          paddingHorizontal: 8
                        }}
                        textStyle={{ 
                          color: getStatusColor(task.status),
                          fontSize: 11,
                          fontWeight: '600',
                          textAlign: 'center'
                        }}
                      >
                        {task.status}
                      </Chip>
                    )}
                    titleStyle={{ 
                      color: theme.colors.onSurface,
                      fontSize: 14,
                      fontWeight: '600',
                      flex: 1,
                      marginRight: 8
                    }}
                    descriptionStyle={{ 
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 12,
                      flex: 1,
                      marginRight: 8
                    }}
                    style={{ 
                      paddingVertical: 8,
                      paddingRight: 4
                    }}
                  />
                  {index < upcomingTasks.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* My Programs */}
        {myPrograms.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                My Programs
              </Text>
              
              {myPrograms.slice(0, 3).map((program, index) => (
                <View key={program._id}>
                  <List.Item
                    title={program.name}
                    description={`${program.description?.substring(0, 50)}...`}
                    left={(props) => (
                      <List.Icon 
                        {...props} 
                        icon="school" 
                        color={theme.colors.primary}
                      />
                    )}
                    right={() => (
                      <Chip 
                        mode="flat" 
                        compact 
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        textStyle={{ color: theme.colors.onPrimaryContainer }}
                      >
                        {program.status}
                      </Chip>
                    )}
                    titleStyle={{ color: theme.colors.onSurface }}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                  />
                  {index < Math.min(myPrograms.length, 3) - 1 && <Divider />}
                </View>
              ))}
              
              {myPrograms.length > 3 && (
                <Button
                  mode="text"
                  onPress={handleViewPrograms}
                  style={{ marginTop: 8 }}
                >
                  View All Programs ({myPrograms.length})
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Recent Activity */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Recent Activity
            </Text>
            
            {attendanceHistory.length > 0 && (
              <List.Item
                title="Attendance marked"
                description={`${attendanceHistory[0]?.date || 'Recently'}`}
                left={(props) => (
                  <List.Icon 
                    {...props} 
                    icon="check-circle" 
                    color={theme.colors.tertiary}
                  />
                )}
                titleStyle={{ color: theme.colors.onSurface }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              />
            )}
            
            {submissions.length > 0 && (
              <>
                {attendanceHistory.length > 0 && <Divider />}
                <List.Item
                  title="Assignment submitted"
                  description={`${submissions[0]?.submittedAt ? new Date(submissions[0].submittedAt).toLocaleDateString() : 'Recently'}`}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon="file-document" 
                      color={theme.colors.secondary}
                    />
                  )}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
              </>
            )}
            
            {myPrograms.length > 0 && (
              <>
                {(attendanceHistory.length > 0 || submissions.length > 0) && <Divider />}
                <List.Item
                  title="Program enrolled"
                  description={`${myPrograms[0]?.name || 'Program'}`}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon="school" 
                      color={theme.colors.primary}
                    />
                  )}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
              </>
            )}

            {attendanceHistory.length === 0 && submissions.length === 0 && myPrograms.length === 0 && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: 16 }}>
                No recent activity
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleMarkAttendance}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
  },
  actionButtonContent: {
    height: 48,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});