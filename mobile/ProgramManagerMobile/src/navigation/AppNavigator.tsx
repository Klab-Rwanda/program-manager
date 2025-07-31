import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import TraineeDashboard from '../screens/trainee/TraineeDashboard';
import AttendanceScreen from '../screens/trainee/AttendanceScreen';
import ProgramsScreen from '../screens/trainee/ProgramsScreen';
import AssignmentsScreen from '../screens/trainee/AssignmentsScreen';
import ProfileScreen from '../screens/trainee/ProfileScreen';

import ManagerDashboard from '../screens/manager/ManagerDashboard';
import ManagerProgramsScreen from '../screens/manager/ProgramsScreen';
import ManagerApprovalsScreen from '../screens/manager/ApprovalsScreen';
import ManagerProfileScreen from '../screens/manager/ProfileScreen';

const Tab = createBottomTabNavigator();

// Trainee Tab Navigator
function TraineeTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Programs') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Assignments') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1f497d',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#1f497d',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={TraineeDashboard} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Programs" component={ProgramsScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Manager Tab Navigator
function ManagerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Programs') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Approvals') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1f497d',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#1f497d',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={ManagerDashboard} />
      <Tab.Screen name="Programs" component={ManagerProgramsScreen} />
      <Tab.Screen name="Approvals" component={ManagerApprovalsScreen} />
      <Tab.Screen name="Profile" component={ManagerProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  // For now, we'll hardcode the role. In a real app, this would come from authentication
  const userRole = 'trainee'; // Change this to 'manager' to test Program Manager

  return (
    <NavigationContainer>
      {userRole === 'trainee' ? <TraineeTabNavigator /> : <ManagerTabNavigator />}
    </NavigationContainer>
  );
} 