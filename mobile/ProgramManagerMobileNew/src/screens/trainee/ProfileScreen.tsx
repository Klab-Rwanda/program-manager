import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme, 
  Avatar,
  List,
  Divider,
  Surface,
  Switch,
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
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Change password functionality coming soon!');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Privacy Settings', 'Privacy settings functionality coming soon!');
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Help and support functionality coming soon!');
  };

  const handleAboutApp = () => {
    Alert.alert('About App', 'Program Manager Mobile v1.0.0\n\nA comprehensive mobile application for managing training programs, attendance, and assignments.');
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

        {/* Profile Information */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={80} 
                label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'} 
                style={[styles.profileAvatar, { backgroundColor: theme.colors.primaryContainer }]}
                color={theme.colors.onPrimaryContainer}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  {user?.name || 'User Name'}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {user?.email || 'user@example.com'}
                </Text>
                <View style={styles.roleContainer}>
                  <MaterialCommunityIcons 
                    name="account-tie" 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                  <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 4, textTransform: 'capitalize' }}>
                    {user?.role || 'Trainee'}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Account Actions
            </Text>
            
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => (
                <List.Icon {...props} icon="account-edit" color={theme.colors.primary} />
              )}
              right={(props) => (
                <MaterialCommunityIcons {...props} name="chevron-right" size={24} color={theme.colors.outline} />
              )}
              onPress={handleEditProfile}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => (
                <List.Icon {...props} icon="lock-reset" color={theme.colors.secondary} />
              )}
              right={(props) => (
                <MaterialCommunityIcons {...props} name="chevron-right" size={24} color={theme.colors.outline} />
              )}
              onPress={handleChangePassword}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Settings
            </Text>
            
            <List.Item
              title="Push Notifications"
              description="Receive updates about your programs"
              left={(props) => (
                <List.Icon {...props} icon="bell" color={theme.colors.tertiary} />
              )}
              right={() => (
                <Switch value={true} onValueChange={() => {}} />
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Location Services"
              description="Allow location for attendance marking"
              left={(props) => (
                <List.Icon {...props} icon="map-marker" color={theme.colors.tertiary} />
              )}
              right={() => (
                <Switch value={true} onValueChange={() => {}} />
              )}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy Settings"
              description="Manage your privacy preferences"
              left={(props) => (
                <List.Icon {...props} icon="shield-account" color={theme.colors.tertiary} />
              )}
              right={(props) => (
                <MaterialCommunityIcons {...props} name="chevron-right" size={24} color={theme.colors.outline} />
              )}
              onPress={handlePrivacySettings}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        {/* Support & About */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Support & About
            </Text>
            
            <List.Item
              title="Help & Support"
              description="Get help and contact support"
              left={(props) => (
                <List.Icon {...props} icon="help-circle" color={theme.colors.tertiary} />
              )}
              right={(props) => (
                <MaterialCommunityIcons {...props} name="chevron-right" size={24} color={theme.colors.outline} />
              )}
              onPress={handleHelpSupport}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <Divider />
            
            <List.Item
              title="About App"
              description="Version and app information"
              left={(props) => (
                <List.Icon {...props} icon="information" color={theme.colors.tertiary} />
              )}
              right={(props) => (
                <MaterialCommunityIcons {...props} name="chevron-right" size={24} color={theme.colors.outline} />
              )}
              onPress={handleAboutApp}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Button
              mode="outlined"
              icon="logout"
              onPress={handleLogout}
              style={[styles.logoutButton, { borderColor: theme.colors.error }]}
              contentStyle={styles.logoutButtonContent}
              labelStyle={{ color: theme.colors.error }}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  logoutButton: {
    borderRadius: 12,
  },
  logoutButtonContent: {
    height: 48,
  },
});