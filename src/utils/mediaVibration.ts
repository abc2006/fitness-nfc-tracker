import { NativeModules, Platform, Vibration } from 'react-native';

interface MediaVibrationNativeModule {
  vibrate(durationMs: number): void;
}

const nativeModule = NativeModules.MediaVibration as MediaVibrationNativeModule | undefined;

export function vibrateMedia(durationMs: number): void {
  if (Platform.OS === 'android' && nativeModule?.vibrate) {
    try {
      nativeModule.vibrate(durationMs);
      return;
    } catch (error) {
      console.warn('MediaVibration native call failed, falling back to Vibration API', error);
    }
  }
  Vibration.vibrate(durationMs);
}
