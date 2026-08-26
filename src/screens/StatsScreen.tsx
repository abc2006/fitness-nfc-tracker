import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from '../components/charts/BarChart';
import { StatBox } from '../components/StatBox';
import { getAllDevices, getWorkoutSessions } from '../db/database';
import { useTheme } from '../theme/ThemeContext';
import { Device, RootStackParamList, WorkoutSessionRecord } from '../types';
import {
  computeAllStats,
  computeExerciseSummaries,
  formatDayLabel,
  formatDuration,
  sessionsInLastMonths,
  totalWeightForSession,
} from '../utils/stats';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

type Tab = 'alle' | 'uebungen';

export default function StatsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('alle');
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useFocusEffect(
    useCallback(() => {
      getWorkoutSessions().then(setSessions).catch(console.warn);
      getAllDevices().then(setDevices).catch(console.warn);
    }, [])
  );

  const recentSessions = useMemo(() => sessionsInLastMonths(sessions, 3).slice().reverse(), [sessions]);
  const stats = useMemo(() => computeAllStats(sessions), [sessions]);
  const exerciseSummaries = useMemo(() => computeExerciseSummaries(sessions, devices), [sessions, devices]);

  const chartData = recentSessions.map((s) => ({
    label: formatDayLabel(s.completedAt.slice(0, 10)),
    value: totalWeightForSession(s),
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabs: {
      flexDirection: 'row',
      margin: 20,
      marginBottom: 0,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.primaryMuted,
    },
    tabText: {
      color: colors.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
    tabTextActive: {
      color: colors.primary,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      gap: 12,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 40,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    exerciseRowPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    exerciseInfo: {
      flex: 1,
      gap: 4,
    },
    exerciseName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    exerciseMeta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    exerciseRm: {
      alignItems: 'flex-end',
    },
    exerciseRmValue: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    exerciseRmLabel: {
      color: colors.textMuted,
      fontSize: 11,
    },
    chevron: {
      color: colors.textMuted,
      fontSize: 24,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'alle' && styles.tabActive]} onPress={() => setTab('alle')}>
          <Text style={[styles.tabText, tab === 'alle' && styles.tabTextActive]}>Alle</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'uebungen' && styles.tabActive]} onPress={() => setTab('uebungen')}>
          <Text style={[styles.tabText, tab === 'uebungen' && styles.tabTextActive]}>Übungen</Text>
        </Pressable>
      </View>

      {tab === 'alle' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gesamtgewicht</Text>
            <BarChart data={chartData} height={160} labelColor={colors.textMuted} emptyColor={colors.textMuted} />
          </View>

          <View style={styles.statsGrid}>
            <StatBox label="Workouts" value={String(stats.workoutCount)} />
            <StatBox label="Ø Dauer" value={stats.workoutCount > 0 ? formatDuration(stats.avgDurationSeconds) : '–'} />
            <StatBox label="Gehobenes Gewicht" value={`${Math.round(stats.totalWeight).toLocaleString('de-DE')} kg`} />
            <StatBox label="Kumulierte Dauer" value={formatDuration(stats.cumulatedDurationSeconds)} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {exerciseSummaries.length === 0 && <Text style={styles.emptyText}>Noch keine Übungen vorhanden.</Text>}
          {exerciseSummaries.map((ex) => (
            <Pressable
              key={ex.tagId}
              style={({ pressed }) => [styles.exerciseRow, pressed && styles.exerciseRowPressed]}
              onPress={() => navigation.navigate('ExerciseStats', { tagId: ex.tagId })}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{ex.deviceName}</Text>
                <Text style={styles.exerciseMeta}>
                  {ex.sessionCount} {ex.sessionCount === 1 ? 'Training' : 'Trainings'}
                </Text>
              </View>
              <View style={styles.exerciseRm}>
                <Text style={styles.exerciseRmValue}>
                  {ex.oneRepMax != null ? `${Math.round(ex.oneRepMax)} kg` : '–'}
                </Text>
                <Text style={styles.exerciseRmLabel}>1RM (Epley)</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
