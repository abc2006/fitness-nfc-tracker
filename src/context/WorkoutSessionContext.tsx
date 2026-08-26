import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { clearWorkoutInProgress, saveWorkoutInProgress } from '../db/database';
import { cancelAutoCompleteReminder, scheduleAutoCompleteReminder } from '../utils/notifications';

interface WorkoutSessionValue {
  startedAt: number | null;
  completedTagIds: Set<string>;
  deviceDurations: Record<string, number>;
  markComplete: (tagId: string, durationSeconds: number) => void;
  isComplete: (tagId: string) => boolean;
  reset: () => void;
  finalize: () => void;
}

const WorkoutSessionContext = createContext<WorkoutSessionValue | null>(null);

export function WorkoutSessionProvider({ children }: { children: React.ReactNode }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedTagIds, setCompletedTagIds] = useState<Set<string>>(new Set());
  const [deviceDurations, setDeviceDurations] = useState<Record<string, number>>({});

  const startedAtRef = useRef<number | null>(null);
  const completedRef = useRef<Set<string>>(new Set());
  const durationsRef = useRef<Record<string, number>>({});

  const persist = () => {
    if (startedAtRef.current == null) return;
    saveWorkoutInProgress({
      startedAt: startedAtRef.current,
      lastActivityAt: Date.now(),
      completedTagIds: [...completedRef.current],
      deviceDurations: durationsRef.current,
    }).catch((error) => console.warn('Failed to persist workout progress', error));
  };

  const markComplete = useCallback((tagId: string, durationSeconds: number) => {
    completedRef.current = new Set(completedRef.current).add(tagId);
    durationsRef.current = { ...durationsRef.current, [tagId]: durationSeconds };
    setCompletedTagIds(new Set(completedRef.current));
    setDeviceDurations({ ...durationsRef.current });
    persist();

    if (startedAtRef.current != null) {
      scheduleAutoCompleteReminder(startedAtRef.current, Date.now()).catch((error) =>
        console.warn('Failed to schedule auto-complete reminder', error)
      );
    }
  }, []);

  const reset = useCallback(() => {
    const now = Date.now();
    startedAtRef.current = now;
    completedRef.current = new Set();
    durationsRef.current = {};
    setStartedAt(now);
    setCompletedTagIds(new Set());
    setDeviceDurations({});
    persist();
  }, []);

  const finalize = useCallback(() => {
    startedAtRef.current = null;
    completedRef.current = new Set();
    durationsRef.current = {};
    setStartedAt(null);
    setCompletedTagIds(new Set());
    setDeviceDurations({});
    clearWorkoutInProgress().catch((error) => console.warn('Failed to clear workout progress', error));
    cancelAutoCompleteReminder().catch((error) => console.warn('Failed to cancel auto-complete reminder', error));
  }, []);

  const isComplete = useCallback((tagId: string) => completedTagIds.has(tagId), [completedTagIds]);

  const value = useMemo(
    () => ({ startedAt, completedTagIds, deviceDurations, markComplete, isComplete, reset, finalize }),
    [startedAt, completedTagIds, deviceDurations, markComplete, isComplete, reset, finalize]
  );

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
}

export function useWorkoutSession(): WorkoutSessionValue {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) {
    throw new Error('useWorkoutSession must be used within a WorkoutSessionProvider');
  }
  return ctx;
}
