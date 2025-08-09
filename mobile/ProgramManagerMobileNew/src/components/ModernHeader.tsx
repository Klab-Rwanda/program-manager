import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  showAvatar?: boolean;
  userInitials?: string;
  gradient?: boolean;
}

export default function ModernHeader({ 
  title, 
  subtitle, 
  icon, 
  showAvatar = false, 
  userInitials,
  gradient = true 
}: ModernHeaderProps) {
  const theme = useTheme();

  const HeaderContent = () => (
    <View style={styles.headerContent}>
      <View style={styles.titleSection}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <MaterialCommunityIcons 
              name={icon as any} 
              size={24} 
              color="#ffffff" 
            />
          </View>
        )}
        <View style={styles.textSection}>
          <Text variant="headlineMedium" style={[styles.title, { color: '#ffffff' }]}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMedium" style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      {showAvatar && userInitials && (
        <Avatar.Text 
          size={48} 
          label={userInitials} 
          style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
          color="#ffffff"
        />
      )}
    </View>
  );

  if (gradient) {
    return (
      <Surface style={styles.container} elevation={2}>
        <View style={styles.overflowContainer}>
          <LinearGradient
            colors={['#1f497d', '#2d5a8a']}
            style={styles.gradient}
          >
            <HeaderContent />
          </LinearGradient>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.overflowContainer}>
        <HeaderContent />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
  },
  gradient: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
  avatar: {
    marginLeft: 16,
  },
  overflowContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
}); 