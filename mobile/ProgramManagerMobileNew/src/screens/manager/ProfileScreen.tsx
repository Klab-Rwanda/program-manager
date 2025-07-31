import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Avatar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();

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
      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Avatar.Text 
              size={80} 
              label={user?.firstName?.charAt(0) + user?.lastName?.charAt(0) || 'U'} 
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
              color={theme.colors.onPrimary}
            />
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {user?.email}
            </Text>
            <Text variant="bodyMedium" style={[styles.role, { color: theme.colors.primary }]}>
              {user?.role}
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
      </View>
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