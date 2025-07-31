import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Import services
import { getTraineeSessions, markQRAttendance, markGeolocationAttendance } from '../../services/attendance.service';
import { ClassSession } from '../../types';

export default function AttendanceScreen() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await getTraineeSessions();
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocationAttendance = async (session: ClassSession) => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to mark attendance');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Mark attendance using geolocation
      await markGeolocationAttendance({
        sessionId: session._id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      Alert.alert('Success', 'Attendance marked successfully using geolocation!');
      fetchSessions(); // Refresh sessions
    } catch (error) {
      console.error('Failed to mark geolocation attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance. Please try again.');
    }
  };

  const handleQRAttendance = async (session: ClassSession) => {
    // For now, we'll simulate QR code scanning
    // In a real app, you would integrate with a QR code scanner
    Alert.alert(
      'QR Code Scanner',
      'This would open the camera to scan QR code. For now, simulating success.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Simulate Success',
          onPress: async () => {
            try {
              // Simulate QR code data
              const qrData = `session:${session._id}:${new Date().toISOString()}`;
              await markQRAttendance(qrData);
              Alert.alert('Success', 'Attendance marked successfully using QR code!');
              fetchSessions(); // Refresh sessions
            } catch (error) {
              console.error('Failed to mark QR attendance:', error);
              Alert.alert('Error', 'Failed to mark attendance. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#ff9800';
      case 'active':
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'cancelled':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSubtitle}>Mark your attendance for today's sessions</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No sessions scheduled for today</Text>
        </View>
      ) : (
        <View style={styles.sessionsContainer}>
          {sessions.map((session) => (
            <View key={session._id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                  <Text style={styles.statusText}>{session.status}</Text>
                </View>
              </View>
              
              <Text style={styles.sessionDescription}>{session.description}</Text>
              
              <View style={styles.sessionDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {formatTime(session.startTime)} ({session.duration} min)
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {session.type === 'physical' ? 'Physical Class' : 'Online Class'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {session.facilitatorId.name}
                  </Text>
                </View>
              </View>

              {session.status === 'active' && (
                <View style={styles.attendanceActions}>
                  <TouchableOpacity
                    style={[styles.attendanceButton, styles.qrButton]}
                    onPress={() => handleQRAttendance(session)}
                  >
                    <Ionicons name="qr-code-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Scan QR Code</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.attendanceButton, styles.locationButton]}
                    onPress={() => handleGeolocationAttendance(session)}
                  >
                    <Ionicons name="location-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Use Location</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
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
  sessionsContainer: {
    paddingHorizontal: 15,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionTitle: {
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
  sessionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sessionDetails: {
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
  attendanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
  },
  qrButton: {
    backgroundColor: '#1f497d',
  },
  locationButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
}); 