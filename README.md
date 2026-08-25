# Fitness NFC Tracker

Digitaler Trainingsbegleiter: NFC-Tag scannen, Gerät erkennen, Sätze/Pausen tracken – mit Piepton- und Vibrations-Feedback beim Pausen-Countdown.

## Stack

- Expo SDK 57 (React Native 0.86, React 19), TypeScript
- `react-native-nfc-manager` für NFC-Scanning (Config Plugin)
- `expo-sqlite` (async API) für lokale Persistenz
- `expo-audio` für den Piepton, `expo-haptics` für Vibration
- `@react-navigation/native` (native-stack) für die Screens

## Wichtig: NFC funktioniert nicht in Expo Go

`react-native-nfc-manager` ist ein natives Modul und läuft **nicht** in der Expo-Go-App. Du brauchst einen Custom Dev Client:

```bash
npm install
npx expo prebuild
npx expo run:android   # oder: npx expo run:ios (nur auf macOS)
```

Für spätere Läufe genügt danach `npx expo start --dev-client`.

## Projektstruktur

```
App.tsx                     Einstiegspunkt, DB-Init, Navigation
src/
  types/                    Device- und Set-Modelle
  db/database.ts            expo-sqlite Schema + CRUD
  hooks/useNfc.ts            NFC-Lifecycle (start/stop, Tag-Events)
  navigation/AppNavigator.tsx  Stack: Home / Capture / Training
  screens/
    HomeScreen.tsx           Dauerhafter Scan-Modus + Geräteliste
    CaptureScreen.tsx        Neuer Tag: Gerätename, Notizen, dynamische Sätze
    TrainingScreen.tsx       Bekannter Tag: Sätze abhaken, Pausentimer
  components/
    NfcStatusBadge.tsx        Pulsierendes NFC-Icon + Statustext
    DeviceListItem.tsx
    EditableSetRow.tsx / EditableRestRow.tsx   Capture-Modus
    TrainingSetRow.tsx / RestTimer.tsx          Trainings-Modus
  theme/colors.ts            Dunkles Farbschema
  utils/uuid.ts
assets/sounds/beep.wav       Generierter Piepton fürs Pausen-Ende
```

## Funktionsweise

- **Home**: `useFocusEffect` registriert den NFC-Listener beim Fokussieren und deregistriert ihn beim Verlassen – kein manueller Scan-Button nötig.
- **Neuer Tag**: Start mit genau einem Satz (Gewicht/Wdh./OK). "OK" auf dem letzten Satz fügt eine Pausenzeit-Zeile plus den nächsten Satz hinzu.
- **Bekannter Tag**: Jeder Satz wird per OK bestätigt. Ist eine Pause hinterlegt, läuft ein Countdown; in den letzten 3 Sekunden ertönt ein Piepton mit Vibration. Ohne Pause (letzter Satz) geht es direkt zurück zum Home Screen, der sofort wieder scannt.
- **Hardware-Fallbacks**: `useNfc` erkennt fehlende NFC-Unterstützung sowie deaktiviertes NFC und zeigt entsprechende Hinweise im `NfcStatusBadge`.

## Bekannte Einschränkung

`expo-doctor` meldet, dass `react-native-nfc-manager` noch nicht offiziell für die React-Native-New-Architecture getestet ist. Die App läuft in der Standardkonfiguration von SDK 57 (New Architecture aktiv) problemlos; solltest du Probleme mit dem NFC-Modul bekommen, ist das der erste Ansatzpunkt.
