import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabsNavigator } from './AppTabsNavigator';
import {
    GymFinderScreen,
    GymMapScreen,
    GymDetailScreen,
    MyGymsScreen,
    LiveStatusScreen,
    CheckInScreen,
    TrainersScreen,
    TrainerDetailScreen
} from '@/screens/app';
import { AddMealScreen } from '@/screens/app/meals/AddMealScreen';
import { MealAnalysisScreen } from '@/screens/app/meals/MealAnalysisScreen';
import { CameraScreen } from '@/screens/app/meals/CameraScreen';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
    return (
        <Stack.Navigator
            id={undefined}
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Tabs" component={AppTabsNavigator} />
            <Stack.Screen
                name="GymFinder"
                component={GymFinderScreen}
                options={{
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="GymMap"
                component={GymMapScreen}
                options={{
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="GymDetail"
                component={GymDetailScreen}
                options={{
                    presentation: 'card',
                    headerShown: true,
                    headerTitle: 'Gym Details',
                }}
            />
            <Stack.Screen
                name="MyGyms"
                component={MyGymsScreen}
                options={{
                    presentation: 'card',
                    headerShown: true,
                    headerTitle: 'My Gyms',
                }}
            />
            <Stack.Screen
                name="LiveStatus"
                component={LiveStatusScreen}
                options={{
                    presentation: 'card',
                    headerShown: true,
                    headerTitle: 'Live Status',
                }}
            />
            <Stack.Screen
                name="CheckIn"
                component={CheckInScreen}
                options={{
                    presentation: 'card',
                    headerShown: true,
                    headerTitle: 'Check In',
                }}
            />
            <Stack.Screen
                name="Trainers"
                component={TrainersScreen}
                options={{
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="TrainerDetail"
                component={TrainerDetailScreen}
                options={{
                    presentation: 'card',
                }}
            />
            {/* Meal screens */}
            <Stack.Screen
                name="AddMeal"
                component={AddMealScreen}
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="MealAnalysis"
                component={MealAnalysisScreen}
                options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                }}
            />
        </Stack.Navigator>
    );
};
