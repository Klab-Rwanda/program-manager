import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  List,
  Divider,
  FAB,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function TraineeDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Loading...
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
        {/* Header Section */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.headerContent}>
            <View>
              <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
                Good morning, John! 👋
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Here's what's happening today
              </Text>
            </View>
            <Avatar.Text 
              size={48} 
              label="JD" 
              style={{ backgroundColor: theme.colors.primary }}
              color={theme.colors.onPrimary}
            />
          </View>
        </Surface>

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
                85%
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
                12
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
                3
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Programs
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
                icon="qrcode-scan"
                onPress={() => {}}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onPrimary }}
              >
                Mark Attendance
              </Button>
              
              <Button
                mode="outlined"
                icon="file-document-outline"
                onPress={() => {}}
                style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                View Assignments
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Recent Activity
            </Text>
            
            <List.Item
              title="Attendance marked"
              description="2 hours ago"
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
            
            <Divider />
            
            <List.Item
              title="Assignment submitted"
              description="1 day ago"
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
            
            <Divider />
            
            <List.Item
              title="Program enrolled"
              description="3 days ago"
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
          </Card.Content>
        </Card>

        {/* Today's Schedule */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Today's Schedule
            </Text>
            
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                  09:00
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  AM
                </Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  Programming Fundamentals
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Room 101 • John Smith
                </Text>
              </View>
              <Chip 
                mode="flat" 
                compact 
                style={{ backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                Active
              </Chip>
            </View>
            
            <Divider style={{ marginVertical: 12 }} />
            
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                  14:00
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  PM
                </Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  Web Development
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Room 203 • Sarah Johnson
                </Text>
              </View>
              <Chip 
                mode="flat" 
                compact 
                style={{ backgroundColor: theme.colors.secondaryContainer }}
                textStyle={{ color: theme.colors.onSecondaryContainer }}
              >
                Upcoming
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
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
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleTime: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  scheduleContent: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});