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
import api from '../../services/api';
import { Assignment, Program } from '../../types';

export default function AssignmentsScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // Fetch programs first
      const programsData = await getAllPrograms();
      const activePrograms = programsData.filter(p => p.status === 'Active');
      setPrograms(activePrograms);

      // Fetch assignments for active programs
      const assignmentPromises = activePrograms.map(program => 
        api.get(`/assignments/program/${program._id}`)
          .then(res => res.data.data)
          .catch(() => [])
      );
      
      const assignmentArrays = await Promise.all(assignmentPromises);
      const allAssignments = assignmentArrays.flat();
      setAssignments(allAssignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      Alert.alert('Error', 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '#f44336'; // Overdue
    if (diffDays <= 3) return '#ff9800'; // Due soon
    return '#4caf50'; // On time
  };

  const getStatusText = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    if (diffDays <= 3) return `Due in ${diffDays} days`;
    return 'On Time';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleAssignmentPress = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleSubmitAssignment = (assignment: Assignment) => {
    Alert.alert(
      'Submit Assignment',
      'This would open a form to submit your assignment. For now, simulating success.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert('Success', 'Assignment submitted successfully!');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
        <Text style={styles.headerSubtitle}>View and submit your assignments</Text>
      </View>

      {assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No assignments available</Text>
        </View>
      ) : (
        <View style={styles.assignmentsContainer}>
          {assignments.map((assignment) => {
            const statusColor = getStatusColor(assignment.dueDate);
            const statusText = getStatusText(assignment.dueDate);
            const programName = typeof assignment.program === 'object' 
              ? assignment.program.name 
              : 'Unknown Program';
            const courseName = typeof assignment.course === 'object' 
              ? assignment.course.title 
              : 'Unknown Course';

            return (
              <View key={assignment._id} style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{statusText}</Text>
                  </View>
                </View>
                
                <Text style={styles.assignmentDescription} numberOfLines={3}>
                  {assignment.description}
                </Text>
                
                <View style={styles.assignmentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="school-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{programName}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="book-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{courseName}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Due: {formatDate(assignment.dueDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="star-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Max Grade: {assignment.maxGrade} points
                    </Text>
                  </View>
                </View>

                <View style={styles.assignmentActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleAssignmentPress(assignment)}
                  >
                    <Ionicons name="eye-outline" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.submitButton]}
                    onPress={() => handleSubmitAssignment(assignment)}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color="white" />
                    <Text style={[styles.actionText, styles.submitText]}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  assignmentsContainer: {
    paddingHorizontal: 15,
  },
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignmentTitle: {
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
  assignmentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  assignmentDetails: {
    marginBottom: 15,
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
  assignmentActions: {
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
    flex: 0.48,
  },
  submitButton: {
    backgroundColor: '#1f497d',
  },
  actionText: {
    fontSize: 12,
    color: '#1f497d',
    marginLeft: 4,
  },
  submitText: {
    color: 'white',
  },
}); 