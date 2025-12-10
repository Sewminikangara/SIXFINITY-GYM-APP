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
    TrainerDetailScreen,
    EditProfileScreen,
    ProgressStatsScreen,
    BodyStatsScreen,
    FitnessGoalsScreen,
    AchievementsScreen,
    WearableDevicesScreen,
    WalletScreen,
    TransactionHistoryScreen,
    PaymentMethodsScreen,
    AddPaymentMethodScreen,
    PaymentCheckoutScreen,
    PaymentSuccessScreen,
    PaymentFailedScreen,
    InvoiceViewerScreen,
    BookingsScreen,
    ReferralsScreen,
    RewardsScreen,
    OffersScreen,
    NotificationsScreen,
    NotificationSettingsScreen,
    SettingsScreen,
    HelpSupportScreen,
} from '@/screens/app';
import { AddMealScreen } from '@/screens/app/meals/AddMealScreen';
import { MealAnalysisScreen } from '@/screens/app/meals/MealAnalysisScreen';
import { CameraScreen } from '@/screens/app/meals/CameraScreen';
import { ActiveWorkoutScreen } from '@/screens/app/train/ActiveWorkoutScreen';
import { BookSessionScreen } from '@/screens/app/train/BookSessionScreen';
import { MyBookingsScreen } from '@/screens/app/train/MyBookingsScreen';
import { RescheduleSessionScreen } from '@/screens/app/train/RescheduleSessionScreen';
import { TrainerMessageScreen } from '@/screens/app/train/TrainerMessageScreen';
import { SubmitReviewScreen } from '@/screens/app/train/SubmitReviewScreen';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
    return (
        <Stack.Navigator
            id="AppStack"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Tabs" component={AppTabsNavigator} options={{ headerShown: false }} />

            <Stack.Screen name="GymFinder" component={GymFinderScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="GymMap" component={GymMapScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="GymDetail" component={GymDetailScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Gym Details' }} />
            <Stack.Screen name="MyGyms" component={MyGymsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'My Gyms' }} />
            <Stack.Screen name="LiveStatus" component={LiveStatusScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Live Status' }} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Check In' }} />

            <Stack.Screen name="Trainers" component={TrainersScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Trainers' }} />
            <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="TrainerMessage" component={TrainerMessageScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="SubmitReview" component={SubmitReviewScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="BookSession" component={BookSessionScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="RescheduleSession" component={RescheduleSessionScreen} options={{ presentation: 'card', headerShown: false }} />

            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Edit Profile' }} />
            <Stack.Screen name="ProgressStats" component={ProgressStatsScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="BodyStats" component={BodyStatsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Body Stats' }} />
            <Stack.Screen name="FitnessGoals" component={FitnessGoalsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Fitness Goals' }} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Achievements' }} />
            <Stack.Screen name="WearableDevices" component={WearableDevicesScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Wearable Devices' }} />

            <Stack.Screen name="Wallet" component={WalletScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Wallet' }} />
            <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Transaction History' }} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Payment Methods' }} />
            <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} options={{ presentation: 'modal', headerShown: true, headerTitle: 'Add Payment Method' }} />
            <Stack.Screen name="PaymentCheckout" component={PaymentCheckoutScreen} options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="PaymentFailed" component={PaymentFailedScreen} options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="InvoiceViewer" component={InvoiceViewerScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Invoice' }} />

            <Stack.Screen name="Bookings" component={BookingsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'My Bookings' }} />
            <Stack.Screen name="Referrals" component={ReferralsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Refer & Earn' }} />
            <Stack.Screen name="Rewards" component={RewardsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Rewards' }} />
            <Stack.Screen name="Offers" component={OffersScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Offers' }} />

            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Notifications' }} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Notification Settings' }} />

            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Settings' }} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ presentation: 'card', headerShown: true, headerTitle: 'Help & Support' }} />

            <Stack.Screen name="AddMeal" component={AddMealScreen} options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="MealAnalysis" component={MealAnalysisScreen} options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="Camera" component={CameraScreen} options={{ presentation: 'fullScreenModal', headerShown: false }} />
        </Stack.Navigator>
    );
};
