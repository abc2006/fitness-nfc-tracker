import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
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
import { exportAppDataJson, getTrainingDefaults, getUserProfile, importAppDataJson, saveTrainingDefaults, saveUserProfile } from '../db/database';
import { ThemeMode, useTheme } from '../theme/ThemeContext';
import { Gender, RootStackParamList } from '../types';
import { isoDateToDisplay, parseBirthDateInput } from '../utils/date';
import { showErrorAlert } from '../utils/errorAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Männlich' },
  { value: 'female', label: 'Weiblich' },
  { value: 'other', label: 'Divers' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen({ navigation }: Props) {
  const { colors, mode, setMode } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [birthDateIso, setBirthDateIso] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [defaultReps, setDefaultReps] = useState('');
  const [defaultRestSeconds, setDefaultRestSeconds] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSettings = () => {
    getUserProfile()
      .then((profile) => {
        if (!profile) return;
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setGender(profile.gender);
        setWeightKg(profile.weightKg != null ? String(profile.weightKg) : '');
        setHeightCm(profile.heightCm != null ? String(profile.heightCm) : '');
        setBirthDateIso(profile.birthDate);
        setBirthDateInput(isoDateToDisplay(profile.birthDate));
      })
      .catch((error) => console.warn('Failed to load profile', error));

    getTrainingDefaults()
      .then((defaults) => {
        setDefaultReps(defaults.defaultReps != null ? String(defaults.defaultReps) : '');
        setDefaultRestSeconds(defaults.defaultRestSeconds != null ? String(defaults.defaultRestSeconds) : '');
      })
      .catch((error) => console.warn('Failed to load training defaults', error));
  };

  useEffect(loadSettings, []);

  const exportToFileSystem = async (json: string) => {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return;

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      `fitness-nfc-tracker-export-${Date.now()}`,
      'application/json'
    );
    await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    Alert.alert('Export gespeichert', 'Die Datei wurde im gewählten Ordner abgelegt.');
  };

  const exportViaShareSheet = async (json: string) => {
    const fileUri = `${FileSystem.cacheDirectory}fitness-nfc-tracker-export-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Konfiguration exportieren',
      });
    } else {
      Alert.alert('Export erstellt', `Datei gespeichert unter:\n${fileUri}`);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportAppDataJson();

      if (Platform.OS === 'android') {
        Alert.alert('Export', 'Wie möchtest du die Datei sichern?', [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Teilen', onPress: () => exportViaShareSheet(json) },
          { text: 'Im Dateisystem speichern', onPress: () => exportToFileSystem(json) },
        ]);
      } else {
        await exportViaShareSheet(json);
      }
    } catch (error) {
      console.warn('Export failed', error);
      showErrorAlert('Fehler beim Export', String(error));
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const summary = await importAppDataJson(content);
      loadSettings();
      Alert.alert(
        'Import abgeschlossen',
        `${summary.devicesImported} Gerät(e) und ${summary.sessionsImported} Trainingseinheit(en) importiert` +
          (summary.profileImported ? ', inklusive Profil und Standardwerten.' : '.')
      );
    } catch (error) {
      console.warn('Import failed', error);
      showErrorAlert('Fehler beim Import', String(error));
    }
  };

  const handleBirthDateChange = (value: string) => {
    const result = parseBirthDateInput(value);
    setBirthDateInput(result.displayValue);
    setBirthDateIso(result.isoValue);
    setBirthDateError(result.error);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const weight = parseFloat(weightKg.replace(',', '.'));
      const height = parseFloat(heightCm.replace(',', '.'));
      const reps = parseInt(defaultReps, 10);
      const rest = parseInt(defaultRestSeconds, 10);
      await saveUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        weightKg: Number.isFinite(weight) && weightKg.trim() !== '' ? weight : null,
        heightCm: Number.isFinite(height) && heightCm.trim() !== '' ? height : null,
        birthDate: birthDateIso,
      });
      await saveTrainingDefaults({
        defaultReps: Number.isFinite(reps) && defaultReps.trim() !== '' ? reps : null,
        defaultRestSeconds: Number.isFinite(rest) && defaultRestSeconds.trim() !== '' ? rest : null,
      });

      const readBack = await getUserProfile();
      console.warn('Profile immediately after save:', JSON.stringify(readBack));
      if (!readBack || readBack.firstName !== firstName.trim()) {
        showErrorAlert(
          'Speichern fehlgeschlagen (still)',
          `Kein Fehler geworfen, aber Rücklesen ergab: ${JSON.stringify(readBack)}`
        );
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.warn('Failed to save profile', error);
      showErrorAlert('Fehler beim Speichern', String(error));
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: 20,
      paddingBottom: 60,
    },
    field: {
      marginBottom: 20,
      gap: 8,
    },
    flexField: {
      flex: 1,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
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
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
    },
    optionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    option: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    optionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    optionText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    optionTextActive: {
      color: colors.primary,
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
    testButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    testButtonPressed: {
      backgroundColor: colors.surfaceAlt,
      opacity: 0.7,
    },
    testButtonText: {
      color: colors.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Darstellung</Text>
          <View style={styles.optionRow}>
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, mode === option.value && styles.optionActive]}
                onPress={() => setMode(option.value)}
              >
                <Text style={[styles.optionText, mode === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Konfiguration & Verlauf</Text>
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [styles.testButton, styles.flexField, pressed && styles.testButtonPressed]}
              onPress={handleImport}
            >
              <Text style={styles.testButtonText}>Import</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.testButton, styles.flexField, pressed && styles.testButtonPressed]}
              onPress={handleExport}
            >
              <Text style={styles.testButtonText}>Export</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Vorname</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Max"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nachname</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Mustermann"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Geschlecht</Text>
          <View style={styles.optionRow}>
            {GENDER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, gender === option.value && styles.optionActive]}
                onPress={() => setGender(option.value)}
              >
                <Text style={[styles.optionText, gender === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.flexField]}>
            <Text style={styles.label}>Gewicht (kg)</Text>
            <TextInput
              style={styles.input}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="75"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.field, styles.flexField]}>
            <Text style={styles.label}>Größe (cm)</Text>
            <TextInput
              style={styles.input}
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="180"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.flexField]}>
            <Text style={styles.label}>Standard-Wdh.</Text>
            <TextInput
              style={styles.input}
              value={defaultReps}
              onChangeText={setDefaultReps}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.field, styles.flexField]}>
            <Text style={styles.label}>Standard-Pause (Sek.)</Text>
            <TextInput
              style={styles.input}
              value={defaultRestSeconds}
              onChangeText={setDefaultRestSeconds}
              placeholder="90"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Geburtsdatum</Text>
          <TextInput
            style={[styles.input, birthDateError && styles.inputError]}
            value={birthDateInput}
            onChangeText={handleBirthDateChange}
            placeholder="TT.MM.JJJJ"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
          />
          {birthDateError && <Text style={styles.errorText}>{birthDateError}</Text>}
        </View>

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
