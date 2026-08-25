import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { NfcStatus } from '../hooks/useNfc';

const STATUS_TEXT: Record<NfcStatus, string> = {
  checking: 'Prüfe NFC-Hardware...',
  scanning: 'Bereit zum Scannen – halte dein Smartphone an das Gerät...',
  disabled: 'NFC ist deaktiviert. Bitte in den Einstellungen aktivieren.',
  unsupported: 'Dieses Gerät unterstützt kein NFC.',
  idle: 'NFC-Scanner pausiert.',
};

interface Props {
  status: NfcStatus;
}

export function NfcStatusBadge({ status }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const isActive = status === 'scanning';

  useEffect(() => {
    if (!isActive) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isActive, pulse]);

  const isProblem = status === 'disabled' || status === 'unsupported';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconCircle,
          { transform: [{ scale: pulse }] },
          isProblem && styles.iconCircleWarning,
        ]}
      >
        <Text style={styles.icon}>{isProblem ? '⚠️' : '📡'}</Text>
      </Animated.View>
      <Text style={styles.statusText}>{STATUS_TEXT[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleWarning: {
    backgroundColor: '#4A2626',
  },
  icon: {
    fontSize: 40,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
