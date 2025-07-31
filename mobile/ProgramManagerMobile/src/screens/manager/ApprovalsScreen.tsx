import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { programService } from '@/services/program.service';

const { width } = Dimensions.get('window');

interface ApprovalItem {
  id: string;
  type: 'enrollment' | 'submission' | 'attendance' | 'assignment';
  title: string;
  description: string;
  requester: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
}

export default function ApprovalsScreen() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockApprovals: ApprovalItem[] = [
        {
          id: '1',
          type: 'enrollment',
          title: 'Trainee Enrollment Request',
          description: 'John Doe requests to enroll in Advanced JavaScript Course',
          requester: 'John Doe',
          date: '2024-01-15',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: '2',
          type: 'submission',
          title: 'Assignment Submission',
          description: 'Sarah Wilson submitted React Project Assignment',
          requester: 'Sarah Wilson',
          date: '2024-01-14',
          status: 'pending',
          priority: 'high',
        },
        {
          id: '3',
          type: 'attendance',
          title: 'Attendance Appeal',
          description: 'Mike Johnson appeals for missed session on Jan 10',
          requester: 'Mike Johnson',
          date: '2024-01-13',
          status: 'pending',
          priority: 'low',
        },
        {
          id: '4',
          type: 'assignment',
          title: 'Assignment Extension Request',
          description: 'Lisa Brown requests 3-day extension for Final Project',
          requester: 'Lisa Brown',
          date: '2024-01-12',
          status: 'approved',
          priority: 'medium',
        },
      ];
      setApprovals(mockApprovals);
    } catch (error) {
      console.error('Error loading approvals:', error);
      Alert.alert('Error', 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApprovals();
    setRefreshing(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return 'person-add';
      case 'submission':
        return 'document-text';
      case 'attendance':
        return 'calendar';
      case 'assignment':
        return 'book';
      default:
        return 'help-circle';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'enrollment':
        return '#3b82f6';
      case 'submission':
        return '#10b981';
      case 'attendance':
        return '#f59e0b';
      case 'assignment':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleApprove = (item: ApprovalItem) => {
    Alert.alert(
      'Approve Request',
      `Are you sure you want to approve "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            // Update approval status
            const updatedApprovals = approvals.map(approval =>
              approval.id === item.id ? { ...approval, status: 'approved' as const } : approval
            );
            setApprovals(updatedApprovals);
            Alert.alert('Success', 'Request approved successfully');
          },
        },
      ]
    );
  };

  const handleReject = (item: ApprovalItem) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            // Update approval status
            const updatedApprovals = approvals.map(approval =>
              approval.id === item.id ? { ...approval, status: 'rejected' as const } : approval
            );
            setApprovals(updatedApprovals);
            Alert.alert('Success', 'Request rejected');
          },
        },
      ]
    );
  };

  const filteredApprovals = approvals.filter(approval => {
    if (filter === 'all') return true;
    return approval.status === filter;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading approvals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Approvals</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#1f497d" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredApprovals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Approvals Found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'All caught up! No pending approvals.'
                : `No ${filter} approvals found.`}
            </Text>
          </View>
        ) : (
          <View style={styles.approvalsContainer}>
            {filteredApprovals.map((item) => (
              <View key={item.id} style={styles.approvalCard}>
                <View style={styles.approvalHeader}>
                  <View style={styles.typeContainer}>
                    <View
                      style={[
                        styles.typeIcon,
                        { backgroundColor: getTypeColor(item.type) },
                      ]}
                    >
                      <Ionicons
                        name={getTypeIcon(item.type) as any}
                        size={16}
                        color="#ffffff"
                      />
                    </View>
                    <View style={styles.titleContainer}>
                      <Text style={styles.approvalTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.requesterText}>
                        by {item.requester}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.badgesContainer}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(item.priority) },
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.descriptionText}>{item.description}</Text>

                <View style={styles.approvalFooter}>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  {item.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApprove(item)}
                      >
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleReject(item)}
                      >
                        <Ionicons name="close" size={16} color="#ffffff" />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f497d',
  },
  refreshButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#1f497d',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  approvalsContainer: {
    padding: 16,
  },
  approvalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  requesterText: {
    fontSize: 12,
    color: '#6b7280',
  },
  badgesContainer: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  approvalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
}); 