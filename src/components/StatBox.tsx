import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  label: string;
  value: string;
}

export function StatBox({ label, value }: Props) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    box: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 14,
      gap: 6,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.box}>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
