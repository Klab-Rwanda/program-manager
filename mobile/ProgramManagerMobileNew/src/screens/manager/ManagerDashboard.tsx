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

export default function ManagerDashboard() {
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
                Welcome back, Manager! 👋
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Here's your program overview
              </Text>
            </View>
            <Avatar.Text 
              size={48} 
              label="PM" 
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
                name="school" 
                size={32} 
                color={theme.colors.primary} 
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer, marginTop: 8 }}>
                8
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
                156
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
                12
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Pending Approvals
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
                onPress={() => {}}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onPrimary }}
              >
                Create Program
              </Button>
              
              <Button
                mode="outlined"
                icon="check-decagram"
                onPress={() => {}}
                style={[styles.actionButton, { borderColor: theme.colors.outline }]}
                contentStyle={styles.actionButtonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                Review Approvals
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Programs */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Recent Programs
            </Text>
            
            <List.Item
              title="Web Development Bootcamp"
              description="45 trainees • 85% completion rate"
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon="school" 
                  color={theme.colors.primary}
                />
              )}
              right={(props) => (
                <Chip 
                  mode="flat" 
                  compact 
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  Active
                </Chip>
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Data Science Fundamentals"
              description="32 trainees • 92% completion rate"
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon="school" 
                  color={theme.colors.secondary}
                />
              )}
              right={(props) => (
                <Chip 
                  mode="flat" 
                  compact 
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                  textStyle={{ color: theme.colors.onSecondaryContainer }}
                >
                  Active
                </Chip>
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Mobile App Development"
              description="28 trainees • 78% completion rate"
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon="school" 
                  color={theme.colors.tertiary}
                />
              )}
              right={(props) => (
                <Chip 
                  mode="flat" 
                  compact 
                  style={{ backgroundColor: theme.colors.tertiaryContainer }}
                  textStyle={{ color: theme.colors.onTertiaryContainer }}
                >
                  Active
                </Chip>
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        {/* Pending Approvals */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Pending Approvals
            </Text>
            
            <View style={styles.approvalItem}>
              <View style={styles.approvalContent}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  New Course Request
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Advanced React Development
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Requested by Sarah Johnson
                </Text>
              </View>
              <View style={styles.approvalActions}>
                <IconButton
                  icon="check"
                  size={20}
                  iconColor={theme.colors.tertiary}
                  onPress={() => {}}
                  style={{ backgroundColor: theme.colors.tertiaryContainer }}
                />
                <IconButton
                  icon="close"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => {}}
                  style={{ backgroundColor: theme.colors.errorContainer }}
                />
              </View>
            </View>
            
            <Divider style={{ marginVertical: 12 }} />
            
            <View style={styles.approvalItem}>
              <View style={styles.approvalContent}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  Program Update Request
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Updated curriculum for Web Development
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Requested by Mike Chen
                </Text>
              </View>
              <View style={styles.approvalActions}>
                <IconButton
                  icon="check"
                  size={20}
                  iconColor={theme.colors.tertiary}
                  onPress={() => {}}
                  style={{ backgroundColor: theme.colors.tertiaryContainer }}
                />
                <IconButton
                  icon="close"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => {}}
                  style={{ backgroundColor: theme.colors.errorContainer }}
                />
              </View>
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
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  approvalContent: {
    flex: 1,
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