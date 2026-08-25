import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RestTimer } from '../components/RestTimer';
import { TrainingSetRow } from '../components/TrainingSetRow';
import { getDeviceByTagId } from '../db/database';
import { colors } from '../theme/colors';
import { Device, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Training'>;

export default function TrainingScreen({ route, navigation }: Props) {
  const { tagId } = route.params;
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [doneSetIds, setDoneSetIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  useEffect(() => {
    getDeviceByTagId(tagId)
      .then((result) => setDevice(result))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [tagId]);

  const advanceOrFinish = useCallback(
    (index: number) => {
      if (!device || index >= device.sets.length - 1) {
        navigation.goBack();
      } else {
        setActiveIndex(index + 1);
      }
    },
    [device, navigation]
  );

  const handleConfirmSet = useCallback(
    (index: number) => {
      if (!device) return;
      const set = device.sets[index];
      setDoneSetIds((prev) => new Set(prev).add(set.id));

      if (set.restTimeSeconds && set.restTimeSeconds > 0) {
        setRestSeconds(set.restTimeSeconds);
      } else {
        advanceOrFinish(index);
      }
    },
    [device, advanceOrFinish]
  );

  const handleTimerComplete = useCallback(() => {
    setRestSeconds(null);
    advanceOrFinish(activeIndex);
  }, [activeIndex, advanceOrFinish]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Gerät nicht gefunden.</Text>
      </View>
    );
  }

  if (restSeconds !== null) {
    return (
      <View style={styles.container}>
        <RestTimer durationSeconds={restSeconds} onComplete={handleTimerComplete} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{device.deviceName}</Text>
      {!!device.notes && <Text style={styles.notes}>{device.notes}</Text>}
      <Text style={styles.tagId}>Tag-ID: {device.tagId}</Text>

      <Text style={styles.sectionTitle}>Sätze</Text>
      {device.sets.map((set, index) => (
        <TrainingSetRow
          key={set.id}
          set={set}
          isDone={doneSetIds.has(set.id)}
          isActive={index === activeIndex}
          onConfirm={() => handleConfirmSet(index)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.textSecondary,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  tagId: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
});
