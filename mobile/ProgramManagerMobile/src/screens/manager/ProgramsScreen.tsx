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
import { Program } from '@/types';

const { width } = Dimensions.get('window');

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const response = await programService.getMyPrograms();
      setPrograms(response.data);
    } catch (error) {
      console.error('Error loading programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleProgramPress = (program: Program) => {
    Alert.alert(
      program.name,
      `Status: ${program.status}\nDuration: ${program.duration}\nProgress: ${program.progress || 0}%`,
      [
        { text: 'View Details', onPress: () => console.log('View details') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Programs</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#1f497d" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {programs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Programs Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't been assigned to any programs yet.
            </Text>
          </View>
        ) : (
          <View style={styles.programsContainer}>
            {programs.map((program) => (
              <TouchableOpacity
                key={program._id}
                style={styles.programCard}
                onPress={() => handleProgramPress(program)}
              >
                <View style={styles.programHeader}>
                  <Text style={styles.programName} numberOfLines={2}>
                    {program.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(program.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {program.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.programDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {formatDate(program.startDate)} - {formatDate(program.endDate)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{program.duration}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="people" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {program.trainees?.length || 0} Trainees
                    </Text>
                  </View>
                </View>

                {program.progress !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text
                        style={[
                          styles.progressText,
                          { color: getProgressColor(program.progress) },
                        ]}
                      >
                        {program.progress}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${program.progress}%`,
                            backgroundColor: getProgressColor(program.progress),
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="eye" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="settings" size={16} color="#1f497d" />
                    <Text style={styles.actionText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  programsContainer: {
    padding: 16,
  },
  programCard: {
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
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  programDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f497d',
    marginLeft: 4,
  },
}); 