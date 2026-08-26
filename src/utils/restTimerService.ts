import { NativeModules, Platform } from 'react-native';

interface RestTimerServiceNativeModule {
  start(durationSeconds: number): Promise<void>;
  stop(): Promise<void>;
}

const nativeModule = NativeModules.RestTimerService as RestTimerServiceNativeModule | undefined;

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
