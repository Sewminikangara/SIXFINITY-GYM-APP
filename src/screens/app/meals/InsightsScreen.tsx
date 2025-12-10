import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components';
import { palette, typography, spacing, radii } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseUserId } from '@/utils/userHelpers';
import insightsService, { NutritionInsights, MacroRatio, WorkoutCorrelation } from '@/services/insightsService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

export const InsightsScreen = () => {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<NutritionInsights | null>(null);
    const [macroRatio, setMacroRatio] = useState<MacroRatio | null>(null);
    const [workoutData, setWorkoutData] = useState<WorkoutCorrelation[]>([]);
    const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const supabaseUserId = getSupabaseUserId(user);
            if (!supabaseUserId) return;

            const [insightsData, macros, workout, recommendations] = await Promise.all([
                insightsService.getWeeklyInsights(supabaseUserId),
                insightsService.getWeeklyMacroRatio(supabaseUserId),
                insightsService.getWorkoutCorrelation(supabaseUserId),
                insightsService.getAIRecommendations(supabaseUserId),
            ]);

            setInsights(insightsData);
            setMacroRatio(macros);
            setWorkoutData(workout);
            setAiRecommendations(recommendations);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const generatePDFHTML = () => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    background: #0A0B0D;
                    color: #FFFFFF;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 3px solid #39FF14;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #39FF14;
                    font-size: 32px;
                    margin: 0 0 10px 0;
                }
                .header p {
                    color: #8E8E93;
                    font-size: 14px;
                    margin: 5px 0;
                }
                .section {
                    background: #1C1C1E;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    border: 1px solid #2C2C2E;
                }
                .section h2 {
                    color: #39FF14;
                    font-size: 20px;
                    margin: 0 0 16px 0;
                    border-bottom: 2px solid #2C2C2E;
                    padding-bottom: 12px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-top: 16px;
                }
                .stat-card {
                    background: #2C2C2E;
                    border-radius: 8px;
                    padding: 16px;
                }
                .stat-label {
                    color: #8E8E93;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }
                .stat-value {
                    color: #FFFFFF;
                    font-size: 28px;
                    font-weight: bold;
                }
                .stat-unit {
                    color: #8E8E93;
                    font-size: 14px;
                    margin-left: 4px;
                }
                .macro-bar {
                    margin: 12px 0;
                }
                .macro-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                .macro-name {
                    color: #FFFFFF;
                    font-weight: 600;
                }
                .macro-value {
                    color: #39FF14;
                }
                .progress-bar {
                    background: #2C2C2E;
                    border-radius: 8px;
                    height: 8px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 8px;
                    transition: width 0.3s ease;
                }
                .recommendations {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .recommendations li {
                    background: #2C2C2E;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 12px;
                    border-left: 4px solid #39FF14;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #2C2C2E;
                    color: #8E8E93;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>💪 Weekly Nutrition Report</h1>
                <p>Generated on ${dateStr}</p>
                <p>SIXFINITY Gym App</p>
            </div>

            ${insights ? `
            <div class="section">
                <h2>📊 Weekly Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Average Daily</div>
                        <div class="stat-value">${insights.averageCalories}<span class="stat-unit">kcal</span></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Weekly Targets</div>
                        <div class="stat-value">${insights.weeklyTargets[0]}<span class="stat-unit">kcal</span></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Protein Goals Met</div>
                        <div class="stat-value">${insights.proteinGoalsMet}<span class="stat-unit">/ 7</span></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Meal Adherence</div>
                        <div class="stat-value">${insights.mealAdherence.toFixed(0)}<span class="stat-unit">%</span></div>
                    </div>
                </div>
            </div>
            ` : ''}

            ${macroRatio ? `
            <div class="section">
                <h2>🍽️ Macro Distribution</h2>
                <div class="macro-bar">
                    <div class="macro-label">
                        <span class="macro-name">Protein</span>
                        <span class="macro-value">${macroRatio.protein.toFixed(1)}g (${((macroRatio.protein / (macroRatio.protein + macroRatio.carbs + macroRatio.fats)) * 100).toFixed(0)}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((macroRatio.protein / (macroRatio.protein + macroRatio.carbs + macroRatio.fats)) * 100).toFixed(0)}%; background: #FF453A;"></div>
                    </div>
                </div>
                <div class="macro-bar">
                    <div class="macro-label">
                        <span class="macro-name">Carbs</span>
                        <span class="macro-value">${macroRatio.carbs.toFixed(1)}g (${((macroRatio.carbs / (macroRatio.protein + macroRatio.carbs + macroRatio.fats)) * 100).toFixed(0)}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((macroRatio.carbs / (macroRatio.protein + macroRatio.carbs + macroRatio.fats)) * 100).toFixed(0)}%; background: #32D74B;"></div>
                    </div>
                </div>
                <div class="macro-bar">
                    <div class="macro-label">
                        <span class="macro-name">Fat</span>
                        <span class="macro-value">${macroRatio.fats.toFixed(1)}g (${((macroRatio.fats / (macroRatio.protein + macroRatio.carbs + macroRatio.fats)) * 100).toFixed(0)}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((macroRatio.fats / (macroRatio.protein + macroRatio.carbs + macroRatio.fats)) * 100).toFixed(0)}%; background: #FFD60A;"></div>
                    </div>
                </div>
            </div>
            ` : ''}

            ${aiRecommendations.length > 0 ? `
            <div class="section">
                <h2>🤖 AI Recommendations</h2>
                <ul class="recommendations">
                    ${aiRecommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <div class="footer">
                <p>This report was automatically generated by SIXFINITY Gym App</p>
                <p>Keep up the great work! 💪</p>
            </div>
        </body>
        </html>
        `;
    };

    const handleDownloadReport = async () => {
        try {
            Alert.alert('Generating PDF', 'Please wait...');

            // Generate PDF from HTML
            const html = generatePDFHTML();
            const { uri } = await Print.printToFileAsync({ html });

            // Share the PDF directly
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                    await Sharing.shareAsync(uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Save Your Nutrition Report',
                        UTI: 'com.adobe.pdf',
                    });
                    Alert.alert('Success', 'Your nutrition report has been generated!');
                } else {
                    Alert.alert('Success', 'Report generated successfully!');
                }
            } else {
                Alert.alert('Success', `Report saved to: ${uri}`);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
        }
    };

    if (loading && !refreshing) {
        return (
            <Screen>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading insights...</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.neonGreen} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Nutrition Insights</Text>
                    <TouchableOpacity onPress={handleDownloadReport}>
                        <Ionicons name="download" size={24} color={palette.neonGreen} />
                    </TouchableOpacity>
                </View>

                {/* Weekly Calorie Summary */}
                {insights && (
                    <>
                        <LinearGradient
                            colors={['rgba(0, 255, 127, 0.2)', 'rgba(0, 255, 127, 0.05)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.summaryCard}
                        >
                            <Text style={styles.cardTitle}>This Week's Summary</Text>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{insights.averageCalories}</Text>
                                    <Text style={styles.summaryLabel}>Avg Calories/Day</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{insights.mealAdherence}%</Text>
                                    <Text style={styles.summaryLabel}>Meal Adherence</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Calorie Deficit/Surplus Card */}
                        {insights.calorieDeficit > 0 || insights.calorieSurplus > 0 ? (
                            <View style={styles.deficitCard}>
                                <Ionicons
                                    name={insights.calorieDeficit > 0 ? "trending-down" : "trending-up"}
                                    size={24}
                                    color={insights.calorieDeficit > 0 ? palette.neonGreen : "#feca57"}
                                />
                                <Text style={styles.deficitText}>
                                    You consumed{' '}
                                    <Text style={styles.deficitValue}>
                                        {insights.calorieDeficit > 0 ? insights.calorieDeficit : insights.calorieSurplus} kcal
                                    </Text>
                                    {' '}{insights.calorieDeficit > 0 ? 'less' : 'more'} than your target this week
                                </Text>
                            </View>
                        ) : null}

                        {/* Weekly Nutrition Graph */}
                        <View style={styles.graphCard}>
                            <Text style={styles.cardTitle}>Calorie Intake vs Target</Text>
                            <View style={styles.graphContainer}>
                                {insights.weeklyCalories.map((calories, index) => {
                                    const target = insights.weeklyTargets[index];
                                    const maxValue = Math.max(...insights.weeklyCalories, ...insights.weeklyTargets);
                                    const heightPercentage = (calories / maxValue) * 100;
                                    const targetHeightPercentage = (target / maxValue) * 100;
                                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                                    return (
                                        <View key={index} style={styles.barGroup}>
                                            <View style={styles.barContainer}>
                                                <View style={[
                                                    styles.bar,
                                                    { height: `${heightPercentage}%` },
                                                    calories > target && styles.barOver,
                                                    calories < target && styles.barUnder,
                                                ]} />
                                                <View style={[
                                                    styles.targetLine,
                                                    { bottom: `${targetHeightPercentage}%` },
                                                ]} />
                                            </View>
                                            <Text style={styles.barLabel}>{days[index]}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                            <View style={styles.legend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: palette.neonGreen }]} />
                                    <Text style={styles.legendText}>Consumed</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#feca57' }]} />
                                    <Text style={styles.legendText}>Target</Text>
                                </View>
                            </View>
                        </View>

                        {/* Macro Ratio Chart */}
                        {macroRatio && (
                            <View style={styles.macroCard}>
                                <Text style={styles.cardTitle}>Average Macro Ratio</Text>
                                <View style={styles.macroRatioContainer}>
                                    <View style={styles.macroRatioBar}>
                                        <View style={[styles.macroSegment, {
                                            flex: macroRatio.protein,
                                            backgroundColor: '#ff6b6b',
                                        }]} />
                                        <View style={[styles.macroSegment, {
                                            flex: macroRatio.carbs,
                                            backgroundColor: '#feca57',
                                        }]} />
                                        <View style={[styles.macroSegment, {
                                            flex: macroRatio.fats,
                                            backgroundColor: '#48dbfb',
                                        }]} />
                                    </View>
                                    <View style={styles.macroLabels}>
                                        <View style={styles.macroLabelItem}>
                                            <View style={[styles.macroDot, { backgroundColor: '#ff6b6b' }]} />
                                            <Text style={styles.macroLabelText}>Protein {macroRatio.protein}%</Text>
                                        </View>
                                        <View style={styles.macroLabelItem}>
                                            <View style={[styles.macroDot, { backgroundColor: '#feca57' }]} />
                                            <Text style={styles.macroLabelText}>Carbs {macroRatio.carbs}%</Text>
                                        </View>
                                        <View style={styles.macroLabelItem}>
                                            <View style={[styles.macroDot, { backgroundColor: '#48dbfb' }]} />
                                            <Text style={styles.macroLabelText}>Fats {macroRatio.fats}%</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Top Foods Consumed */}
                        <View style={styles.topFoodsCard}>
                            <Text style={styles.cardTitle}>Most Frequent Foods</Text>
                            {insights.topFoods.map((food, index) => (
                                <View key={index} style={styles.foodItem}>
                                    <View style={styles.foodRank}>
                                        <Text style={styles.foodRankText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.foodContent}>
                                        <Text style={styles.foodName}>{food.name}</Text>
                                        <Text style={styles.foodStats}>
                                            {food.count}x • {food.calories} kcal total
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* AI Recommendations */}
                        {aiRecommendations.length > 0 && (
                            <View style={styles.recommendationsCard}>
                                <View style={styles.recommendationsHeader}>
                                    <Ionicons name="sparkles" size={20} color={palette.neonGreen} />
                                    <Text style={styles.cardTitle}>AI Recommendations</Text>
                                </View>
                                {aiRecommendations.map((rec, index) => (
                                    <View key={index} style={styles.recommendationItem}>
                                        <Ionicons name="checkmark-circle" size={16} color={palette.neonGreen} />
                                        <Text style={styles.recommendationText}>{rec}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Progress Badges */}
                        {insights.badges.length > 0 && (
                            <View style={styles.badgesCard}>
                                <Text style={styles.cardTitle}>Achievements</Text>
                                {insights.badges.map((badge, index) => (
                                    <View key={index} style={styles.badge}>
                                        <Ionicons name="trophy" size={20} color="#feca57" />
                                        <Text style={styles.badgeText}>{badge}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Hydration Insight */}
                        <View style={styles.hydrationCard}>
                            <View style={styles.hydrationHeader}>
                                <Ionicons name="water" size={24} color="#48dbfb" />
                                <Text style={styles.cardTitle}>Hydration</Text>
                            </View>
                            <Text style={styles.hydrationText}>
                                You met {insights.waterGoalsMet} out of 7 water intake goals this week
                            </Text>
                            <View style={styles.hydrationBar}>
                                <View style={[
                                    styles.hydrationProgress,
                                    { width: `${(insights.waterGoalsMet / 7) * 100}%` },
                                ]} />
                            </View>
                        </View>
                    </>
                )}

                {/* Download Report Button */}
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReport}>
                    <LinearGradient
                        colors={[palette.neonGreen, palette.neonGreenDim]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.downloadGradient}
                    >
                        <Ionicons name="document-text" size={20} color={palette.background} />
                        <Text style={styles.downloadButtonText}>Download Weekly Report (PDF)</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    content: {
        padding: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    summaryCard: {
        padding: spacing.lg,
        borderRadius: radii.lg,
        marginBottom: spacing.md,
    },
    cardTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        ...typography.heading1,
        color: palette.neonGreen,
        marginBottom: spacing.xs,
    },
    summaryLabel: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    deficitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        marginBottom: spacing.md,
    },
    deficitText: {
        ...typography.body,
        color: palette.textPrimary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    deficitValue: {
        ...typography.bodyBold,
        color: palette.neonGreen,
    },
    graphCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    graphContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 200,
        marginBottom: spacing.md,
    },
    barGroup: {
        flex: 1,
        alignItems: 'center',
    },
    barContainer: {
        position: 'relative',
        width: '80%',
        height: 180,
        justifyContent: 'flex-end',
    },
    bar: {
        backgroundColor: palette.neonGreen,
        borderTopLeftRadius: radii.sm,
        borderTopRightRadius: radii.sm,
        width: '100%',
    },
    barOver: {
        backgroundColor: '#feca57',
    },
    barUnder: {
        backgroundColor: palette.neonGreen,
    },
    targetLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#feca57',
    },
    barLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginTop: spacing.xs,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.xs,
    },
    legendText: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    macroCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    macroRatioContainer: {
        marginTop: spacing.sm,
    },
    macroRatioBar: {
        flexDirection: 'row',
        height: 30,
        borderRadius: radii.md,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    macroSegment: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    macroLabels: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    macroLabelItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    macroDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.xs,
    },
    macroLabelText: {
        ...typography.caption,
        color: palette.textPrimary,
    },
    topFoodsCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        backgroundColor: palette.backgroundElevated,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    foodRank: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: palette.neonGreen,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    foodRankText: {
        ...typography.bodyBold,
        color: palette.background,
    },
    foodContent: {
        flex: 1,
    },
    foodName: {
        ...typography.body,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    foodStats: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    recommendationsCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    recommendationsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.sm,
        backgroundColor: palette.backgroundElevated,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    recommendationText: {
        ...typography.body,
        color: palette.textPrimary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    badgesCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: palette.backgroundElevated,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    badgeText: {
        ...typography.body,
        color: palette.textPrimary,
        marginLeft: spacing.sm,
    },
    hydrationCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    hydrationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    hydrationText: {
        ...typography.body,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    hydrationBar: {
        height: 10,
        backgroundColor: 'rgba(72, 219, 251, 0.2)',
        borderRadius: radii.sm,
        overflow: 'hidden',
    },
    hydrationProgress: {
        height: '100%',
        backgroundColor: '#48dbfb',
    },
    downloadButton: {
        marginBottom: spacing.lg,
    },
    downloadGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: radii.lg,
    },
    downloadButtonText: {
        ...typography.bodyBold,
        color: palette.background,
        marginLeft: spacing.sm,
    },
});
