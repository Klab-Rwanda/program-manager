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
  List,
  Divider,
  Chip,
  Badge,
  Surface,
  IconButton,
  Dialog,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Import services
import { attendanceService } from '../../services/attendance.service';
import { ClassSession, AttendanceRecord, Program } from '../../types';
import ModernHeader from '../../components/ModernHeader';

const { width } = Dimensions.get('window');

export default function AttendanceScreen() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGeoSession, setActiveGeoSession] = useState<ClassSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGeoDialog, setShowGeoDialog] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both current sessions and past history in parallel
      const [sessionsData, historyData] = await Promise.all([
        attendanceService.getTraineeSessions(''), // Pass empty string for now, will need programId
        attendanceService.getMyAttendanceHistory()
      ]);
      setSessions(sessionsData);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      Alert.alert('Error', 'Failed to load your attendance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleGeoAttendance = async (session: ClassSession) => {
    setIsProcessing(true);
    setShowGeoDialog(false);
    
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access to mark attendance.',
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
      return;
    }

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Mark attendance with geolocation
      await attendanceService.markGeolocationAttendance(
        session.sessionId || session._id,
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      );

      Alert.alert('Success', 'Attendance marked successfully!');
      setActiveGeoSession(null);
      fetchData(); // Refetch data after marking
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      Alert.alert(
        'Error', 
        err.response?.data?.message || 'Failed to mark attendance. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  const getStatusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Present':
          return theme.colors.primary;
        case 'Absent':
          return theme.colors.error;
        case 'Excused':
          return theme.colors.tertiary;
        case 'Late':
          return theme.colors.tertiary;
        default:
          return theme.colors.outline;
      }
    };

    return (
      <Chip 
        mode="flat" 
        compact 
        style={{ backgroundColor: getStatusColor(status) + '20' }}
        textStyle={{ color: getStatusColor(status) }}
      >
        {status}
      </Chip>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getProgramName = (programId: string | Program) => {
    return typeof programId === 'object' ? programId.name : 'Unknown Program';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading attendance data...
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
          title="My Attendance"
          subtitle="Manage your session attendance and view your history"
          icon="calendar-check"
          gradient={true}
        />

        {/* Active Sessions */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Active Sessions ({activeSessions.length})
            </Text>
            
            {activeSessions.length > 0 ? (
              <View style={styles.sessionsContainer}>
                {activeSessions.map(session => (
                  <Surface key={session._id} style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <View style={styles.sessionContent}>
                      <View style={styles.sessionHeader}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                          {session.title}
                        </Text>
                        <Chip 
                          mode="flat" 
                          compact 
                          style={{ backgroundColor: theme.colors.primaryContainer }}
                          textStyle={{ color: theme.colors.onPrimaryContainer }}
                        >
                          Active
                        </Chip>
                      </View>
                      
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        {getProgramName(session.programId)}
                      </Text>
                      
                      <View style={styles.sessionActions}>
                        {session.type === 'physical' ? (
                          <Button
                            mode="contained"
                            icon="map-marker"
                            onPress={() => {
                              setActiveGeoSession(session);
                              setShowGeoDialog(true);
                            }}
                            disabled={isProcessing}
                            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                            contentStyle={styles.actionButtonContent}
                            labelStyle={{ color: theme.colors.onPrimary }}
                          >
                            {isProcessing ? 'Processing...' : 'Mark Attendance'}
                          </Button>
                        ) : (
                          <Button
                            mode="contained"
                            icon="video"
                            onPress={() => {}}
                            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                            contentStyle={styles.actionButtonContent}
                            labelStyle={{ color: theme.colors.onPrimary }}
                          >
                            Join Classroom
                          </Button>
                        )}
                      </View>
                    </View>
                  </Surface>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={48} 
                  color={theme.colors.primary} 
                />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                  No sessions are currently active.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Sessions */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Upcoming Sessions ({upcomingSessions.length})
            </Text>
            
            {upcomingSessions.length > 0 ? (
              <View style={styles.sessionsContainer}>
                {upcomingSessions.map(session => (
                  <Surface key={session._id} style={[styles.sessionCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
                    <View style={styles.sessionContent}>
                      <View style={styles.sessionHeader}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                          {session.title}
                        </Text>
                        <Chip 
                          mode="flat" 
                          compact 
                          style={{ backgroundColor: theme.colors.secondaryContainer }}
                          textStyle={{ color: theme.colors.onSecondaryContainer }}
                        >
                          Scheduled
                        </Chip>
                      </View>
                      
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        {getProgramName(session.programId)}
                      </Text>
                      
                      <View style={styles.sessionInfo}>
                        <MaterialCommunityIcons 
                          name="calendar" 
                          size={16} 
                          color={theme.colors.onSurfaceVariant} 
                        />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                          Starts: {formatTime(session.startTime)}
                        </Text>
                      </View>
                    </View>
                  </Surface>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="information" 
                  size={48} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                  You have no upcoming sessions scheduled.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Attendance History */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Attendance History
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              Your complete attendance record for all programs.
            </Text>
            
            {history.length > 0 ? (
              <View style={styles.historyContainer}>
                {history.map(record => (
                  <View key={record._id} style={styles.historyItem}>
                    <View style={styles.historyContent}>
                      <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                        {formatDate(record.date)}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {getProgramName(record.programId)}
                      </Text>
                    </View>
                    <View style={styles.historyActions}>
                      {getStatusBadge(record.status)}
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        {record.checkIn ? formatTime(record.checkIn) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="history" 
                  size={48} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                  No attendance history found.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Geolocation Dialog */}
      <Portal>
        <Dialog visible={showGeoDialog} onDismiss={() => setShowGeoDialog(false)}>
          <Dialog.Content>
            <View style={styles.dialogContent}>
              <MaterialCommunityIcons 
                name="map-marker" 
                size={64} 
                color={theme.colors.primary} 
                style={styles.dialogIcon}
              />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, textAlign: 'center', marginBottom: 8 }}>
                Mark Physical Attendance
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }}>
                Confirm your location for "{activeGeoSession?.title}".
              </Text>
              <Button
                mode="contained"
                icon="map-marker"
                onPress={() => activeGeoSession && handleGeoAttendance(activeGeoSession)}
                disabled={isProcessing}
                style={[styles.dialogButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.dialogButtonContent}
                labelStyle={{ color: theme.colors.onPrimary }}
              >
                {isProcessing ? 'Processing...' : 'Confirm My Location'}
              </Button>
            </View>
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
    marginBottom: 16,
  },
  sectionCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
  },
  sessionsContainer: {
    gap: 12,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 12,
    flex: 1,
  },
  actionButtonContent: {
    height: 48,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0', // Example background for history items
  },
  historyContent: {
    flex: 1,
  },
  historyActions: {
    alignItems: 'flex-end',
  },
  dialogContent: {
    alignItems: 'center',
    padding: 20,
  },
  dialogIcon: {
    marginBottom: 16,
  },
  dialogButton: {
    borderRadius: 12,
  },
     dialogButtonContent: {
     height: 48,
   },
   sessionInfo: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 8,
   },
});