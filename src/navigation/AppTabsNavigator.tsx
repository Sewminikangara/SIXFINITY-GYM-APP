import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Platform, StyleSheet } from 'react-native';

import { AppTabParamList } from './types';
import { MealTabsNavigator } from './MealTabsNavigator';
import {
  HomeScreen,
  GymsScreen,
  MoreScreen,
  WorkoutScreen,
} from '@/screens/app';
import { palette, radii, shadows } from '@/theme';

const Tab = createBottomTabNavigator<AppTabParamList>();

const tabIconMap: Record<keyof AppTabParamList, string> = {
  Home: 'home-variant',
  Gyms: 'dumbbell',
  Meals: 'food-apple',
  Workout: 'arm-flex',
  More: 'menu',
};

export const AppTabsNavigator = () => {
  const isDark = useColorScheme() === 'dark';

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: palette.neonGreen,
        tabBarInactiveTintColor: palette.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          backgroundColor: isDark ? palette.surface : '#1A1A1A',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          elevation: 0,
          ...shadows.lg,
        },
        tabBarItemStyle: styles.tabItem,
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: ({ color, size, focused }) => (
          <Icon
            name={tabIconMap[route.name as keyof AppTabParamList]}
            size={focused ? 28 : 24}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'HOME' }}
      />
      <Tab.Screen
        name="Gyms"
        component={GymsScreen}
        options={{ tabBarLabel: 'GYMS' }}
      />
      <Tab.Screen
        name="Meals"
        component={MealTabsNavigator}
        options={{ tabBarLabel: 'MEALS' }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ tabBarLabel: 'TRAIN' }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ tabBarLabel: 'MORE' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
