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

const { width } = Dimensions.get('window');

type HomeScreenNavigation = CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList, 'Home'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigation>();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

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
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
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
                        onPress={() => navigation.navigate('Trainers')}
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

                    <TouchableOpacity style={styles.quickActionBtn}>
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
                    <TouchableOpacity style={styles.quickActionBtn}>
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>START WORKOUT</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionBtn}>
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.quickActionGradient}
                        >
                            <Text style={styles.quickActionText}>PROGRESS</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionBtn}>
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

                    <TouchableOpacity style={styles.scheduleCard}>
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop' }}
                            style={styles.scheduleImage}
                            imageStyle={styles.scheduleImageStyle}
                        >
                            <LinearGradient
                                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                                style={styles.scheduleOverlay}
                            >
                                <Text style={styles.scheduleTitle}>Upcoming gym{'\n'}bookings</Text>
                                <Text style={styles.scheduleSubtitle}>
                                    Lorem ipsum dolor sit amet, consectetur{'\n'}
                                    adipiscing elit. Sed do eiusmod tempor{'\n'}
                                    incididunt ut labore.
                                </Text>

                                <View style={styles.scheduleDots}>
                                    <View style={[styles.dot, styles.dotActive]} />
                                    <View style={styles.dot} />
                                    <View style={styles.dot} />
                                    <View style={styles.dot} />
                                    <View style={styles.dot} />
                                </View>

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
                </Animated.View>

                {/* Stats Cards Grid */}
                <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
                    {/* Steps Today */}
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
                        <Text style={styles.statLabel}>Steps Today</Text>
                        <Text style={styles.statSubtext}>
                            Lorem ipsum body text{'\n'}for stats and for motivation
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
                            <Text style={styles.calorieText}>256 </Text>
                            <Text style={styles.calorieUnit}>min</Text>
                        </View>
                        <Text style={styles.statLabel}>Calories Burned</Text>
                        <Text style={styles.statSubtext}>
                            Lorem ipsum body text{'\n'}for stats and for motivation
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
                        <Text style={styles.statLabel}>Workout{'\n'}Completed</Text>
                        <Text style={styles.statSubtext}>
                            Lorem ipsum body text{'\n'}for stats and for motivation
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
                            <Text style={styles.calorieText}>256 </Text>
                            <Text style={styles.calorieUnit}>min</Text>
                        </View>
                        <Text style={styles.statLabel}>Active Minutes</Text>
                        <Text style={styles.statSubtext}>
                            Lorem ipsum body text{'\n'}for stats and for motivation
                        </Text>
                    </View>
                </Animated.View>

                {/* Tips Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>Tips</Text>

                    {/* Personalized workout tip */}
                    <View style={[styles.tipCard, styles.tipCardGreen]}>
                        <Text style={styles.tipTitle}>Personalized workout tip</Text>
                        <Text style={styles.tipText}>
                            Measure your body fat to keep track of muscle gain and fat
                            reduction.Measure your body fat to keep track of muscle gain
                            and fat reduction.
                        </Text>
                    </View>

                    {/* Nutrition suggestion */}
                    <View style={styles.tipCard}>
                        <Text style={styles.tipTitle}>Nutrition suggestion</Text>
                        <Text style={styles.tipText}>
                            Measure your body fat to keep track of muscle gain and fat
                            reduction.Measure your body fat to keep track of muscle gain
                            and fat reduction.
                        </Text>
                    </View>

                    {/* Recovery advice */}
                    <View style={styles.tipCard}>
                        <Text style={styles.tipTitle}>Recovery advice</Text>
                        <Text style={styles.tipText}>
                            Measure your body fat to keep track of muscle gain and fat
                            reduction.Measure your body fat to keep track of muscle gain
                            and fat reduction.
                        </Text>
                    </View>
                </Animated.View>

                {/* Motivational Quote Section */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>Motivational Quote</Text>
                </Animated.View>

                {/* Progress History Card */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.progressCard}>
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop' }}
                            style={styles.progressImage}
                            imageStyle={styles.progressImageStyle}
                        >
                            <LinearGradient
                                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                                style={styles.progressOverlay}
                            >
                                <Text style={styles.progressQuote}>
                                    I don't see things and you see{'\n'}
                                    things and say why and i see{'\n'}
                                    things and say why not
                                </Text>
                                <Text style={styles.progressTitle}>Progress{'\n'}History</Text>

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
});
