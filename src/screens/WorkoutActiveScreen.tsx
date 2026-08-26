import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExerciseCard } from '../components/ExerciseCard';
import { NfcStatusBadge } from '../components/NfcStatusBadge';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { getAllDevices, getDeviceByTagId, saveWorkoutSession } from '../db/database';
import { useNfc } from '../hooks/useNfc';
import { useTheme } from '../theme/ThemeContext';
import { Device, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutActive'>;

export default function WorkoutActiveScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const { startedAt, completedTagIds, deviceDurations, finalize } = useWorkoutSession();
  const promptedRef = useRef(false);

  const activeDevices = useMemo(() => devices.filter((d) => d.enabled), [devices]);

  const confirmEndWorkout = useCallback(() => {
    Alert.alert('Training abschließen?', undefined, [
      {
        text: 'Nein',
        style: 'cancel',
        onPress: () => {
          promptedRef.current = false;
        },
      },
      {
        text: 'Ja',
        onPress: async () => {
          try {
            const completedDevices = await Promise.all(
              [...completedTagIds].map((tagId) => getDeviceByTagId(tagId))
            );
            const totalDurationSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
            const deviceDurationInputs = [...completedTagIds].map((tagId) => ({
              tagId,
              durationSeconds: deviceDurations[tagId] ?? 0,
            }));
            await saveWorkoutSession(
              completedDevices.filter((d): d is Device => d !== null),
              totalDurationSeconds,
              deviceDurationInputs
            );
          } catch (error) {
            console.warn('Failed to save workout session', error);
          }
          finalize();
          navigation.navigate('Home');
        },
      },
    ]);
  }, [navigation, finalize, completedTagIds, startedAt, deviceDurations]);

  const handleTagDiscovered = useCallback(
    (tagId: string) => {
      const device = activeDevices.find((d) => d.tagId === tagId);
      if (!device) {
        Alert.alert('Unbekanntes Gerät', 'Dieses Gerät ist nicht Teil des aktuellen Workouts.');
        return;
      }
      navigation.navigate('Training', { tagId });
    },
    [activeDevices, navigation]
  );

  const { status, startScan, stopScan } = useNfc(handleTagDiscovered);

  useFocusEffect(
    useCallback(() => {
      getAllDevices().then(setDevices).catch(console.warn);
      startScan();
      return () => {
        stopScan();
      };
    }, [startScan, stopScan])
  );

  React.useEffect(() => {
    if (activeDevices.length === 0) return;
    const allDone = activeDevices.every((d) => completedTagIds.has(d.tagId));
    if (allDone && !promptedRef.current) {
      promptedRef.current = true;
      confirmEndWorkout();
    }
  }, [activeDevices, completedTagIds, confirmEndWorkout]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    listTitle: {
      color: colors.textSecondary,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 14,
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 40,
      paddingHorizontal: 24,
      lineHeight: 20,
    },
    endButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 12,
    },
    endButtonPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    endButtonText: {
      color: colors.danger,
      fontWeight: '700',
      fontSize: 15,
    },
  });

  return (
    <View style={styles.container}>
      <NfcStatusBadge status={status} />

      <FlatList
        data={activeDevices}
        keyExtractor={(item) => item.tagId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ExerciseCard
            device={item}
            isDone={completedTagIds.has(item.tagId)}
            onPress={() => navigation.navigate('Training', { tagId: item.tagId })}
          />
        )}
        ListHeaderComponent={<Text style={styles.listTitle}>Übungen</Text>}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Keine aktiven Geräte. Aktiviere Geräte unter „Workout editieren“.
          </Text>
        }
        ListFooterComponent={
          activeDevices.length > 0 ? (
            <Pressable
              style={({ pressed }) => [styles.endButton, pressed && styles.endButtonPressed]}
              onPress={confirmEndWorkout}
            >
              <Text style={styles.endButtonText}>Training abschließen</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}
