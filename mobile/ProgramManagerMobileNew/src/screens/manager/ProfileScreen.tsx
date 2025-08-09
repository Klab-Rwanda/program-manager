import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme, 
  Avatar,
  List,
  Divider,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import ModernHeader from '../../components/ModernHeader';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();

  // Safety check - if user is null, show loading
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading user data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ModernHeader
          title="My Profile"
          subtitle="Manage your account and preferences"
          icon="account"
          showAvatar={true}
          userInitials={user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          gradient={true}
        />
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Avatar.Text 
              size={80} 
              label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'} 
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
              color={theme.colors.onPrimary}
            />
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
              {user?.name || 'User'}
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {user?.email || 'No email'}
            </Text>
            <Text variant="bodyMedium" style={[styles.role, { color: theme.colors.primary }]}>
              {user?.role || 'Manager'}
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              Manage your profile, settings, and administrative preferences.
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                icon="account-edit"
                onPress={() => Alert.alert('Edit Profile', 'This feature will be implemented soon.')}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.buttonContent}
                labelStyle={{ color: theme.colors.onPrimary }}
              >
                Edit Profile
              </Button>
              
              <Button
                mode="outlined"
                icon="cog"
                onPress={() => Alert.alert('Settings', 'This feature will be implemented soon.')}
                style={[styles.button, { borderColor: theme.colors.outline }]}
                contentStyle={styles.buttonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                Settings
              </Button>

              <Button
                mode="outlined"
                icon="logout"
                onPress={handleLogout}
                style={[styles.button, { borderColor: theme.colors.error }]}
                contentStyle={styles.buttonContent}
                labelStyle={{ color: theme.colors.error }}
              >
                Logout
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  cardContent: {
    alignItems: 'center',
    padding: 32,
  },
  avatar: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  role: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
});