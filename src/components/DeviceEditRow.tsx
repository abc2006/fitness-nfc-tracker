import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Device } from '../types';

interface Props {
  device: Device;
  onPress: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

export function DeviceEditRow({ device, onPress, onToggleEnabled }: Props) {
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
      gap: 12,
    },
    cardDisabled: {
      opacity: 0.55,
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
    notes: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });

  return (
    <View style={[styles.card, !device.enabled && styles.cardDisabled]}>
      <Pressable style={styles.info} onPress={onPress} hitSlop={4}>
        <Text style={[styles.name, !device.enabled && styles.textMuted]}>{device.deviceName}</Text>
        <Text style={styles.meta}>
          {device.sets.length} {device.sets.length === 1 ? 'Satz' : 'Sätze'} · Tag {device.tagId.slice(0, 12)}
        </Text>
        {!!device.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {device.notes}
          </Text>
        )}
      </Pressable>
      <Switch
        value={device.enabled}
        onValueChange={onToggleEnabled}
        trackColor={{ false: colors.border, true: colors.primaryMuted }}
        thumbColor={device.enabled ? colors.primary : colors.textMuted}
      />
    </View>
  );
}
