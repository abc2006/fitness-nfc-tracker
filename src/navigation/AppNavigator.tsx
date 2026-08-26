import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CaptureScreen from '../screens/CaptureScreen';
import EditWorkoutScreen from '../screens/EditWorkoutScreen';
import ExerciseStatsScreen from '../screens/ExerciseStatsScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import TrainingScreen from '../screens/TrainingScreen';
import WorkoutActiveScreen from '../screens/WorkoutActiveScreen';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors, effectiveMode } = useTheme();

  const navigationTheme: Theme = {
    ...(effectiveMode === 'light' ? DefaultTheme : DarkTheme),
    colors: {
      ...(effectiveMode === 'light' ? DefaultTheme.colors : DarkTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.primary,
      text: colors.textPrimary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} options={{ title: 'Workout editieren' }} />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Neues Gerät' }} />
        <Stack.Screen name="WorkoutActive" component={WorkoutActiveScreen} options={{ title: 'Workout' }} />
        <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'Übung' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Einstellungen' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Auswertung' }} />
        <Stack.Screen name="ExerciseStats" component={ExerciseStatsScreen} options={{ title: 'Übung' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
