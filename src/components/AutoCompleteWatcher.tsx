import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { checkAndAutoCompleteStaleWorkout } from '../utils/autoComplete';

export function AutoCompleteWatcher() {
  const { finalize } = useWorkoutSession();

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkAndAutoCompleteStaleWorkout();
        if (result) {
          finalize();
          Alert.alert('Training automatisch abgeschlossen', `${result.calories} Kalorien verbraucht`);
        }
      } catch (error) {
        console.warn('Failed to check for stale workout', error);
      }
    };

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [finalize]);

  return null;
}
