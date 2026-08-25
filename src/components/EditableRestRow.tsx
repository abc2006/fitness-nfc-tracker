import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  restTimeSeconds: string;
  onChange: (value: string) => void;
}

export function EditableRestRow({ restTimeSeconds, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.icon}>⏱</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={restTimeSeconds}
        onChangeText={onChange}
        placeholder="Pause (Sek.)"
        placeholderTextColor={colors.textMuted}
      />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginLeft: 42,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  icon: {
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 14,
    minWidth: 130,
    textAlign: 'center',
  },
});
