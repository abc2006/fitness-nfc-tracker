import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EditableRestRow } from '../components/EditableRestRow';
import { EditableSetRow } from '../components/EditableSetRow';
import { saveDevice } from '../db/database';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { generateId } from '../utils/uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

interface DraftSet {
  weight: string;
  reps: string;
}

export default function CaptureScreen({ route, navigation }: Props) {
  const { tagId } = route.params;
  const [deviceName, setDeviceName] = useState('');
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState<DraftSet[]>([{ weight: '', reps: '' }]);
  const [rests, setRests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addNextSet = () => {
    setRests((prev) => [...prev, '']);
    setSets((prev) => [...prev, { weight: '', reps: '' }]);
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const updateRest = (index: number, value: string) => {
    setRests((prev) => prev.map((r, i) => (i === index ? value : r)));
  };

  const handleSave = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Gerätename fehlt', 'Bitte gib einen Namen für das Gerät ein.');
      return;
    }

    const parsedSets = sets.map((s, index) => {
      const weight = parseFloat(s.weight.replace(',', '.'));
      const reps = parseInt(s.reps, 10);
      return {
        id: generateId(),
        setNumber: index + 1,
        weight: Number.isFinite(weight) ? weight : 0,
        reps: Number.isFinite(reps) ? reps : 0,
        restTimeSeconds:
          index < rests.length && rests[index].trim() !== '' ? parseInt(rests[index], 10) || null : null,
      };
    });

    const invalidSet = sets.find((s) => s.weight.trim() === '' || s.reps.trim() === '');
    if (invalidSet) {
      Alert.alert('Unvollständige Sätze', 'Bitte fülle Gewicht und Wiederholungen für jeden Satz aus.');
      return;
    }

    setSaving(true);
    try {
      await saveDevice({
        tagId,
        deviceName: deviceName.trim(),
        notes: notes.trim(),
        sets: parsedSets,
      });
      navigation.goBack();
    } catch (error) {
      console.warn('Failed to save device', error);
      Alert.alert('Fehler', 'Das Gerät konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Neues Gerät</Text>
        <Text style={styles.tagId}>Tag-ID: {tagId}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Gerätename</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="z. B. Beinpresse"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notizen</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Sitzposition, Hebelanstellung, ..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        <Text style={styles.sectionTitle}>Sätze</Text>
        {sets.map((set, index) => (
          <React.Fragment key={index}>
            <EditableSetRow
              setNumber={index + 1}
              weight={set.weight}
              reps={set.reps}
              onChangeWeight={(v) => updateSet(index, 'weight', v)}
              onChangeReps={(v) => updateSet(index, 'reps', v)}
              showAddButton={index === sets.length - 1}
              onAdd={addNextSet}
            />
            {index < rests.length && (
              <EditableRestRow restTimeSeconds={rests[index]} onChange={(v) => updateRest(index, v)} />
            )}
          </React.Fragment>
        ))}

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Speichert...' : 'Speichern'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  tagId: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#04140D',
    fontWeight: '700',
    fontSize: 17,
  },
});
