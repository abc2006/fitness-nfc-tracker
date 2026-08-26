import {
  clearWorkoutInProgress,
  getDeviceByTagId,
  getUserProfile,
  getWorkoutInProgress,
  saveWorkoutSession,
} from '../db/database';
import { Device } from '../types';
import { caloriesForDuration } from './stats';

const STALE_THRESHOLD_MS = 30 * 60 * 1000;
const GRACE_PERIOD_MS = 2 * 60 * 1000;

export interface AutoCompleteResult {
  calories: number;
}

export async function checkAndAutoCompleteStaleWorkout(): Promise<AutoCompleteResult | null> {
  const inProgress = await getWorkoutInProgress();
  if (!inProgress) return null;

  const now = Date.now();
  if (now - inProgress.lastActivityAt < STALE_THRESHOLD_MS) return null;

  await clearWorkoutInProgress();

  if (inProgress.completedTagIds.length === 0) return null;

  const completedAtMs = inProgress.lastActivityAt + GRACE_PERIOD_MS;
  const totalDurationSeconds = Math.max(0, Math.round((completedAtMs - inProgress.startedAt) / 1000));

  const devices = await Promise.all(inProgress.completedTagIds.map((tagId) => getDeviceByTagId(tagId)));
  const validDevices = devices.filter((d): d is Device => d !== null);
  if (validDevices.length === 0) return null;

  const deviceDurationInputs = inProgress.completedTagIds.map((tagId) => ({
    tagId,
    durationSeconds: inProgress.deviceDurations[tagId] ?? 0,
  }));

  await saveWorkoutSession(
    validDevices,
    totalDurationSeconds,
    deviceDurationInputs,
    new Date(completedAtMs).toISOString()
  );

  const profile = await getUserProfile();
  const calories = caloriesForDuration(totalDurationSeconds, profile);

  return { calories };
}
