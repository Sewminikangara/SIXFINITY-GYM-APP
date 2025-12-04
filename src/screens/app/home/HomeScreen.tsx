import { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    RefreshControl,
    Animated,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { AppTabParamList, AppStackParamList } from '@/navigation/types';
import { useHomeData } from '@/hooks/useHomeData';
import { completeWorkout } from '@/services/homeService';

const { width } = Dimensions.get('window');

type HomeScreenNavigation = CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList, 'Home'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigation>();
    const { user } = useAuth();
    const { loading, refreshing, data, refresh, pedometerAvailable } = useHomeData(user?.id || null);
    const [selectedMetric, setSelectedMetric] = useState<'weight' | 'steps' | 'calories'>('weight');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onRefresh = async () => {
        await refresh();
    };

    const handleStartWorkout = () => {
        Alert.alert(
            'Start Workout',
            'How long did you workout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: '30 min',
                    onPress: () => logWorkout(30),
                },
                {
                    text: '45 min',
                    onPress: () => logWorkout(45),
                },
                {
                    text: '60 min',
                    onPress: () => logWorkout(60),
                },
            ]
        );
    };

    const logWorkout = async (duration: number) => {
        if (!user) return;

        try {
            await completeWorkout(user.id, {
                name: 'General Workout',
                duration,
                caloriesBurned: Math.round(duration * 7), // Estimate: 7 calories per minute
            });

            Alert.alert('Success', `Workout completed! ${duration} minutes logged.`);
            await refresh(); // Refresh dashboard data
        } catch (error) {
            Alert.alert('Error', 'Failed to log workout');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.neonGreen}
                        colors={[palette.neonGreen]}
                    />
                }
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <View>
                        <Text style={styles.headerTitle}>Home Dashboard</Text>
                    </View>
                    <TouchableOpacity style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color={palette.textPrimary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Quick Action Buttons Row 1 */}
                <Animated.View style={[styles.quickActionsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('GymFinder')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>FIND GYM</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('Workout')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>BOOK TRAINER</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('AddMeal')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>LOG MEAL</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Quick Action Buttons Row 2 */}
                <Animated.View style={[styles.quickActionsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => handleStartWorkout()}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>START WORKOUT</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('BodyStats')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>PROGRESS</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('Meals')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>VIEW PLAN</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Today's Schedule Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>Today's Schedule</Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={palette.neonGreen} />
                        </View>
                    ) : data.schedule.gymBookings.length > 0 ||
                        data.schedule.trainerSessions.length > 0 ||
                        data.schedule.plannedWorkouts.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scheduleScroll}>
                            {data.schedule.gymBookings.map((booking) => (
                                <TouchableOpacity
                                    key={booking.id}
                                    style={styles.scheduleCard}
                                >
                                    <ImageBackground
                                        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop' }}
                                        style={styles.scheduleImage}
                                        imageStyle={styles.scheduleImageStyle}
                                    >
                                        <LinearGradient
                                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                            style={styles.scheduleOverlay}
                                        >
                                            <Text style={styles.scheduleTitle}>Gym Booking</Text>
                                            <Text style={styles.scheduleSubtitle}>
                                                {booking.gymName}{'\n'}
                                                {booking.timeSlot}{'\n'}
                                                {booking.gymAddress}
                                            </Text>
                                        </LinearGradient>
                                    </ImageBackground>
                                </TouchableOpacity>
                            ))}
                            {data.schedule.trainerSessions.map((session) => (
                                <TouchableOpacity
                                    key={session.id}
                                    style={styles.scheduleCard}
                                >
                                    <ImageBackground
                                        source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop' }}
                                        style={styles.scheduleImage}
                                        imageStyle={styles.scheduleImageStyle}
                                    >
                                        <LinearGradient
                                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                            style={styles.scheduleOverlay}
                                        >
                                            <Text style={styles.scheduleTitle}>Trainer Session</Text>
                                            <Text style={styles.scheduleSubtitle}>
                                                With {session.trainerName}{'\n'}
                                                {session.sessionType}{'\n'}
                                                {session.time}
                                            </Text>
                                        </LinearGradient>
                                    </ImageBackground>
                                </TouchableOpacity>
                            ))}
                            {data.schedule.plannedWorkouts.map((workout) => (
                                <TouchableOpacity
                                    key={workout.id}
                                    style={styles.scheduleCard}
                                    onPress={handleStartWorkout}
                                >
                                    <ImageBackground
                                        source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop' }}
                                        style={styles.scheduleImage}
                                        imageStyle={styles.scheduleImageStyle}
                                    >
                                        <LinearGradient
                                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                            style={styles.scheduleOverlay}
                                        >
                                            <Text style={styles.scheduleTitle}>Planned Workout</Text>
                                            <Text style={styles.scheduleSubtitle}>
                                                {workout.name}{'\n'}
                                                {workout.duration} minutes{'\n'}
                                                {workout.time}
                                            </Text>
                                        </LinearGradient>
                                    </ImageBackground>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <TouchableOpacity style={styles.scheduleCard} onPress={() => navigation.navigate('GymFinder')}>
                            <ImageBackground
                                source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop' }}
                                style={styles.scheduleImage}
                                imageStyle={styles.scheduleImageStyle}
                            >
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                    style={styles.scheduleOverlay}
                                >
                                    <Text style={styles.scheduleTitle}>No Schedule Today</Text>
                                    <Text style={styles.scheduleSubtitle}>
                                        Start your fitness journey!{'\n'}
                                        Book a gym or trainer session{'\n'}
                                        to get started.
                                    </Text>
                                    <TouchableOpacity style={styles.scheduleArrow}>
                                        <LinearGradient
                                            colors={[palette.neonGreen, palette.neonGreenDim]}
                                            style={styles.arrowCircle}
                                        >
                                            <Icon name="chevron-right" size={24} color={palette.background} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </ImageBackground>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Stats Cards Grid */}
                <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
                    {/* Steps Today */}
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            {pedometerAvailable && (
                                <View style={styles.liveIndicator}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.statArrow}>
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    style={styles.smallArrowCircle}
                                >
                                    <Icon name="chevron-right" size={16} color={palette.background} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.calorieBadge}>
                            <Text style={styles.calorieText}>{data.summary.steps.toLocaleString()}</Text>
                        </View>
                        <Text style={styles.statLabel}>Steps Today</Text>
                        <Text style={styles.statSubtext}>
                            {pedometerAvailable ? '🔄 Real-time tracking' : 'Goal: 10,000 steps'}
                            {'\n'}
                            {data.summary.steps >= 10000 ? '🎯 Goal reached!' : 'Keep moving!'}
                        </Text>
                    </View>

                    {/* Calories Burned */}
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <TouchableOpacity style={styles.statArrow}>
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    style={styles.smallArrowCircle}
                                >
                                    <Icon name="chevron-right" size={16} color={palette.background} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.calorieBadge}>
                            <Text style={styles.calorieText}>{data.summary.caloriesBurned} </Text>
                            <Text style={styles.calorieUnit}>kcal</Text>
                        </View>
                        <Text style={styles.statLabel}>Calories Burned</Text>
                        <Text style={styles.statSubtext}>
                            You're burning energy!{'\n'}
                            Great progress today
                        </Text>
                    </View>

                    {/* Workout Completed */}
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <TouchableOpacity style={styles.statArrow}>
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    style={styles.smallArrowCircle}
                                >
                                    <Icon name="chevron-right" size={16} color={palette.background} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.calorieBadge}>
                            <Text style={styles.calorieText}>{data.summary.workoutsCompleted}</Text>
                        </View>
                        <Text style={styles.statLabel}>Workout{'\n'}Completed</Text>
                        <Text style={styles.statSubtext}>
                            {data.summary.workoutsCompleted > 0 ? 'Great job today!' : 'Start your first workout!'}
                            {'\n'}Keep it up!
                        </Text>
                    </View>

                    {/* Active Minutes */}
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <TouchableOpacity style={styles.statArrow}>
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    style={styles.smallArrowCircle}
                                >
                                    <Icon name="chevron-right" size={16} color={palette.background} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.calorieBadge}>
                            <Text style={styles.calorieText}>{data.summary.activeMinutes} </Text>
                            <Text style={styles.calorieUnit}>min</Text>
                        </View>
                        <Text style={styles.statLabel}>Active Minutes</Text>
                        <Text style={styles.statSubtext}>
                            Time you've been active{'\n'}
                            today. Stay active!
                        </Text>
                    </View>
                </Animated.View>

                {/* Tips Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>AI Recommendations</Text>

                    {loading ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={palette.neonGreen} />
                        </View>
                    ) : data.recommendations.length > 0 ? (
                        data.recommendations.map((tip, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.tipCard,
                                    index === 0 && styles.tipCardGreen,
                                ]}
                            >
                                <Text style={styles.tipTitle}>{tip.title}</Text>
                                <Text style={styles.tipText}>{tip.message}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.tipCard}>
                            <Text style={styles.tipTitle}>No recommendations yet</Text>
                            <Text style={styles.tipText}>
                                Complete your profile and start tracking your activities to get personalized AI recommendations!
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Motivational Quote Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>Today's Motivation</Text>
                    <View style={[styles.tipCard, styles.motivationalQuoteCard]}>
                        <Icon name="format-quote-open" size={32} color={palette.neonGreen} style={{ marginBottom: 8 }} />
                        <Text style={styles.motivationalQuoteText}>
                            {loading ? 'Loading...' : data.quote}
                        </Text>
                        <Icon name="format-quote-close" size={32} color={palette.neonGreen} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
                    </View>
                </Animated.View>

                {/* Progress History / Weekly Progress Card */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>Weekly Progress</Text>

                    <TouchableOpacity
                        style={styles.progressCard}
                        onPress={() => navigation.navigate('BodyStats')}
                    >
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop' }}
                            style={styles.progressImage}
                            imageStyle={styles.progressImageStyle}
                        >
                            <LinearGradient
                                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                                style={styles.progressOverlay}
                            >
                                <Text style={styles.progressTitle}>Progress{'\n'}History</Text>
                                <Text style={styles.progressQuote}>
                                    Track your weekly progress{'\n'}
                                    View detailed stats and charts{'\n'}
                                    Tap to see your journey
                                </Text>

                                <TouchableOpacity style={styles.progressArrow}>
                                    <LinearGradient
                                        colors={[palette.neonGreen, palette.neonGreenDim]}
                                        style={styles.arrowCircle}
                                    >
                                        <Icon name="chevron-right" size={24} color={palette.background} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </LinearGradient>
                        </ImageBackground>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    headerTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 24,
        fontWeight: '700',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    quickActionBtn: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    quickActionGradient: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
    },
    quickActionText: {
        ...typography.caption,
        color: palette.background,
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    sectionTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    scheduleCard: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
    },
    scheduleImage: {
        flex: 1,
    },
    scheduleImageStyle: {
        borderRadius: 16,
    },
    scheduleOverlay: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'space-between',
    },
    scheduleTitle: {
        ...typography.heading2,
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
    },
    scheduleSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        lineHeight: 18,
    },
    scheduleDots: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        backgroundColor: palette.neonGreen,
        width: 24,
    },
    scheduleArrow: {
        position: 'absolute',
        bottom: spacing.lg,
        right: spacing.lg,
    },
    arrowCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    statCard: {
        width: (width - spacing.lg * 2 - spacing.md) / 2,
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    smallArrowCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statArrow: {
        marginTop: -4,
    },
    statLabel: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    statSubtext: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        lineHeight: 16,
    },
    calorieBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: spacing.xs,
    },
    calorieText: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 32,
        fontWeight: '700',
    },
    calorieUnit: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 14,
    },
    tipCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    tipCardGreen: {
        backgroundColor: 'rgba(197, 255, 74, 0.1)',
        borderColor: palette.neonGreen,
    },
    tipTitle: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    tipText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        lineHeight: 18,
    },
    progressCard: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 250,
    },
    progressImage: {
        flex: 1,
    },
    progressImageStyle: {
        borderRadius: 16,
    },
    progressOverlay: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'space-between',
    },
    progressQuote: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    progressTitle: {
        ...typography.heading1,
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
    },
    progressArrow: {
        position: 'absolute',
        bottom: spacing.lg,
        right: spacing.lg,
    },
    bottomSpacing: {
        height: 40,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scheduleScroll: {
        marginHorizontal: -spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    motivationalQuoteCard: {
        backgroundColor: 'rgba(197, 255, 74, 0.05)',
        borderColor: palette.neonGreen,
        paddingVertical: spacing.lg,
    },
    motivationalQuoteText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(197, 255, 74, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: palette.neonGreen,
        marginRight: 4,
    },
    liveText: {
        color: palette.neonGreen,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
