import { Alert, Share } from 'react-native';

export function showErrorAlert(title: string, message: string): void {
  Alert.alert(title, message, [
    {
      text: 'Teilen',
      onPress: () => {
        Share.share({ message: `${title}\n\n${message}` }).catch(() => {});
      },
    },
    { text: 'OK' },
  ]);
}
