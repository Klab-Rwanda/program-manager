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
  Dialog,
  Portal,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import services
import { programService } from '../../services/program.service';
import { Program } from '../../types';
import ModernHeader from '../../components/ModernHeader';

const { width } = Dimensions.get('window');

export default function ProgramsScreen() {
  const theme = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showProgramDialog, setShowProgramDialog] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const programsData = await programService.getMyPrograms();
      setPrograms(programsData);
    } catch (err) {
      console.error('Failed to load programs:', err);
      Alert.alert('Error', 'Failed to load your programs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchPrograms(); 
  }, [fetchPrograms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrograms();
    setRefreshing(false);
  };

  const handleViewProgram = (program: Program) => {
    setSelectedProgram(program);
    setShowProgramDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.tertiary;
      case 'pending':
        return theme.colors.outline;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateProgress = (program: Program) => {
    if (!program.totalAssignments || program.totalAssignments === 0) return 0;
    return (program.completedAssignments || 0) / program.totalAssignments;
  };

  const getProgressText = (program: Program) => {
    const completed = program.completedAssignments || 0;
    const total = program.totalAssignments || 0;
    return `${completed}/${total} assignments completed`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading your programs...
          </Text>
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
        {/* Header */}
        <ModernHeader
          title="My Programs"
          subtitle="View your enrolled programs and track your progress"
          icon="school"
          gradient={true}
        />

        {/* Programs List */}
        <View style={styles.programsContainer}>
          {programs.length > 0 ? (
            programs.map(program => (
              <Surface key={program._id} style={[styles.programCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
                <View style={styles.programContent}>
                  <View style={styles.programHeader}>
                    <View style={styles.programTitle}>
                      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                        {program.name}
                      </Text>
                      <Chip 
                        mode="flat" 
                        compact 
                        style={{ backgroundColor: getStatusColor(program.status) + '20' }}
                        textStyle={{ color: getStatusColor(program.status) }}
                      >
                        {getStatusText(program.status)}
                      </Chip>
                    </View>
                  </View>
                  
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    {program.description}
                  </Text>
                  
                  <View style={styles.programStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons 
                        name="calendar" 
                        size={16} 
                        color={theme.colors.onSurfaceVariant} 
                      />
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                        {formatDate(program.startDate)} - {formatDate(program.endDate)}
                      </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons 
                        name="clock" 
                        size={16} 
                        color={theme.colors.onSurfaceVariant} 
                      />
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                        {program.duration}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Progress Section */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                        Progress
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {getProgressText(program)}
                      </Text>
                    </View>
                    <ProgressBar 
                      progress={calculateProgress(program)} 
                      color={theme.colors.primary}
                      style={styles.progressBar}
                    />
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={styles.programActions}>
                    <Button
                      mode="contained"
                      icon="eye"
                      onPress={() => handleViewProgram(program)}
                      style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                      contentStyle={styles.actionButtonContent}
                      labelStyle={{ color: theme.colors.onPrimary }}
                    >
                      View Details
                    </Button>
                  </View>
                </View>
              </Surface>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="school" 
                size={64} 
                color={theme.colors.onSurfaceVariant} 
              />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: 16, textAlign: 'center' }}>
                No Programs Enrolled
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                You haven't been enrolled in any programs yet. Contact your program manager for enrollment.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Program Details Dialog */}
      <Portal>
        <Dialog visible={showProgramDialog} onDismiss={() => setShowProgramDialog(false)}>
          <Dialog.Content>
            {selectedProgram && (
              <View style={styles.dialogContent}>
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                  {selectedProgram.name}
                </Text>
                
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                  {selectedProgram.description}
                </Text>
                
                <View style={styles.dialogStats}>
                  <View style={styles.dialogStat}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                      Duration
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {selectedProgram.duration}
                    </Text>
                  </View>
                  
                  <View style={styles.dialogStat}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                      Start Date
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatDate(selectedProgram.startDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.dialogStat}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                      End Date
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatDate(selectedProgram.endDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.dialogStat}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                      Status
                    </Text>
                    <Chip 
                      mode="flat" 
                      compact 
                      style={{ backgroundColor: getStatusColor(selectedProgram.status) + '20' }}
                      textStyle={{ color: getStatusColor(selectedProgram.status) }}
                    >
                      {getStatusText(selectedProgram.status)}
                    </Chip>
                  </View>
                </View>
                
                <View style={styles.dialogProgress}>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                    Progress
                  </Text>
                  <ProgressBar 
                    progress={calculateProgress(selectedProgram)} 
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {getProgressText(selectedProgram)}
                  </Text>
                </View>
                
                <Button
                  mode="contained"
                  onPress={() => setShowProgramDialog(false)}
                  style={[styles.dialogButton, { backgroundColor: theme.colors.primary }]}
                  contentStyle={styles.dialogButtonContent}
                  labelStyle={{ color: theme.colors.onPrimary }}
                >
                  Close
                </Button>
              </View>
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  programsContainer: {
    padding: 20,
    gap: 12,
  },
  programCard: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  programContent: {
    padding: 20,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  programTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  programActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonContent: {
    height: 48,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    padding: 20,
  },
  dialogStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dialogStat: {
    flex: 1,
  },
  dialogProgress: {
    marginBottom: 16,
  },
  dialogButton: {
    borderRadius: 12,
  },
  dialogButtonContent: {
    height: 48,
  },
});