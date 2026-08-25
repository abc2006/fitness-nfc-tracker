import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { SetEntry } from '../types';

interface Props {
  set: SetEntry;
  isDone: boolean;
  isActive: boolean;
  onConfirm: () => void;
}

export function TrainingSetRow({ set, isDone, isActive, onConfirm }: Props) {
  return (
    <View style={[styles.row, isDone && styles.rowDone]}>
      <View style={[styles.badge, isDone && styles.badgeDone]}>
        <Text style={styles.badgeText}>{isDone ? '✓' : set.setNumber}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.value, isDone && styles.valueDone]}>{set.weight} kg</Text>
        <Text style={[styles.subValue, isDone && styles.valueDone]}>{set.reps} Wdh.</Text>
      </View>
      {isActive && !isDone && (
        <Pressable style={styles.okButton} onPress={onConfirm} hitSlop={8}>
          <Text style={styles.okButtonText}>OK</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
  rowDone: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.done,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'baseline',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  subValue: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  valueDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  okButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  okButtonText: {
    color: '#04140D',
    fontWeight: '700',
    fontSize: 15,
  },
});
