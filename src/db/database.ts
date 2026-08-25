import * as SQLite from 'expo-sqlite';
import { Device, SetEntry } from '../types';

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
      notes TEXT NOT NULL DEFAULT ''
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
  `);
}

export async function getAllDevices(): Promise<Device[]> {
  const db = await getDb();
  const deviceRows = await db.getAllAsync<{ tagId: string; deviceName: string; notes: string }>(
    'SELECT tagId, deviceName, notes FROM devices ORDER BY rowid DESC'
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
  const deviceRow = await db.getFirstAsync<{ tagId: string; deviceName: string; notes: string }>(
    'SELECT tagId, deviceName, notes FROM devices WHERE tagId = ?',
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
      'INSERT OR REPLACE INTO devices (tagId, deviceName, notes) VALUES (?, ?, ?)',
      [device.tagId, device.deviceName, device.notes]
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

export async function deleteDevice(tagId: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM sets WHERE tagId = ?', [tagId]);
    await db.runAsync('DELETE FROM devices WHERE tagId = ?', [tagId]);
  });
}

export type { SetEntry };
