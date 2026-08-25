import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  durationSeconds: number;
  onComplete: () => void;
}

const BEEP_ASSET = require('../../assets/sounds/beep.wav');

export function RestTimer({ durationSeconds, onComplete }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const player = useAudioPlayer(BEEP_ASSET);
  const firedSecondsRef = useRef<Set<number>>(new Set());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onCompleteRef.current();
      return;
    }

    if (secondsLeft <= 3 && !firedSecondsRef.current.has(secondsLeft)) {
      firedSecondsRef.current.add(secondsLeft);
      try {
        player.seekTo(0);
        player.play();
      } catch {
        // Ignore playback errors (e.g. silent mode restrictions).
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    const timeout = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft, player]);

  const isCountingDown = secondsLeft <= 3 && secondsLeft > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pause</Text>
      <Text style={[styles.time, isCountingDown && styles.timeUrgent]}>
        {Math.max(secondsLeft, 0)}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  time: {
    color: colors.primary,
    fontSize: 72,
    fontWeight: '700',
  },
  timeUrgent: {
    color: colors.danger,
  },
});
