import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NfcStatusBadge } from '../components/NfcStatusBadge';
import { DeviceListItem } from '../components/DeviceListItem';
import { getAllDevices, getDeviceByTagId } from '../db/database';
import { useNfc } from '../hooks/useNfc';
import { colors } from '../theme/colors';
import { Device, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [devices, setDevices] = useState<Device[]>([]);
  const isNavigatingRef = useRef(false);

  const handleTagDiscovered = useCallback(
    async (tagId: string) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      try {
        const existing = await getDeviceByTagId(tagId);
        if (existing) {
          navigation.navigate('Training', { tagId });
        } else {
          navigation.navigate('Capture', { tagId });
        }
      } catch (error) {
        console.warn('Failed to resolve scanned tag', error);
        isNavigatingRef.current = false;
      }
    },
    [navigation]
  );

  const { status, startScan, stopScan } = useNfc(handleTagDiscovered);

  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
      startScan();
      getAllDevices().then(setDevices).catch(console.warn);

      return () => {
        stopScan();
      };
    }, [startScan, stopScan])
  );

  return (
    <View style={styles.container}>
      <NfcStatusBadge status={status} />
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Gespeicherte Geräte</Text>
      </View>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.tagId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <DeviceListItem device={item} onPress={() => navigation.navigate('Training', { tagId: item.tagId })} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Noch keine Geräte gespeichert. Scanne einen NFC-Tag, um zu starten.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
