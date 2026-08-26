import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { cancelRestEndNotification, scheduleRestEndNotification } from '../utils/notifications';
import { startRestTimerService, stopRestTimerService } from '../utils/restTimerService';

interface Props {
  durationSeconds: number;
  onComplete: () => void;
  compact?: boolean;
  onSkip?: () => void;
}

const BEEP_ASSET = require('../../assets/sounds/beep.wav');

export function RestTimer({ durationSeconds, onComplete, compact, onSkip }: Props) {
  const { colors } = useTheme();
  const endAtRef = useRef(Date.now() + durationSeconds * 1000);
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const player = useAudioPlayer(BEEP_ASSET);
  const firedSecondsRef = useRef<Set<number>>(new Set());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const notificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    // Recompute from the wall clock rather than only decrementing, since Android
    // suspends JS timers in the background — this re-syncs the moment ticks resume
    // or the app comes back to the foreground, instead of resuming a frozen count.
    const interval = setInterval(tick, 250);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // The countdown that actually triggers the alert runs natively inside this
    // service, since JS timers get throttled within seconds of the app going to
    // background — this line only kicks that native countdown off.
    startRestTimerService(durationSeconds).catch((error) =>
      console.warn('Failed to start rest timer foreground service', error)
    );
    return () => stopRestTimerService();
  }, []);

  useEffect(() => {
    scheduleRestEndNotification(durationSeconds)
      .then((id) => {
        notificationIdRef.current = id;
      })
      .catch((error) => console.warn('Failed to schedule rest-end notification', error));

    return () => {
      cancelRestEndNotification(notificationIdRef.current).catch((error) =>
        console.warn('Failed to cancel rest-end notification', error)
      );
    };
    // Runs once per mount; a restarted or skipped timer remounts this component (via `key`)
    // rather than updating durationSeconds in place, so no deps are needed here.
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      // The native foreground service already vibrates + beeps on completion
      // (it fires regardless of foreground/background state), so this branch
      // no longer replays that alert — doing so here would double it up
      // whenever the app catches up to a countdown that finished elsewhere.
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
  }, [secondsLeft, player]);

  const isCountingDown = secondsLeft <= 3 && secondsLeft > 0;

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
    compactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 20,
    },
    compactLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    compactTime: {
      color: colors.primary,
      fontSize: 24,
      fontWeight: '700',
      flex: 1,
    },
    skipButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    skipButtonText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactLabel}>Pause</Text>
        <Text style={[styles.compactTime, isCountingDown && styles.timeUrgent]}>
          {Math.max(secondsLeft, 0)}s
        </Text>
        {onSkip && (
          <Pressable style={styles.skipButton} onPress={onSkip} hitSlop={8}>
            <Text style={styles.skipButtonText}>Überspringen</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pause</Text>
      <Text style={[styles.time, isCountingDown && styles.timeUrgent]}>
        {Math.max(secondsLeft, 0)}s
      </Text>
    </View>
  );
}
