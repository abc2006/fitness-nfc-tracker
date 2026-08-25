import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Device } from '../types';

interface Props {
  device: Device;
  onPress: () => void;
}

export function DeviceListItem({ device, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name}>{device.deviceName}</Text>
        <Text style={styles.meta}>
          {device.sets.length} {device.sets.length === 1 ? 'Satz' : 'Sätze'} · Tag {device.tagId.slice(0, 12)}
        </Text>
        {!!device.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {device.notes}
          </Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

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
  },
  cardPressed: {
    backgroundColor: colors.surfaceAlt,
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
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  notes: {
    color: colors.textMuted,
    fontSize: 13,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 28,
    marginLeft: 8,
  },
});
