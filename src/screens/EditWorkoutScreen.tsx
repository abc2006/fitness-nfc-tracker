import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DeviceEditRow } from '../components/DeviceEditRow';
import { getAllDevices, getDeviceByTagId, setDeviceEnabled } from '../db/database';
import { useNfc } from '../hooks/useNfc';
import { useTheme } from '../theme/ThemeContext';
import { Device, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditWorkout'>;

export default function EditWorkoutScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [armed, setArmed] = useState(false);
  const armedRef = useRef(false);

  const refreshDevices = useCallback(() => {
    getAllDevices().then(setDevices).catch(console.warn);
  }, []);

  const handleTagDiscovered = useCallback(
    async (tagId: string) => {
      if (!armedRef.current) return;
      armedRef.current = false;
      setArmed(false);
      stopScan();

      try {
        const existing = await getDeviceByTagId(tagId);
        if (existing) {
          Alert.alert('Gerät ist bereits vorhanden', 'Möchtest du es bearbeiten?', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Ja', onPress: () => navigation.navigate('Capture', { tagId }) },
          ]);
        } else {
          navigation.navigate('Capture', { tagId });
        }
      } catch (error) {
        console.warn('Failed to resolve scanned tag', error);
      }
    },
    [navigation]
  );

  const { status, startScan, stopScan } = useNfc(handleTagDiscovered);

  const handleAddPress = () => {
    armedRef.current = true;
    setArmed(true);
    startScan();
  };

  useEffect(() => {
    if (armed && (status === 'unsupported' || status === 'disabled')) {
      armedRef.current = false;
      setArmed(false);
    }
  }, [armed, status]);

  useFocusEffect(
    useCallback(() => {
      refreshDevices();
      return () => {
        armedRef.current = false;
        setArmed(false);
        stopScan();
      };
    }, [refreshDevices, stopScan])
  );

  const handleToggleEnabled = async (tagId: string, enabled: boolean) => {
    setDevices((prev) => prev.map((d) => (d.tagId === tagId ? { ...d, enabled } : d)));
    try {
      await setDeviceEnabled(tagId, enabled);
    } catch (error) {
      console.warn('Failed to toggle device', error);
      refreshDevices();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    addButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 12,
    },
    addButtonArmed: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    addButtonPressed: {
      opacity: 0.85,
    },
    addButtonIcon: {
      color: '#04140D',
      fontSize: 20,
      fontWeight: '700',
    },
    addButtonText: {
      color: '#04140D',
      fontWeight: '700',
      fontSize: 16,
    },
    addButtonArmedText: {
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
    warningText: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12,
    },
    listTitle: {
      color: colors.textSecondary,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingBottom: 10,
    },
    listContent: {
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

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.addButton, armed && styles.addButtonArmed, pressed && styles.addButtonPressed]}
        onPress={handleAddPress}
        disabled={armed}
      >
        {armed ? (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.addButtonArmedText}>Halte ein Gerät an dein Smartphone...</Text>
          </>
        ) : (
          <>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Übung/Gerät hinzufügen</Text>
          </>
        )}
      </Pressable>

      {status === 'disabled' && <Text style={styles.warningText}>NFC ist deaktiviert.</Text>}
      {status === 'unsupported' && <Text style={styles.warningText}>Dieses Gerät unterstützt kein NFC.</Text>}

      <Text style={styles.listTitle}>Geräte</Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.tagId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <DeviceEditRow
            device={item}
            onPress={() => navigation.navigate('Capture', { tagId: item.tagId })}
            onToggleEnabled={(enabled) => handleToggleEnabled(item.tagId, enabled)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Noch keine Geräte gespeichert. Tippe oben auf „Hinzufügen“.</Text>
        }
      />
    </View>
  );
}
