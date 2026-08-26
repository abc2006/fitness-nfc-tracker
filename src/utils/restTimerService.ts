import { NativeModules, Platform } from 'react-native';

export interface RestTimerServiceDiagnostics {
  sdkInt: number;
  manufacturer: string;
  model: string;
  hasEnteredOnStartCommand: boolean;
  channelCreated: boolean;
  notificationBuilt: boolean;
  usedFallbackIcon: boolean;
  isForegroundActive: boolean;
  lastError: string | null;
}

export interface RestTimerTickInfo {
  lastTickAtMillis: number;
  nowMillis: number;
  lastTickSecondsLeft: number;
  tickCount: number;
}

interface RestTimerServiceNativeModule {
  start(durationSeconds: number): Promise<void>;
  stop(): Promise<void>;
  getDiagnostics(): Promise<RestTimerServiceDiagnostics>;
  recordTick(secondsLeft: number): void;
  getTickInfo(): Promise<RestTimerTickInfo>;
  resetTickInfo(): void;
}

const nativeModule = NativeModules.RestTimerService as RestTimerServiceNativeModule | undefined;

export function isRestTimerServiceLinked(): boolean {
  return !!nativeModule;
}

/**
 * durationSeconds drives the countdown running natively inside the Android
 * foreground service — that's what actually fires the vibration/sound on time,
 * since JS timers get throttled within seconds of the app going to background.
 */
export async function startRestTimerService(durationSeconds: number): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!nativeModule) {
    throw new Error('RestTimerService native module is not linked');
  }
  await nativeModule.start(durationSeconds);
}

export function stopRestTimerService(): void {
  if (Platform.OS !== 'android') return;
  nativeModule?.stop().catch((error) => console.warn('Failed to stop rest timer foreground service', error));
}

export async function getRestTimerServiceDiagnostics(): Promise<RestTimerServiceDiagnostics | null> {
  if (Platform.OS !== 'android' || !nativeModule) return null;
  return nativeModule.getDiagnostics();
}

export function recordTimerTick(secondsLeft: number): void {
  if (Platform.OS !== 'android') return;
  nativeModule?.recordTick(secondsLeft);
}

export async function getRestTimerTickInfo(): Promise<RestTimerTickInfo | null> {
  if (Platform.OS !== 'android' || !nativeModule) return null;
  return nativeModule.getTickInfo();
}

export function resetRestTimerTickInfo(): void {
  if (Platform.OS !== 'android') return;
  nativeModule?.resetTickInfo();
}
