import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from '../components/charts/LineChart';
import { StatBox } from '../components/StatBox';
import { getDeviceByTagId, getWorkoutSessions } from '../db/database';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList, WorkoutSessionRecord } from '../types';
import { computeExerciseStats, formatDayLabel, formatDuration } from '../utils/stats';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseStats'>;

export default function ExerciseStatsScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { tagId } = route.params;
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getWorkoutSessions().then(setSessions).catch(console.warn);
      getDeviceByTagId(tagId)
        .then((device) => {
          if (device) navigation.setOptions({ title: device.deviceName });
        })
        .catch(console.warn);
    }, [tagId, navigation])
  );

  const stats = useMemo(() => computeExerciseStats(tagId, sessions), [tagId, sessions]);

  const chartData = stats.dailyTotals.map((d) => ({
    label: formatDayLabel(d.date),
    value: d.totalWeight,
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gesamtgewicht pro Trainingstag</Text>
        <LineChart data={chartData} height={180} labelColor={colors.textMuted} emptyColor={colors.textMuted} />
      </View>

      <View style={styles.statsGrid}>
        <StatBox label="Trainingseinheiten" value={String(stats.sessionCount)} />
        <StatBox label="Wiederholungen" value={String(stats.totalReps)} />
        <StatBox label="Aufgewendete Zeit" value={stats.durationSeconds > 0 ? formatDuration(stats.durationSeconds) : '–'} />
        <StatBox label="Höchstes Gewicht" value={stats.maxWeight > 0 ? `${stats.maxWeight} kg` : '–'} />
        <StatBox label="1RM (Epley)" value={stats.oneRepMax > 0 ? `${Math.round(stats.oneRepMax)} kg` : '–'} />
        <StatBox label="Ø Gewicht/Tag" value={
          stats.dailyTotals.length > 0
            ? `${Math.round(stats.dailyTotals.reduce((s, d) => s + d.totalWeight, 0) / stats.dailyTotals.length).toLocaleString('de-DE')} kg`
            : '–'
        } />
      </View>
    </ScrollView>
  );
}
