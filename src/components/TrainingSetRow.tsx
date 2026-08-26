import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SetEntry } from '../types';

interface Props {
  set: SetEntry;
  weight: string;
  reps: string;
  isDone: boolean;
  isActive: boolean;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onToggle: () => void;
}

export function TrainingSetRow({
  set,
  weight,
  reps,
  isDone,
  isActive,
  onChangeWeight,
  onChangeReps,
  onToggle,
}: Props) {
  const { colors } = useTheme();

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
    rowActive: {
      borderColor: colors.primary,
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
    editableInfo: {
      flex: 1,
      flexDirection: 'row',
      gap: 10,
    },
    editableField: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
    },
    input: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 16,
      paddingVertical: 10,
    },
    inputUnit: {
      color: colors.textMuted,
      fontSize: 12,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    checkboxMark: {
      color: '#04140D',
      fontWeight: '700',
      fontSize: 16,
    },
  });

  return (
    <View style={[styles.row, isDone && styles.rowDone, isActive && !isDone && styles.rowActive]}>
      <View style={[styles.badge, isDone && styles.badgeDone]}>
        <Text style={styles.badgeText}>{isDone ? '✓' : set.setNumber}</Text>
      </View>
      {isDone ? (
        <View style={styles.info}>
          <Text style={[styles.value, styles.valueDone]}>{weight} kg</Text>
          <Text style={[styles.subValue, styles.valueDone]}>{reps} Wdh.</Text>
        </View>
      ) : (
        <View style={styles.editableInfo}>
          <View style={styles.editableField}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={onChangeWeight}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus
            />
            <Text style={styles.inputUnit}>kg</Text>
          </View>
          <View style={styles.editableField}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={reps}
              onChangeText={onChangeReps}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus
            />
            <Text style={styles.inputUnit}>Wdh.</Text>
          </View>
        </View>
      )}
      <Pressable
        style={[styles.checkbox, isDone && styles.checkboxChecked]}
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
      >
        {isDone && <Text style={styles.checkboxMark}>✓</Text>}
      </Pressable>
    </View>
  );
}
