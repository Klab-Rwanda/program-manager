import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import TraineeDashboard from '../screens/trainee/TraineeDashboard';
import AttendanceScreen from '../screens/trainee/AttendanceScreen';
import ProgramsScreen from '../screens/trainee/ProgramsScreen';
import AssignmentsScreen from '../screens/trainee/AssignmentsScreen';
import ProfileScreen from '../screens/trainee/ProfileScreen';

import ManagerDashboard from '../screens/manager/ManagerDashboard';
import ManagerProgramsScreen from '../screens/manager/ProgramsScreen';
import ApprovalsScreen from '../screens/manager/ApprovalsScreen';
import ManagerProfileScreen from '../screens/manager/ProfileScreen';

const Tab = createBottomTabNavigator();

// Loading Screen
function LoadingScreen() {
  const theme = useTheme();
  
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: theme.colors.background 
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

// Trainee Tab Navigator
function TraineeTabNavigator() {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          if (route.name === 'TraineeDashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'AttendanceScreen') {
            iconName = focused ? 'check-circle' : 'check-circle-outline';
          } else if (route.name === 'ProgramsScreen') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'AssignmentsScreen') {
            iconName = focused ? 'file-document' : 'file-document-outline';
          } else if (route.name === 'ProfileScreen') {
            iconName = focused ? 'account' : 'account-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="TraineeDashboard" 
        component={TraineeDashboard}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="AttendanceScreen" 
        component={AttendanceScreen}
        options={{ title: 'Attendance' }}
      />
      <Tab.Screen 
        name="ProgramsScreen" 
        component={ProgramsScreen}
        options={{ title: 'Programs' }}
      />
      <Tab.Screen 
        name="AssignmentsScreen" 
        component={AssignmentsScreen}
        options={{ title: 'Assignments' }}
      />
      <Tab.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Manager Tab Navigator
function ManagerTabNavigator() {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          if (route.name === 'ManagerDashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'ManagerProgramsScreen') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'ApprovalsScreen') {
            iconName = focused ? 'check-decagram' : 'check-decagram-outline';
          } else if (route.name === 'ManagerProfileScreen') {
            iconName = focused ? 'account' : 'account-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="ManagerDashboard" 
        component={ManagerDashboard}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="ManagerProgramsScreen" 
        component={ManagerProgramsScreen}
        options={{ title: 'Programs' }}
      />
      <Tab.Screen 
        name="ApprovalsScreen" 
        component={ApprovalsScreen}
        options={{ title: 'Approvals' }}
      />
      <Tab.Screen 
        name="ManagerProfileScreen" 
        component={ManagerProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { isAuthenticated, loading, role } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Route to appropriate dashboard based on role
  return (
    <NavigationContainer>
      {role === 'trainee' ? <TraineeTabNavigator /> : <ManagerTabNavigator />}
    </NavigationContainer>
  );
}