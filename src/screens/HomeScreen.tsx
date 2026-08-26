import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { getUserProfile, getWorkoutSessions } from '../db/database';
import { Palette } from '../theme/palettes';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList, UserProfile, WorkoutSessionRecord } from '../types';
import { caloriesForSession, formatDate, totalWeightForSession } from '../utils/stats';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { colors, effectiveMode } = useTheme();
  const { reset } = useWorkoutSession();
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getWorkoutSessions().then(setSessions).catch(console.warn);
      getUserProfile().then(setProfile).catch(console.warn);
      setStatusBarStyle(effectiveMode === 'light' ? 'dark' : 'light');
      return () => setStatusBarStyle('light');
    }, [effectiveMode])
  );

  const styles = createStyles(colors);

  const lastSession = sessions[0] ?? null;

  const handleStartWorkout = () => {
    reset();
    navigation.navigate('WorkoutActive');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.appName}>Trainingsbegleiter</Text>
          <Pressable style={styles.gearButton} hitSlop={10} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.gearIcon}>⚙</Text>
          </Pressable>
        </View>
        <Text style={styles.tagline}>Scanne deine Geräte, tracke dein Training.</Text>

        <Pressable
          style={({ pressed }) => [styles.chartCard, pressed && styles.chartCardPressed]}
          onPress={() => navigation.navigate('Stats')}
        >
          {lastSession ? (
            <>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Gesamtgewicht</Text>
                <Text style={styles.bigNumber} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {Math.round(totalWeightForSession(lastSession)).toLocaleString('de-DE')}
                  <Text style={styles.bigNumberUnit}> kg</Text>
                </Text>
              </View>

              <View style={[styles.statBlock, styles.statBlockDivided]}>
                <Text style={styles.statLabel}>Letztes Training</Text>
                <Text style={styles.bigNumber} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {formatDate(lastSession.completedAt)}
                </Text>
              </View>

              <View style={[styles.statBlock, styles.statBlockDivided]}>
                <Text style={styles.statLabel}>Kalorien</Text>
                <Text style={styles.bigNumber} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  ca. {caloriesForSession(lastSession, profile)}
                  <Text style={styles.bigNumberUnit}> kcal</Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.chartTitle}>Gesamtgewicht</Text>
              <Text style={styles.calorieText}>Noch kein Training abgeschlossen.</Text>
            </>
          )}
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={handleStartWorkout}
          >
            <Text style={styles.primaryIcon}>▶</Text>
            <Text style={styles.primaryButtonText}>Workout starten</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => navigation.navigate('EditWorkout')}
          >
            <Text style={styles.secondaryIcon}>✎</Text>
            <Text style={styles.secondaryButtonText}>Workout editieren</Text>
          </Pressable>
        </View>
      </ScrollView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
      paddingTop: 56,
      paddingBottom: 48,
      gap: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    appName: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '700',
    },
    gearButton: {
      position: 'absolute',
      right: 0,
      padding: 4,
    },
    gearIcon: {
      fontSize: 24,
      color: colors.textSecondary,
    },
    tagline: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 18,
      gap: 10,
      shadowColor: '#0B0E11',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    chartCardPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    chartTitle: {
      color: colors.textSecondary,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    statBlock: {
      gap: 4,
    },
    statBlockDivided: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    bigNumber: {
      color: colors.textPrimary,
      fontSize: 44,
      fontWeight: '800',
    },
    bigNumberUnit: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    calorieText: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
    },
    actions: {
      gap: 16,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 26,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonPressed: {
      opacity: 0.85,
    },
    primaryIcon: {
      fontSize: 22,
      color: '#04140D',
    },
    primaryButtonText: {
      color: '#04140D',
      fontWeight: '700',
      fontSize: 20,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    secondaryButtonPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    secondaryIcon: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
