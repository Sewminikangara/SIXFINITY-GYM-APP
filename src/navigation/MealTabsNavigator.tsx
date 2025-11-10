import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { palette, typography } from '@/theme';
import { TodayScreen } from '@/screens/app/meals/TodayScreen';
import { PlansScreen } from '@/screens/app/meals/PlansScreen';
import { InsightsScreen } from '@/screens/app/meals/InsightsScreen';

const Tab = createMaterialTopTabNavigator();

export const MealTabsNavigator = () => {
    return (
        <Tab.Navigator
            id={undefined}
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: palette.background,
                    borderBottomWidth: 1,
                    borderBottomColor: '#2A2A2A',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    ...typography.caption,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    fontSize: 13,
                },
                tabBarIndicatorStyle: {
                    backgroundColor: palette.neonGreen,
                    height: 3,
                },
                tabBarActiveTintColor: palette.neonGreen,
                tabBarInactiveTintColor: '#666',
                tabBarPressColor: 'rgba(159, 211, 86, 0.1)',
            }}
        >
            <Tab.Screen
                name="Today"
                component={TodayScreen}
                options={{ title: 'TODAY' }}
            />
            <Tab.Screen
                name="Plans"
                component={PlansScreen}
                options={{ title: 'PLANS' }}
            />
            <Tab.Screen
                name="Insights"
                component={InsightsScreen}
                options={{ title: 'INSIGHTS' }}
            />
        </Tab.Navigator>
    );
};