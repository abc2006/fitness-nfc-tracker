import { Device, UserProfile, WorkoutSessionRecord } from '../types';

export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

export function totalWeightForSession(session: WorkoutSessionRecord): number {
  return session.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

const STRENGTH_TRAINING_MET = 6;
const DEFAULT_BODY_WEIGHT_KG = 75;

export function caloriesForDuration(durationSeconds: number, profile: UserProfile | null): number {
  const weightKg = profile?.weightKg ?? DEFAULT_BODY_WEIGHT_KG;
  const hours = durationSeconds / 3600;
  return Math.round(STRENGTH_TRAINING_MET * weightKg * hours);
}

export function caloriesForSession(session: WorkoutSessionRecord, profile: UserProfile | null): number {
  return caloriesForDuration(session.durationSeconds, profile);
}

export function sessionsInLastMonths(sessions: WorkoutSessionRecord[], months: number): WorkoutSessionRecord[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return sessions.filter((s) => new Date(s.completedAt) >= cutoff);
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDayLabel(isoDay: string): string {
  const [, month, day] = isoDay.split('-');
  return `${day}.${month}.`;
}

export interface AllStats {
  workoutCount: number;
  avgDurationSeconds: number;
  totalWeight: number;
  cumulatedDurationSeconds: number;
}

export function computeAllStats(sessions: WorkoutSessionRecord[]): AllStats {
  const workoutCount = sessions.length;
  const cumulatedDurationSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const avgDurationSeconds = workoutCount > 0 ? Math.round(cumulatedDurationSeconds / workoutCount) : 0;
  const totalWeight = sessions.reduce((sum, s) => sum + totalWeightForSession(s), 0);
  return { workoutCount, avgDurationSeconds, totalWeight, cumulatedDurationSeconds };
}

export interface ExerciseSummary {
  tagId: string;
  deviceName: string;
  sessionCount: number;
  oneRepMax: number | null;
}

export function computeExerciseSummaries(
  sessions: WorkoutSessionRecord[],
  devices: Device[]
): ExerciseSummary[] {
  const byTagId = new Map<string, { deviceName: string; sessionIds: Set<string>; maxEpley: number }>();
  for (const session of sessions) {
    for (const set of session.sets) {
      const entry = byTagId.get(set.tagId) ?? { deviceName: set.deviceName, sessionIds: new Set(), maxEpley: 0 };
      entry.sessionIds.add(session.id);
      entry.maxEpley = Math.max(entry.maxEpley, epley1RM(set.weight, set.reps));
      byTagId.set(set.tagId, entry);
    }
  }

  return devices.map((device) => {
    const entry = byTagId.get(device.tagId);
    if (entry) {
      return {
        tagId: device.tagId,
        deviceName: device.deviceName,
        sessionCount: entry.sessionIds.size,
        oneRepMax: entry.maxEpley,
      };
    }
    const fallbackMax = device.sets.reduce((max, s) => Math.max(max, epley1RM(s.weight, s.reps)), 0);
    return {
      tagId: device.tagId,
      deviceName: device.deviceName,
      sessionCount: 0,
      oneRepMax: fallbackMax > 0 ? fallbackMax : null,
    };
  });
}

export interface ExerciseStats {
  sessionCount: number;
  totalReps: number;
  durationSeconds: number;
  maxWeight: number;
  oneRepMax: number;
  dailyTotals: { date: string; totalWeight: number }[];
}

export function computeExerciseStats(tagId: string, sessions: WorkoutSessionRecord[]): ExerciseStats {
  let sessionCount = 0;
  let totalReps = 0;
  let durationSeconds = 0;
  let maxWeight = 0;
  let oneRepMax = 0;
  const dailyMap = new Map<string, number>();

  for (const session of sessions) {
    const sets = session.sets.filter((s) => s.tagId === tagId);
    if (sets.length === 0) continue;
    sessionCount += 1;
    const device = session.devices.find((d) => d.tagId === tagId);
    durationSeconds += device?.durationSeconds ?? 0;

    const day = session.completedAt.slice(0, 10);
    let dayTotal = dailyMap.get(day) ?? 0;

    for (const set of sets) {
      totalReps += set.reps;
      maxWeight = Math.max(maxWeight, set.weight);
      oneRepMax = Math.max(oneRepMax, epley1RM(set.weight, set.reps));
      dayTotal += set.weight * set.reps;
    }
    dailyMap.set(day, dayTotal);
  }

  const dailyTotals = [...dailyMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, totalWeight]) => ({ date, totalWeight }));

  return { sessionCount, totalReps, durationSeconds, maxWeight, oneRepMax, dailyTotals };
}
