import 'react-native-gesture-handler';

import { ReactElement, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { AuthProvider } from '@/context/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { palette } from '@/theme';
import { requestNotificationPermissions } from '@/services/notificationsService';

function App(): ReactElement {
  const isDarkMode = useColorScheme() === 'dark';

  const [fontsLoaded, fontError] = useFonts({
    'Neutiva-SemiBold': require('./assets/fonts/Neutiva-SemiBold.ttf'),
    'XenonNeue': require('./assets/fonts/XenonNue-Medium.ttf'),
  });

  // Request notification permissions on app startup
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Show loading screen while fonts are loading
  if (!fontsLoaded && !fontError) {
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={isDarkMode ? palette.background : '#FFFFFF'} />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loading: {
    flex: 1,
    backgroundColor: palette.background,
  },
});

export default App;
