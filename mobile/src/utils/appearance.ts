import {Appearance, TurboModuleRegistry} from 'react-native';

/**
 * Safely gets the current color scheme with fallback
 * Handles TurboModule initialization timing issues in New Architecture
 */
export function safeGetColorScheme(): 'light' | 'dark' {
  try {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    // TurboModule not ready yet - fallback to light mode
    console.warn('Appearance.getColorScheme() failed, using light mode fallback', error);
    return 'light';
  }
}

/**
 * Safely adds an Appearance change listener with error handling
 * Returns null if TurboModule is not ready
 */
export function safeAddAppearanceListener(
  callback: (colorScheme: 'light' | 'dark') => void
): ReturnType<typeof Appearance.addChangeListener> | null {
  try {
    return Appearance.addChangeListener(({colorScheme}) => {
      callback(colorScheme === 'dark' ? 'dark' : 'light');
    });
  } catch (error) {
    console.warn('Appearance.addChangeListener() failed, TurboModule not ready', error);
    return null;
  }
}

/**
 * Waits for AppState TurboModule to be ready before getting color scheme
 * Checks TurboModule existence first to avoid "runtime not ready" errors
 */
export async function waitForColorScheme(
  maxAttempts: number = 20,
  initialDelay: number = 50
): Promise<'light' | 'dark'> {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    try {
      // Check if AppState TurboModule (which Appearance depends on) is ready
      const appStateModule = TurboModuleRegistry.get('AppState');

      if (appStateModule) {
        // TurboModule exists, safe to call Appearance API
        const colorScheme = Appearance.getColorScheme();
        return colorScheme === 'dark' ? 'dark' : 'light';
      }
    } catch (error) {
      // TurboModule not ready, continue waiting
    }

    attempts++;
    if (attempts >= maxAttempts) {
      console.warn(
        `AppState TurboModule not ready after ${maxAttempts} attempts, using light mode fallback`
      );
      return 'light';
    }

    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 500); // Max 500ms
  }

  return 'light';
}
