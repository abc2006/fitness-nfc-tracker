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
  sets: SetEntry[];
}

export type RootStackParamList = {
  Home: undefined;
  Capture: { tagId: string };
  Training: { tagId: string };
};
