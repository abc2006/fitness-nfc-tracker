import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import NfcManager, { NfcEvents, TagEvent } from 'react-native-nfc-manager';

export type NfcStatus = 'checking' | 'unsupported' | 'disabled' | 'scanning' | 'idle';

let managerStarted = false;

async function ensureNfcManagerStarted(): Promise<void> {
  if (!managerStarted) {
    await NfcManager.start();
    managerStarted = true;
  }
}

function extractTagId(tag: TagEvent): string | null {
  if (tag.id) return tag.id;
  if (Array.isArray((tag as any).ndefMessage) && (tag as any).ndefMessage.length > 0) {
    return JSON.stringify((tag as any).ndefMessage[0]);
  }
  return null;
}

export function useNfc(onTagDiscovered: (tagId: string) => void) {
  const [status, setStatus] = useState<NfcStatus>('checking');
  const callbackRef = useRef(onTagDiscovered);
  callbackRef.current = onTagDiscovered;

  const startScan = useCallback(async () => {
    try {
      await ensureNfcManagerStarted();

      const supported = await NfcManager.isSupported();
      if (!supported) {
        setStatus('unsupported');
        return;
      }

      const enabled = Platform.OS === 'android' ? await NfcManager.isEnabled() : true;
      if (!enabled) {
        setStatus('disabled');
        return;
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
        const tagId = extractTagId(tag);
        if (tagId) {
          callbackRef.current(tagId);
        }
      });

      await NfcManager.registerTagEvent();
      setStatus('scanning');
    } catch (error) {
      console.warn('NFC start scan failed', error);
      setStatus('idle');
    }
  }, []);

  const stopScan = useCallback(async () => {
    try {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      await NfcManager.unregisterTagEvent();
    } catch (error) {
      // Ignore errors when nothing was registered.
    } finally {
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  return { status, startScan, stopScan };
}
