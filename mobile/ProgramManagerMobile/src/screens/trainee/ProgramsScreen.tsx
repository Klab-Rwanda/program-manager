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
import { getMyAttendanceHistory } from '../../services/attendance.service';
import { Program, AttendanceRecord } from '../../types';

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const [programsData, attendanceData] = await Promise.all([
        getAllPrograms(),
        getMyAttendanceHistory().catch(() => []),
      ]);

      // Filter active programs for trainees
      const activePrograms = programsData.filter(p => p.status === 'Active');
      setPrograms(activePrograms);
      setAttendanceHistory(attendanceData);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceRate = (programId: string): number => {
    const programAttendance = attendanceHistory.filter(record => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#4caf50';
      case 'Draft':
        return '#ff9800';
      case 'Completed':
        return '#2196f3';
      case 'Rejected':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleProgramPress = (program: Program) => {
    setSelectedProgram(program);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading programs...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Programs</Text>
        <Text style={styles.headerSubtitle}>View your enrolled programs and progress</Text>
      </View>

      {programs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No programs enrolled yet</Text>
        </View>
      ) : (
        <View style={styles.programsContainer}>
          {programs.map((program) => {
            const attendanceRate = calculateAttendanceRate(program._id);
            return (
              <TouchableOpacity
                key={program._id}
                style={styles.programCard}
                onPress={() => handleProgramPress(program)}
              >
                <View style={styles.programHeader}>
                  <Text style={styles.programName}>{program.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(program.status) }]}>
                    <Text style={styles.statusText}>{program.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.programDescription}>{program.description}</Text>
                
                <View style={styles.programStats}>
                  <View style={styles.statRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {formatDate(program.startDate)} - {formatDate(program.endDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {program.facilitators?.length || 0} Facilitators
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Ionicons name="school-outline" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {program.courses?.length || 0} Courses
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Attendance Rate</Text>
                    <Text style={styles.progressValue}>{attendanceRate}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${attendanceRate}%` }]} />
                  </View>
                </View>

                <View style={styles.programActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="document-outline" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="calendar-outline" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  programsContainer: {
    paddingHorizontal: 15,
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
    fontSize: 18,
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
    marginBottom: 15,
    lineHeight: 20,
  },
  programStats: {
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  progressSection: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f497d',
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
}); 