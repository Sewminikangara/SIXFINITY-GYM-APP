import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { palette, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { GymFinderScreen } from '@/screens/app/gyms/GymFinderScreen';
import { MyGymsScreen } from '@/screens/app/gyms/MyGymsScreen';
import { LiveStatusScreen } from '@/screens/app/gyms/LiveStatusScreen';

const Tab = createMaterialTopTabNavigator();

export const GymTabsNavigator = () => {
    return (
        <Tab.Navigator
            id="GymTabs"
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: palette.background,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: palette.neonGreen,
                tabBarInactiveTintColor: palette.textSecondary,
                tabBarLabelStyle: {
                    ...typography.bodyBold,
                    fontSize: 14,
                    fontWeight: '700',
                    textTransform: 'none',
                },
                tabBarIndicatorStyle: {
                    backgroundColor: palette.neonGreen,
                    height: 3,
                    borderRadius: 2,
                },
                tabBarPressColor: 'rgba(0, 255, 127, 0.1)',
                swipeEnabled: true,
                lazy: true,
                lazyPreloadDistance: 1,
            }}
        >
            <Tab.Screen
                name="FindGyms"
                component={GymFinderScreen}
                options={{
                    tabBarLabel: 'Find Gyms',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'search' : 'search-outline'}
                            size={20}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="MyGyms"
                component={MyGymsScreen}
                options={{
                    tabBarLabel: 'My Gyms',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'heart' : 'heart-outline'}
                            size={20}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="LiveStatus"
                component={LiveStatusScreen}
                options={{
                    tabBarLabel: 'Live Status',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'pulse' : 'pulse-outline'}
                            size={20}
                            color={color}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};
