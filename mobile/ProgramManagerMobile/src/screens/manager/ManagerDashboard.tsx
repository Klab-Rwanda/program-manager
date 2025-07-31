import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import services
import { getAllPrograms } from '../../services/program.service';
import { Program } from '../../types';

interface DashboardStats {
  totalPrograms: number;
  activePrograms: number;
  pendingApprovals: number;
  completedPrograms: number;
}

export default function ManagerDashboard() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    activePrograms: 0,
    pendingApprovals: 0,
    completedPrograms: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const programsData = await getAllPrograms();
      setPrograms(programsData);

      // Calculate stats
      const activePrograms = programsData.filter(p => p.status === 'Active').length;
      const pendingApprovals = programsData.filter(p => p.status === 'PendingApproval').length;
      const completedPrograms = programsData.filter(p => p.status === 'Completed').length;

      setStats({
        totalPrograms: programsData.length,
        activePrograms,
        pendingApprovals,
        completedPrograms,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#4caf50';
      case 'PendingApproval':
        return '#ff9800';
      case 'Completed':
        return '#2196f3';
      case 'Draft':
        return '#9e9e9e';
      case 'Rejected':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const dashboardStats = [
    {
      title: "Total Programs",
      value: stats.totalPrograms.toString(),
      icon: "library-outline",
      color: "#1f497d",
    },
    {
      title: "Active Programs",
      value: stats.activePrograms.toString(),
      icon: "checkmark-circle-outline",
      color: "#4caf50",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      icon: "time-outline",
      color: "#ff9800",
    },
    {
      title: "Completed",
      value: stats.completedPrograms.toString(),
      icon: "trophy-outline",
      color: "#2196f3",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Program Manager Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your programs and track progress</Text>
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
          </View>
        ))}
      </View>

      {/* Recent Programs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Programs</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {programs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No programs created yet</Text>
          </View>
        ) : (
          <View style={styles.programsContainer}>
            {programs.slice(0, 5).map((program) => (
              <View key={program._id} style={styles.programCard}>
                <View style={styles.programHeader}>
                  <Text style={styles.programName}>{program.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(program.status) }]}>
                    <Text style={styles.statusText}>{program.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.programDescription} numberOfLines={2}>
                  {program.description}
                </Text>
                
                <View style={styles.programDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {formatDate(program.startDate)} - {formatDate(program.endDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {program.facilitators?.length || 0} Facilitators
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="school-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {program.courses?.length || 0} Courses
                    </Text>
                  </View>
                </View>

                <View style={styles.programActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="eye-outline" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="create-outline" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="people-outline" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="add-circle-outline" size={32} color="#1f497d" />
            <Text style={styles.quickActionText}>Create Program</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#1f497d" />
            <Text style={styles.quickActionText}>Review Approvals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="analytics-outline" size={32} color="#1f497d" />
            <Text style={styles.quickActionText}>View Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="settings-outline" size={32} color="#1f497d" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1f497d',
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
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
  },
  section: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    backgroundColor: '#1f497d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  programsContainer: {
    marginBottom: 10,
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
    marginBottom: 10,
  },
  programName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  programDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  programDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
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
    flex: 0.3,
  },
  actionText: {
    fontSize: 12,
    color: '#1f497d',
    marginLeft: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 5,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
}); 