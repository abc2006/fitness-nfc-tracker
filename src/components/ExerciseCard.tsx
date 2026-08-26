import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Device } from '../types';

interface Props {
  device: Device;
  isDone: boolean;
  onPress: () => void;
}

export function ExerciseCard({ device, isDone, onPress }: Props) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },
    cardDone: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.done,
      opacity: 0.6,
    },
    cardPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    badge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeDone: {
      backgroundColor: colors.done,
    },
    badgeText: {
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 16,
    },
    info: {
      flex: 1,
      gap: 4,
    },
    name: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '600',
    },
    textMuted: {
      color: colors.textMuted,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    chevron: {
      color: colors.textMuted,
      fontSize: 26,
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, isDone && styles.cardDone, pressed && !isDone && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={[styles.badge, isDone && styles.badgeDone]}>
        <Text style={styles.badgeText}>{isDone ? '✓' : device.deviceName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, isDone && styles.textMuted]}>{device.deviceName}</Text>
        <Text style={styles.meta}>{device.sets.length} {device.sets.length === 1 ? 'Satz' : 'Sätze'}</Text>
      </View>
      <Text style={[styles.chevron, isDone && styles.textMuted]}>›</Text>
    </Pressable>
  );
}
