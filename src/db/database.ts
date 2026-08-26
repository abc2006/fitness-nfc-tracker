import * as SQLite from 'expo-sqlite';
import { Device, SetEntry, UserProfile, WorkoutSessionRecord } from '../types';
import { generateId } from '../utils/uuid';

const EXPORT_FORMAT_VERSION = 1;

const DB_NAME = 'fitness_nfc_tracker.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS devices (
      tagId TEXT PRIMARY KEY NOT NULL,
      deviceName TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      tagId TEXT NOT NULL,
      setNumber INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      restTimeSeconds INTEGER,
      FOREIGN KEY (tagId) REFERENCES devices (tagId) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      completedAt TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS workout_session_sets (
      id TEXT PRIMARY KEY NOT NULL,
      sessionId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      deviceName TEXT NOT NULL,
      setNumber INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      restTimeSeconds INTEGER,
      FOREIGN KEY (sessionId) REFERENCES workout_sessions (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS workout_session_devices (
      id TEXT PRIMARY KEY NOT NULL,
      sessionId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      deviceName TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (sessionId) REFERENCES workout_sessions (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      firstName TEXT NOT NULL DEFAULT '',
      lastName TEXT NOT NULL DEFAULT '',
      gender TEXT,
      weightKg REAL,
      heightCm REAL,
      birthDate TEXT
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workout_in_progress (
      id TEXT PRIMARY KEY NOT NULL,
      startedAt INTEGER NOT NULL,
      lastActivityAt INTEGER NOT NULL,
      completedTagIdsJson TEXT NOT NULL,
      deviceDurationsJson TEXT NOT NULL
    );
  `);
}

export async function getAllDevices(): Promise<Device[]> {
  const db = await getDb();
  const deviceRows = await db.getAllAsync<{ tagId: string; deviceName: string; notes: string; enabled: number }>(
    'SELECT tagId, deviceName, notes, enabled FROM devices ORDER BY rowid DESC'
  );
  const setRows = await db.getAllAsync<{
    id: string;
    tagId: string;
    setNumber: number;
    weight: number;
    reps: number;
    restTimeSeconds: number | null;
  }>('SELECT id, tagId, setNumber, weight, reps, restTimeSeconds FROM sets ORDER BY setNumber ASC');

  return deviceRows.map((row) => ({
    tagId: row.tagId,
    deviceName: row.deviceName,
    notes: row.notes,
    enabled: row.enabled !== 0,
    sets: setRows
      .filter((s) => s.tagId === row.tagId)
      .map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        restTimeSeconds: s.restTimeSeconds,
      })),
  }));
}

export async function getDeviceByTagId(tagId: string): Promise<Device | null> {
  const db = await getDb();
  const deviceRow = await db.getFirstAsync<{ tagId: string; deviceName: string; notes: string; enabled: number }>(
    'SELECT tagId, deviceName, notes, enabled FROM devices WHERE tagId = ?',
    [tagId]
  );
  if (!deviceRow) return null;

  const setRows = await db.getAllAsync<{
    id: string;
    setNumber: number;
    weight: number;
    reps: number;
    restTimeSeconds: number | null;
  }>('SELECT id, setNumber, weight, reps, restTimeSeconds FROM sets WHERE tagId = ? ORDER BY setNumber ASC', [
    tagId,
  ]);

  return {
    tagId: deviceRow.tagId,
    deviceName: deviceRow.deviceName,
    notes: deviceRow.notes,
    enabled: deviceRow.enabled !== 0,
    sets: setRows.map((s) => ({
      id: s.id,
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
      restTimeSeconds: s.restTimeSeconds,
    })),
  };
}

export async function saveDevice(device: Device): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO devices (tagId, deviceName, notes, enabled) VALUES (?, ?, ?, ?)',
      [device.tagId, device.deviceName, device.notes, device.enabled ? 1 : 0]
    );
    await db.runAsync('DELETE FROM sets WHERE tagId = ?', [device.tagId]);
    for (const set of device.sets) {
      await db.runAsync(
        'INSERT INTO sets (id, tagId, setNumber, weight, reps, restTimeSeconds) VALUES (?, ?, ?, ?, ?, ?)',
        [set.id, device.tagId, set.setNumber, set.weight, set.reps, set.restTimeSeconds]
      );
    }
  });
}

export async function setDeviceEnabled(tagId: string, enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE devices SET enabled = ? WHERE tagId = ?', [enabled ? 1 : 0, tagId]);
}

export async function updateSetEntry(setId: string, weight: number, reps: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sets SET weight = ?, reps = ? WHERE id = ?', [weight, reps, setId]);
}

export async function exportAppDataJson(): Promise<string> {
  const devices = await getAllDevices();
  const sessions = await getWorkoutSessions();
  const profile = await getUserProfile();
  const trainingDefaults = await getTrainingDefaults();
  return JSON.stringify(
    {
      format: 'fitness-nfc-tracker',
      version: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      devices,
      sessions,
      profile,
      trainingDefaults,
    },
    null,
    2
  );
}

export interface ImportSummary {
  devicesImported: number;
  sessionsImported: number;
  profileImported: boolean;
}

export async function importAppDataJson(json: string): Promise<ImportSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.');
  }

  const devicesRaw: unknown = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown> | null)?.devices;
  const sessionsRaw: unknown = Array.isArray(parsed) ? [] : (parsed as Record<string, unknown> | null)?.sessions;

  let devicesImported = 0;
  if (Array.isArray(devicesRaw)) {
    for (const raw of devicesRaw) {
      if (!raw || typeof raw !== 'object') continue;
      const d = raw as Record<string, unknown>;
      if (typeof d.tagId !== 'string' || typeof d.deviceName !== 'string') continue;

      const rawSets = Array.isArray(d.sets) ? d.sets : [];
      const sets: SetEntry[] = rawSets.map((raw, index) => {
        const s = (raw ?? {}) as Record<string, unknown>;
        return {
          id: typeof s.id === 'string' ? s.id : generateId(),
          setNumber: Number.isFinite(Number(s.setNumber)) ? Number(s.setNumber) : index + 1,
          weight: Number.isFinite(Number(s.weight)) ? Number(s.weight) : 0,
          reps: Number.isFinite(Number(s.reps)) ? Number(s.reps) : 0,
          restTimeSeconds:
            s.restTimeSeconds != null && Number.isFinite(Number(s.restTimeSeconds))
              ? Number(s.restTimeSeconds)
              : null,
        };
      });

      await saveDevice({
        tagId: d.tagId,
        deviceName: d.deviceName,
        notes: typeof d.notes === 'string' ? d.notes : '',
        enabled: typeof d.enabled === 'boolean' ? d.enabled : true,
        sets,
      });
      devicesImported += 1;
    }
  }

  let sessionsImported = 0;
  if (Array.isArray(sessionsRaw)) {
    const db = await getDb();
    for (const raw of sessionsRaw) {
      if (!raw || typeof raw !== 'object') continue;
      const s = raw as Record<string, unknown>;
      if (typeof s.completedAt !== 'string') continue;

      const completedAt: string = s.completedAt;
      const sessionId = typeof s.id === 'string' ? s.id : generateId();
      const durationSeconds = Number.isFinite(Number(s.durationSeconds)) ? Number(s.durationSeconds) : 0;
      const sets = Array.isArray(s.sets) ? s.sets : [];
      const sessionDevices = Array.isArray(s.devices) ? s.devices : [];

      await db.withTransactionAsync(async () => {
        await db.runAsync('INSERT OR REPLACE INTO workout_sessions (id, completedAt, durationSeconds) VALUES (?, ?, ?)', [
          sessionId,
          completedAt,
          durationSeconds,
        ]);
        await db.runAsync('DELETE FROM workout_session_sets WHERE sessionId = ?', [sessionId]);
        await db.runAsync('DELETE FROM workout_session_devices WHERE sessionId = ?', [sessionId]);

        for (const rawSet of sets) {
          const set = (rawSet ?? {}) as Record<string, unknown>;
          if (typeof set.tagId !== 'string' || typeof set.deviceName !== 'string') continue;
          await db.runAsync(
            `INSERT INTO workout_session_sets
              (id, sessionId, tagId, deviceName, setNumber, weight, reps, restTimeSeconds)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId(),
              sessionId,
              set.tagId,
              set.deviceName,
              Number.isFinite(Number(set.setNumber)) ? Number(set.setNumber) : 0,
              Number.isFinite(Number(set.weight)) ? Number(set.weight) : 0,
              Number.isFinite(Number(set.reps)) ? Number(set.reps) : 0,
              set.restTimeSeconds != null && Number.isFinite(Number(set.restTimeSeconds))
                ? Number(set.restTimeSeconds)
                : null,
            ]
          );
        }

        for (const rawDevice of sessionDevices) {
          const device = (rawDevice ?? {}) as Record<string, unknown>;
          if (typeof device.tagId !== 'string' || typeof device.deviceName !== 'string') continue;
          await db.runAsync(
            'INSERT INTO workout_session_devices (id, sessionId, tagId, deviceName, durationSeconds) VALUES (?, ?, ?, ?, ?)',
            [
              generateId(),
              sessionId,
              device.tagId,
              device.deviceName,
              Number.isFinite(Number(device.durationSeconds)) ? Number(device.durationSeconds) : 0,
            ]
          );
        }
      });

      sessionsImported += 1;
    }
  }

  let profileImported = false;
  const profileRaw = Array.isArray(parsed) ? null : (parsed as Record<string, unknown> | null)?.profile;
  if (profileRaw && typeof profileRaw === 'object') {
    const p = profileRaw as Record<string, unknown>;
    const weightKg = Number(p.weightKg);
    const heightCm = Number(p.heightCm);
    await saveUserProfile({
      firstName: typeof p.firstName === 'string' ? p.firstName : '',
      lastName: typeof p.lastName === 'string' ? p.lastName : '',
      gender: p.gender === 'male' || p.gender === 'female' || p.gender === 'other' ? p.gender : null,
      weightKg: p.weightKg != null && Number.isFinite(weightKg) ? weightKg : null,
      heightCm: p.heightCm != null && Number.isFinite(heightCm) ? heightCm : null,
      birthDate: typeof p.birthDate === 'string' ? p.birthDate : null,
    });
    profileImported = true;
  }

  const defaultsRaw = Array.isArray(parsed) ? null : (parsed as Record<string, unknown> | null)?.trainingDefaults;
  if (defaultsRaw && typeof defaultsRaw === 'object') {
    const d = defaultsRaw as Record<string, unknown>;
    const defaultReps = Number(d.defaultReps);
    const defaultRestSeconds = Number(d.defaultRestSeconds);
    await saveTrainingDefaults({
      defaultReps: d.defaultReps != null && Number.isFinite(defaultReps) ? defaultReps : null,
      defaultRestSeconds: d.defaultRestSeconds != null && Number.isFinite(defaultRestSeconds) ? defaultRestSeconds : null,
    });
  }

  return { devicesImported, sessionsImported, profileImported };
}

export interface DeviceDurationInput {
  tagId: string;
  durationSeconds: number;
}

export async function saveWorkoutSession(
  devices: Device[],
  totalDurationSeconds: number,
  deviceDurations: DeviceDurationInput[],
  completedAtOverride?: string
): Promise<void> {
  if (devices.length === 0) return;

  const db = await getDb();
  const sessionId = generateId();
  const completedAt = completedAtOverride ?? new Date().toISOString();
  const durationByTagId = new Map(deviceDurations.map((d) => [d.tagId, d.durationSeconds]));

  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT INTO workout_sessions (id, completedAt, durationSeconds) VALUES (?, ?, ?)', [
      sessionId,
      completedAt,
      Math.max(0, Math.round(totalDurationSeconds)),
    ]);
    for (const device of devices) {
      await db.runAsync(
        'INSERT INTO workout_session_devices (id, sessionId, tagId, deviceName, durationSeconds) VALUES (?, ?, ?, ?, ?)',
        [generateId(), sessionId, device.tagId, device.deviceName, Math.max(0, Math.round(durationByTagId.get(device.tagId) ?? 0))]
      );
      for (const set of device.sets) {
        await db.runAsync(
          `INSERT INTO workout_session_sets
            (id, sessionId, tagId, deviceName, setNumber, weight, reps, restTimeSeconds)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateId(),
            sessionId,
            device.tagId,
            device.deviceName,
            set.setNumber,
            set.weight,
            set.reps,
            set.restTimeSeconds,
          ]
        );
      }
    }
  });
}

export async function getWorkoutSessions(): Promise<WorkoutSessionRecord[]> {
  const db = await getDb();
  const sessionRows = await db.getAllAsync<{ id: string; completedAt: string; durationSeconds: number }>(
    'SELECT id, completedAt, durationSeconds FROM workout_sessions ORDER BY completedAt DESC'
  );
  const setRows = await db.getAllAsync<{
    sessionId: string;
    tagId: string;
    deviceName: string;
    setNumber: number;
    weight: number;
    reps: number;
    restTimeSeconds: number | null;
  }>(
    'SELECT sessionId, tagId, deviceName, setNumber, weight, reps, restTimeSeconds FROM workout_session_sets ORDER BY setNumber ASC'
  );
  const deviceRows = await db.getAllAsync<{
    sessionId: string;
    tagId: string;
    deviceName: string;
    durationSeconds: number;
  }>('SELECT sessionId, tagId, deviceName, durationSeconds FROM workout_session_devices');

  return sessionRows.map((session) => ({
    id: session.id,
    completedAt: session.completedAt,
    durationSeconds: session.durationSeconds,
    sets: setRows
      .filter((s) => s.sessionId === session.id)
      .map((s) => ({
        tagId: s.tagId,
        deviceName: s.deviceName,
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        restTimeSeconds: s.restTimeSeconds,
      })),
    devices: deviceRows
      .filter((d) => d.sessionId === session.id)
      .map((d) => ({ tagId: d.tagId, deviceName: d.deviceName, durationSeconds: d.durationSeconds })),
  }));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    firstName: string;
    lastName: string;
    gender: string | null;
    weightKg: number | null;
    heightCm: number | null;
    birthDate: string | null;
  }>('SELECT firstName, lastName, gender, weightKg, heightCm, birthDate FROM user_profile WHERE id = ?', ['me']);
  if (!row) return null;

  return {
    firstName: row.firstName,
    lastName: row.lastName,
    gender: row.gender === 'male' || row.gender === 'female' || row.gender === 'other' ? row.gender : null,
    weightKg: row.weightKg,
    heightCm: row.heightCm,
    birthDate: row.birthDate,
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile (id, firstName, lastName, gender, weightKg, heightCm, birthDate)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'me',
      profile.firstName,
      profile.lastName,
      profile.gender,
      profile.weightKg,
      profile.heightCm,
      profile.birthDate,
    ]
  );
}

export interface WorkoutInProgress {
  startedAt: number;
  lastActivityAt: number;
  completedTagIds: string[];
  deviceDurations: Record<string, number>;
}

export async function saveWorkoutInProgress(state: WorkoutInProgress): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO workout_in_progress
      (id, startedAt, lastActivityAt, completedTagIdsJson, deviceDurationsJson)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'current',
      state.startedAt,
      state.lastActivityAt,
      JSON.stringify(state.completedTagIds),
      JSON.stringify(state.deviceDurations),
    ]
  );
}

export async function getWorkoutInProgress(): Promise<WorkoutInProgress | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    startedAt: number;
    lastActivityAt: number;
    completedTagIdsJson: string;
    deviceDurationsJson: string;
  }>('SELECT startedAt, lastActivityAt, completedTagIdsJson, deviceDurationsJson FROM workout_in_progress WHERE id = ?', [
    'current',
  ]);
  if (!row) return null;

  try {
    return {
      startedAt: row.startedAt,
      lastActivityAt: row.lastActivityAt,
      completedTagIds: JSON.parse(row.completedTagIdsJson),
      deviceDurations: JSON.parse(row.deviceDurationsJson),
    };
  } catch {
    return null;
  }
}

export async function clearWorkoutInProgress(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workout_in_progress WHERE id = ?', ['current']);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
}

const DEFAULT_REPS_KEY = 'defaultReps';
const DEFAULT_REST_SECONDS_KEY = 'defaultRestSeconds';

export interface TrainingDefaults {
  defaultReps: number | null;
  defaultRestSeconds: number | null;
}

export async function getTrainingDefaults(): Promise<TrainingDefaults> {
  const [repsValue, restValue] = await Promise.all([getSetting(DEFAULT_REPS_KEY), getSetting(DEFAULT_REST_SECONDS_KEY)]);
  const defaultReps = repsValue != null ? parseInt(repsValue, 10) : null;
  const defaultRestSeconds = restValue != null ? parseInt(restValue, 10) : null;
  return {
    defaultReps: Number.isFinite(defaultReps) ? defaultReps : null,
    defaultRestSeconds: Number.isFinite(defaultRestSeconds) ? defaultRestSeconds : null,
  };
}

export async function saveTrainingDefaults(defaults: TrainingDefaults): Promise<void> {
  await Promise.all([
    saveSetting(DEFAULT_REPS_KEY, defaults.defaultReps != null ? String(defaults.defaultReps) : ''),
    saveSetting(DEFAULT_REST_SECONDS_KEY, defaults.defaultRestSeconds != null ? String(defaults.defaultRestSeconds) : ''),
  ]);
}

export async function deleteDevice(tagId: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM sets WHERE tagId = ?', [tagId]);
    await db.runAsync('DELETE FROM devices WHERE tagId = ?', [tagId]);
  });
}

export type { SetEntry };
