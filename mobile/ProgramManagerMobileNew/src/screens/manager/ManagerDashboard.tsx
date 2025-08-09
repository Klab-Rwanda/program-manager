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
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Import services
import { programService } from '../../services/program.service';
import { Program } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ModernHeader from '../../components/ModernHeader';

interface DashboardStats {
  activePrograms: number;
  totalTrainees: number;
  pendingApprovals: number;
  totalFacilitators: number;
  completionRate: number;
  totalRevenue: number;
}

interface PendingApproval {
  id: string;
  type: 'course' | 'program' | 'curriculum' | 'assignment';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  priority: 'low' | 'medium' | 'high';
}

export default function ManagerDashboard() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Safety check - if user is null, show loading
  if (!user) {
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
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [myPrograms, setMyPrograms] = useState<Program[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activePrograms: 0,
    totalTrainees: 0,
    pendingApprovals: 0,
    totalFacilitators: 0,
    completionRate: 0,
    totalRevenue: 0,
  });

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch programs data
      const programsData = await programService.getAllPrograms();
      setMyPrograms(programsData);

      // Calculate dashboard stats
      const activePrograms = programsData.filter(p => p.status === 'active').length;
      const completedPrograms = programsData.filter(p => p.status === 'completed').length;
      const pendingPrograms = programsData.filter(p => p.status === 'pending').length;
      const totalTrainees = programsData.reduce((sum, program) => {
        return sum + (program.trainees?.length || 0);
      }, 0);
      const totalFacilitators = programsData.reduce((sum, program) => {
        return sum + (program.facilitators?.length || 0);
      }, 0);

      // Mock pending approvals (in real app, this would come from API)
      const mockApprovals: PendingApproval[] = [
        {
          id: '1',
          type: 'course',
          title: 'Advanced React Development',
          description: 'New course request for advanced React concepts',
          requestedBy: 'Sarah Johnson',
          requestedAt: new Date().toISOString(),
          priority: 'high',
        },
        {
          id: '2',
          type: 'program',
          title: 'Updated curriculum for Web Development',
          description: 'Program update request with new modules',
          requestedBy: 'Mike Chen',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
          priority: 'medium',
        },
      ];

      setPendingApprovals(mockApprovals);

      // Calculate completion rate (mock data for now)
      const completionRate = Math.round(Math.random() * 30 + 70); // 70-100%
      const totalRevenue = programsData.length * 5000; // Mock revenue calculation

      setStats({
        activePrograms,
        totalTrainees,
        pendingApprovals: mockApprovals.length,
        totalFacilitators,
        completionRate,
        totalRevenue,
      });

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

  const handleCreateProgram = () => {
    navigation.navigate('Programs' as never);
  };

  const handleReviewApprovals = () => {
    navigation.navigate('Approvals' as never);
  };

  const handleViewPrograms = () => {
    navigation.navigate('Programs' as never);
  };

  const handleApprove = (approvalId: string) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => {
            // In real app, this would call an API
            setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
            setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
          }
        },
      ]
    );
  };

  const handleReject = (approvalId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            // In real app, this would call an API
            setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
            setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return theme.colors.primary;
      case 'Inactive':
        return theme.colors.error;
      case 'Draft':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.tertiary;
      case 'low':
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return 'book-open';
      case 'program':
        return 'school';
      case 'curriculum':
        return 'file-document';
      case 'assignment':
        return 'file-document-outline';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
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
          title={`${getGreeting()}, ${user?.name ? user.name.split(' ')[0] : 'Manager'}!`}
          subtitle="Here's your program overview"
          icon="view-dashboard"
          showAvatar={true}
          userInitials={user?.name ? user.name.substring(0, 2).toUpperCase() : 'M'}
          gradient={true}
        />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="school" 
                size={32} 
                color={theme.colors.primary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer, marginTop: 8 }}>
                {stats.activePrograms}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Active Programs
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="account-group" 
                size={32} 
                color={theme.colors.secondary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSecondaryContainer, marginTop: 8 }}>
                {stats.totalTrainees}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Total Trainees
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="check-decagram" 
                size={32} 
                color={theme.colors.tertiary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onTertiaryContainer, marginTop: 8 }}>
                {stats.pendingApprovals}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Pending Approvals
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Additional Stats */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.errorContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="account-tie" 
                size={32} 
                color={theme.colors.error} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onErrorContainer, marginTop: 8 }}>
                {stats.totalFacilitators}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Facilitators
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="trending-up" 
                size={32} 
                color={theme.colors.primary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer, marginTop: 8 }}>
                {stats.completionRate}%
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Completion Rate
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={2}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons 
                name="currency-usd" 
                size={32} 
                color={theme.colors.secondary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onSecondaryContainer, marginTop: 8 }}>
                ${(stats.totalRevenue / 1000).toFixed(0)}k
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Revenue
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Quick Actions
            </Text>
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="plus"
                onPress={handleCreateProgram}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onPrimary }}
              >
                Create Program
              </Button>
              
              <Button
                mode="outlined"
                icon="check-decagram"
                onPress={handleReviewApprovals}
                style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                Review Approvals
              </Button>

              <Button
                mode="outlined"
                icon="school-outline"
                onPress={handleViewPrograms}
                style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                Manage Programs
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Programs */}
        {myPrograms.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                Recent Programs
              </Text>
              
              {myPrograms.slice(0, 3).map((program, index) => (
                <View key={program._id}>
                  <List.Item
                    title={program.name}
                    description={`${program.trainees?.length || 0} trainees • ${Math.round(Math.random() * 30 + 70)}% completion rate`}
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
                        style={{ backgroundColor: getStatusColor(program.status) + '20' }}
                        textStyle={{ color: getStatusColor(program.status) }}
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

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                Pending Approvals
              </Text>
              
              {pendingApprovals.map((approval, index) => (
                <View key={approval.id}>
                  <View style={styles.approvalItem}>
                    <View style={styles.approvalContent}>
                      <View style={styles.approvalHeader}>
                        <MaterialCommunityIcons 
                          name={getTypeIcon(approval.type) as any} 
                          size={20} 
                          color={theme.colors.primary} 
                        />
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                          {approval.title}
                        </Text>
                        <Chip 
                          mode="flat" 
                          compact 
                          style={{ backgroundColor: getPriorityColor(approval.priority) + '20' }}
                          textStyle={{ color: getPriorityColor(approval.priority) }}
                        >
                          {approval.priority}
                        </Chip>
                      </View>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        {approval.description}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        Requested by {approval.requestedBy} • {formatDate(approval.requestedAt)}
                      </Text>
                    </View>
                    <View style={styles.approvalActions}>
                      <IconButton
                        icon="check"
                        size={20}
                        iconColor={theme.colors.tertiary}
                        onPress={() => handleApprove(approval.id)}
                        style={{ backgroundColor: theme.colors.tertiaryContainer }}
                      />
                      <IconButton
                        icon="close"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => handleReject(approval.id)}
                        style={{ backgroundColor: theme.colors.errorContainer }}
                      />
                    </View>
                  </View>
                  {index < pendingApprovals.length - 1 && <Divider style={{ marginVertical: 12 }} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Bottom spacing for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateProgram}
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
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  approvalContent: {
    flex: 1,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});