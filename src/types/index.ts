export interface SetEntry {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  restTimeSeconds: number | null;
}

export interface Device {
  tagId: string;
  deviceName: string;
  notes: string;
  enabled: boolean;
  sets: SetEntry[];
}

export interface WorkoutSessionSetRecord {
  tagId: string;
  deviceName: string;
  setNumber: number;
  weight: number;
  reps: number;
  restTimeSeconds: number | null;
}

export interface WorkoutSessionDeviceRecord {
  tagId: string;
  deviceName: string;
  durationSeconds: number;
}

export interface WorkoutSessionRecord {
  id: string;
  completedAt: string;
  durationSeconds: number;
  sets: WorkoutSessionSetRecord[];
  devices: WorkoutSessionDeviceRecord[];
}

export type Gender = 'male' | 'female' | 'other';

export interface UserProfile {
  firstName: string;
  lastName: string;
  gender: Gender | null;
  weightKg: number | null;
  heightCm: number | null;
  birthDate: string | null;
}

export type RootStackParamList = {
  Home: undefined;
  EditWorkout: undefined;
  Capture: { tagId: string };
  WorkoutActive: undefined;
  Training: { tagId: string };
  Settings: undefined;
  Stats: undefined;
  ExerciseStats: { tagId: string };
};
