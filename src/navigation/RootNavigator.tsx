import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { darkNavigationTheme, lightNavigationTheme } from './theme';
import { RootStackParamList } from './types';
import { LoadingScreen } from '@/screens/auth';
import { SplashScreen } from '@/screens/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { status } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const theme = isDark ? darkNavigationTheme : lightNavigationTheme;

  useEffect(() => {
    // Show splash for first app load
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
        {showSplash || status === 'loading' ? (
          <>
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : status === 'signedOut' ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : status === 'onboarding' ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="App"
            component={AppNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
