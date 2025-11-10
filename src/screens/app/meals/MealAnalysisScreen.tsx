/**
 * MealAnalysisScreen - AI Meal Scanning & Nutrition Analysis
 * 
 * FLOW:
 * 1. User takes photo OR scans barcode
 * 2. Shows image with "X% Scanning..." overlay
 * 3. AI analyzes nutrition facts
 * 4. Displays 6 macro circles (Carbs, Protein, Fat, Fiber, Sodium, None)
 * 5. User can save meal with custom name and meal type
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { AppStackParamList } from '@/navigation/types';
import mealService from '@/services/mealService';
import { useAuth } from '@/context/AuthContext';
import { analyzePhotoNutrition } from '@/services/nutritionService';

type Props = NativeStackScreenProps<AppStackParamList, 'MealAnalysis'>;

interface NutritionData {
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
    sodium: number;
    calories: number;
}

export const MealAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
    const { imageUri, scanType } = route.params;
    const { user } = useAuth();

    const [scanning, setScanning] = useState(true);
    const [scanProgress, setScanProgress] = useState(0);
    const [mealName, setMealName] = useState('');
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
    const [nutrition, setNutrition] = useState<NutritionData>({
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
        calories: 0,
    });
    const [saving, setSaving] = useState(false);
    const [imageError, setImageError] = useState(false);      // Simulate AI scanning progress
    useEffect(() => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setScanProgress(progress);

            if (progress >= 85) {
                clearInterval(interval);
                analyzeMeal();
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // AI Meal Analysis using real Nutritionix API
    const analyzeMeal = async () => {
        try {
            const result = await analyzePhotoNutrition(imageUri);

            setNutrition({
                carbs: result.carbs,
                protein: result.protein,
                fat: result.fat,
                fiber: result.fiber,
                sodium: result.sodium / 100, // Convert mg to display units
                calories: result.calories,
            });
            setMealName(result.foodName);
            setScanning(false);
        } catch (error) {
            console.error('Error analyzing meal:', error);
            // Use mock data as fallback
            setNutrition({
                carbs: 45,
                protein: 25,
                fat: 15,
                fiber: 8,
                sodium: 5,
                calories: 420,
            });
            setMealName('Meal');
            setScanning(false);

            Alert.alert(
                'Analysis Failed',
                'Could not analyze the photo. Using estimated values. Please adjust manually if needed.',
                [{ text: 'OK' }]
            );
        }
    };

    // Handle Save Meal
    const handleSaveMeal = async () => {
        if (!mealName.trim()) {
            Alert.alert('Error', 'Please enter a meal name');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'You must be logged in to save meals');
            return;
        }

        setSaving(true);

        try {
            const mealData = {
                user_id: user.id,
                meal_name: mealName,
                meal_type: selectedMealType,
                total_calories: nutrition.calories,
                protein_grams: nutrition.protein,
                carbs_grams: nutrition.carbs,
                fats_grams: nutrition.fat,
                entry_method: (scanType === 'camera' ? 'photo' : 'barcode') as 'photo' | 'barcode',
            };

            await mealService.createMeal(mealData);

            Alert.alert(
                'Success! 🎉',
                `${mealName} has been added to your ${selectedMealType}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('Error saving meal:', error);
            const errorMessage = error?.message || 'Failed to save meal. Please check your internet connection and try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Render Progress Circle (Figma style with green arc)
    const renderProgressCircle = (label: string, value: number) => {
        const percentage = Math.round(value);

        return (
            <View style={styles.progressCircleContainer}>
                <View style={styles.progressCircle}>
                    <View style={styles.progressCircleInner}>
                        <Text style={styles.progressPercentage}>{percentage}%</Text>
                    </View>
                    {/* Green progress arc */}
                    <View
                        style={[
                            styles.progressArc,
                            {
                                borderTopColor: percentage > 0 ? '#9FD356' : 'transparent',
                                borderRightColor: percentage > 25 ? '#9FD356' : 'transparent',
                                borderBottomColor: percentage > 50 ? '#9FD356' : 'transparent',
                                borderLeftColor: percentage > 75 ? '#9FD356' : 'transparent',
                            }
                        ]}
                    />
                </View>
                <Text style={styles.progressLabel}>{label}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sphiria Fit</Text>
            </View>

            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="chevron-back-circle" size={36} color={palette.textSecondary} />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Image with Scanning Overlay */}
                <View style={styles.imageContainer}>
                    {!imageError ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.mealImage}
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <View style={[styles.mealImage, styles.imagePlaceholder]}>
                            <Ionicons name="fast-food" size={80} color={palette.textSecondary} />
                        </View>
                    )}

                    {scanning && (
                        <View style={styles.scanningOverlay}>
                            <Text style={styles.scanningText}>{scanProgress}% Scanning...</Text>
                        </View>
                    )}

                    {/* Rounded corners overlay */}
                    <View style={styles.cornerOverlay}>
                        <View style={[styles.cornerDot, styles.topLeftDot]} />
                        <View style={[styles.cornerDot, styles.topRightDot]} />
                        <View style={[styles.cornerDot, styles.bottomLeftDot]} />
                        <View style={[styles.cornerDot, styles.bottomRightDot]} />
                    </View>
                </View>

                {!scanning && (
                    <>
                        {/* Close/Meal Analysis Buttons */}
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                                <Ionicons name="chevron-forward" size={24} color={palette.textPrimary} />
                            </TouchableOpacity>

                            <View style={styles.analysisButton}>
                                <Text style={styles.analysisButtonText}>Meal Analysis</Text>
                                <Ionicons name="chevron-forward" size={24} color={palette.textPrimary} />
                            </View>
                        </View>

                        {/* Nutrition Circles Grid (3x2) */}
                        <View style={styles.nutritionGrid}>
                            {renderProgressCircle('Carbs', nutrition.carbs)}
                            {renderProgressCircle('Protein', nutrition.protein)}
                            {renderProgressCircle('Fat', nutrition.fat)}
                            {renderProgressCircle('Fiber', nutrition.fiber)}
                            {renderProgressCircle('Sodium', nutrition.sodium)}
                            {renderProgressCircle('None', 18)}
                        </View>

                        {/* Save Meal Section */}
                        <View style={styles.saveMealSection}>
                            <Text style={styles.saveMealTitle}>Save Meal</Text>

                            {/* Meal Name Input */}
                            <TextInput
                                style={styles.mealNameInput}
                                value={mealName}
                                onChangeText={setMealName}
                                placeholder="Strawberry pancakes"
                                placeholderTextColor="#666"
                            />

                            {/* Meal Type Selector */}
                            <View style={styles.mealTypeRow}>
                                {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.mealTypeButton,
                                            selectedMealType === type.toLowerCase() && styles.mealTypeButtonActive,
                                        ]}
                                        onPress={() => setSelectedMealType(type.toLowerCase() as any)}
                                    >
                                        <Text
                                            style={[
                                                styles.mealTypeButtonText,
                                                selectedMealType === type.toLowerCase() && styles.mealTypeButtonTextActive,
                                            ]}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveMeal}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.saveButtonText}>Save Meal</Text>
                                        <Ionicons name="chevron-forward" size={28} color="#000" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#808080',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#000',
    },
    headerTitle: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    backButtonText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '500',
    },
    imageContainer: {
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#FFF',
        height: 320,
    },
    mealImage: {
        width: '100%',
        height: '100%',
    },
    scanningOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanningText: {
        fontSize: 28,
        color: '#FFF',
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    cornerOverlay: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
    },
    cornerDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#999',
    },
    topLeftDot: {
        top: 16,
        left: 16,
    },
    topRightDot: {
        top: 16,
        right: 16,
    },
    bottomLeftDot: {
        bottom: 16,
        left: 16,
    },
    bottomRightDot: {
        bottom: 16,
        right: 16,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    closeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingVertical: 14,
        borderRadius: 50,
        gap: 8,
    },
    closeButtonText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
    analysisButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 50,
        gap: 8,
    },
    analysisButtonText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '700',
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    progressCircleContainer: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 24,
    },
    progressCircle: {
        width: 90,
        height: 90,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressCircleInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFF',
        borderWidth: 6,
        borderColor: '#2D5A2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressArc: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 6,
        borderColor: 'transparent',
        transform: [{ rotate: '-90deg' }],
    },
    progressPercentage: {
        fontSize: 22,
        color: '#000',
        fontWeight: '700',
    },
    progressLabel: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '500',
    },
    saveMealSection: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    saveMealTitle: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: '700',
        marginBottom: 16,
    },
    mealNameInput: {
        backgroundColor: '#FFF',
        borderRadius: 50,
        paddingHorizontal: 24,
        paddingVertical: 16,
        fontSize: 16,
        color: '#000',
        marginBottom: 12,
    },
    mealTypeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    mealTypeButton: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingVertical: 14,
        borderRadius: 50,
        alignItems: 'center',
    },
    mealTypeButtonActive: {
        backgroundColor: '#9FD356',
    },
    mealTypeButtonText: {
        fontSize: 15,
        color: '#000',
        fontWeight: '600',
    },
    mealTypeButtonTextActive: {
        color: '#000',
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: '#9FD356',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 50,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 18,
        color: '#000',
        fontWeight: '700',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EEE',
    },
});
