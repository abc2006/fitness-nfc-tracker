import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AutoCompleteWatcher } from './src/components/AutoCompleteWatcher';
import { WorkoutSessionProvider } from './src/context/WorkoutSessionContext';
import { initDatabase } from './src/db/database';
import { colors } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

function ThemedRoot() {
  const { effectiveMode } = useTheme();
  return (
    <>
      <AppNavigator />
      <StatusBar style={effectiveMode === 'light' ? 'dark' : 'light'} />
    </>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.warn('Failed to initialize database', err);
        setError('Die lokale Datenbank konnte nicht initialisiert werden.');
      });
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ThemeProvider>
          <WorkoutSessionProvider>
            <AutoCompleteWatcher />
            <ThemedRoot />
          </WorkoutSessionProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
