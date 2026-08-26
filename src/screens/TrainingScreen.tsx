import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RestTimer } from '../components/RestTimer';
import { TrainingSetRow } from '../components/TrainingSetRow';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { getDeviceByTagId, updateSetEntry } from '../db/database';
import { useTheme } from '../theme/ThemeContext';
import { Device, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Training'>;

interface DraftValues {
  weight: string;
  reps: string;
}

export default function TrainingScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { tagId } = route.params;
  const { markComplete } = useWorkoutSession();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [doneSetIds, setDoneSetIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restKey, setRestKey] = useState(0);
  const [draft, setDraft] = useState<Record<string, DraftValues>>({});
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);
  const enteredAtRef = useRef(Date.now());

  useEffect(() => {
    getDeviceByTagId(tagId)
      .then((result) => {
        setDevice(result);
        if (result) {
          navigation.setOptions({ title: result.deviceName });
          setDraft(
            Object.fromEntries(
              result.sets.map((s) => [s.id, { weight: String(s.weight), reps: String(s.reps) }])
            )
          );
        }
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [tagId, navigation]);

  const finishDevice = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    const durationSeconds = Math.round((Date.now() - enteredAtRef.current) / 1000);
    setTimeout(() => {
      markComplete(tagId, durationSeconds);
      navigation.goBack();
    }, 500);
  }, [markComplete, tagId, navigation]);

  const advanceOrFinish = useCallback(
    (index: number) => {
      if (!device || index >= device.sets.length - 1) {
        finishDevice();
      } else {
        setActiveIndex(index + 1);
      }
    },
    [device, finishDevice]
  );

  const handleToggleSet = useCallback(
    (index: number) => {
      if (!device || finishingRef.current) return;
      const set = device.sets[index];

      if (doneSetIds.has(set.id)) {
        setDoneSetIds((prev) => {
          const next = new Set(prev);
          next.delete(set.id);
          return next;
        });
        return;
      }

      const values = draft[set.id];
      const weight = values ? parseFloat(values.weight.replace(',', '.')) : set.weight;
      const reps = values ? parseInt(values.reps, 10) : set.reps;
      updateSetEntry(set.id, Number.isFinite(weight) ? weight : 0, Number.isFinite(reps) ? reps : 0).catch(
        (error) => console.warn('Failed to persist set', error)
      );

      setDoneSetIds((prev) => new Set(prev).add(set.id));

      const isLastSet = index >= device.sets.length - 1;
      if (isLastSet) {
        setRestSeconds(null);
        finishDevice();
        return;
      }

      if (restSeconds !== null) {
        setRestKey((k) => k + 1);
      }

      if (index !== activeIndex) return;

      if (set.restTimeSeconds && set.restTimeSeconds > 0) {
        setRestSeconds(set.restTimeSeconds);
      } else {
        advanceOrFinish(index);
      }
    },
    [device, doneSetIds, draft, activeIndex, restSeconds, advanceOrFinish, finishDevice]
  );

  const handleTimerComplete = useCallback(() => {
    setRestSeconds(null);
    advanceOrFinish(activeIndex);
  }, [activeIndex, advanceOrFinish]);

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
    notes: {
      color: colors.textSecondary,
      fontSize: 14,
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
    finishButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 12,
    },
    finishButtonDisabled: {
      opacity: 0.6,
    },
    finishButtonText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 16,
    },
    toast: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    toastText: {
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
  });

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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!!device.notes && <Text style={styles.notes}>{device.notes}</Text>}
      <Text style={styles.tagId}>Tag-ID: {device.tagId}</Text>

      {finishing ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>Gerät wird abgeschlossen</Text>
        </View>
      ) : (
        restSeconds !== null && (
          <RestTimer
            key={restKey}
            durationSeconds={restSeconds}
            onComplete={handleTimerComplete}
            compact
            onSkip={handleTimerComplete}
          />
        )
      )}

      <Text style={styles.sectionTitle}>Sätze</Text>
      {device.sets.map((set, index) => (
        <TrainingSetRow
          key={set.id}
          set={set}
          weight={draft[set.id]?.weight ?? String(set.weight)}
          reps={draft[set.id]?.reps ?? String(set.reps)}
          isDone={doneSetIds.has(set.id)}
          isActive={index === activeIndex}
          onChangeWeight={(v) => setDraft((prev) => ({ ...prev, [set.id]: { ...prev[set.id], weight: v } }))}
          onChangeReps={(v) => setDraft((prev) => ({ ...prev, [set.id]: { ...prev[set.id], reps: v } }))}
          onToggle={() => handleToggleSet(index)}
        />
      ))}

      <Pressable
        style={[styles.finishButton, finishing && styles.finishButtonDisabled]}
        onPress={finishDevice}
        disabled={finishing}
      >
        <Text style={styles.finishButtonText}>Gerät abschließen</Text>
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
