import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  setNumber: number;
  weight: string;
  reps: string;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  showAddButton: boolean;
  onAdd: () => void;
}

export function EditableSetRow({
  setNumber,
  weight,
  reps,
  onChangeWeight,
  onChangeReps,
  showAddButton,
  onAdd,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{setNumber}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Gewicht (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={onChangeWeight}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Wdh.</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={reps}
          onChangeText={onChangeReps}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      {showAddButton && (
        <Pressable style={styles.addButton} onPress={onAdd} hitSlop={8}>
          <Text style={styles.addButtonText}>OK</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 14,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  addButtonText: {
    color: '#04140D',
    fontWeight: '700',
    fontSize: 15,
  },
});
