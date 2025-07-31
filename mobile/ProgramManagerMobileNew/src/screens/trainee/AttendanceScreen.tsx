import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AttendanceScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <MaterialCommunityIcons 
              name="qrcode-scan" 
              size={64} 
              color={theme.colors.primary} 
              style={styles.icon}
            />
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
              Attendance Scanner
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Scan QR codes or use geolocation to mark your attendance for classes and sessions.
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                icon="qrcode-scan"
                onPress={() => {}}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.buttonContent}
                labelStyle={{ color: theme.colors.onPrimary }}
              >
                Scan QR Code
              </Button>
              
              <Button
                mode="outlined"
                icon="map-marker"
                onPress={() => {}}
                style={[styles.button, { borderColor: theme.colors.outline }]}
                contentStyle={styles.buttonContent}
                labelStyle={{ color: theme.colors.onSurface }}
              >
                Use Location
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
  icon: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
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