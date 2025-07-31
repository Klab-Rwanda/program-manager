import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/auth.service';

const { width } = Dimensions.get('window');

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  department?: string;
  joinDate: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Mock profile data - replace with actual API call
      const mockProfile: UserProfile = {
        _id: '1',
        firstName: 'John',
        lastName: 'Manager',
        email: 'john.manager@company.com',
        role: 'Program Manager',
        phone: '+1 (555) 123-4567',
        department: 'Training & Development',
        joinDate: '2023-01-15',
      };
      setProfile(mockProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              // Navigate to login screen or handle logout
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature coming soon!');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Privacy Settings', 'Privacy settings feature coming soon!');
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Help and support feature coming soon!');
  };

  const handleAboutApp = () => {
    Alert.alert(
      'About App',
      'Program Manager Mobile App\nVersion 1.0.0\n\nA comprehensive mobile application for managing training programs and trainees.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create" size={24} color="#1f497d" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={styles.role}>{profile.role}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>
                {profile.firstName} {profile.lastName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
            {profile.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#6b7280" />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
            )}
            {profile.department && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color="#6b7280" />
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>{profile.department}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Join Date</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.joinDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#6b7280" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e5e7eb', true: '#1f497d' }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={20} color="#6b7280" />
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#e5e7eb', true: '#1f497d' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
              <Ionicons name="lock-closed" size={20} color="#6b7280" />
              <Text style={styles.actionLabel}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={handlePrivacySettings}>
              <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
              <Text style={styles.actionLabel}>Privacy Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.supportCard}>
            <TouchableOpacity style={styles.actionRow} onPress={handleHelpSupport}>
              <Ionicons name="help-circle" size={20} color="#6b7280" />
              <Text style={styles.actionLabel}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={handleAboutApp}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.actionLabel}>About App</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  editButton: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1f497d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#1f497d',
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionLabel: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  supportCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
}); 