import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { sendReviewReminder } from '@/services/notificationsService';

interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: number;
    restTime: number; // in seconds
    muscleGroups: string[];
    gifUrl: string;
    tips: string;
}

export const ActiveWorkoutScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workoutId, bookingId, trainerName } = route.params as {
        workoutId: string;
        bookingId?: string;
        trainerName?: string;
    };

    // Mock workout data
    const workout = {
        id: '1',
        name: 'Upper Body Blast',
        totalExercises: 5,
    };

    const exercises: Exercise[] = [
        {
            id: '1',
            name: 'Barbell Bench Press',
            sets: 4,
            reps: 10,
            restTime: 90,
            muscleGroups: ['Chest', 'Triceps'],
            gifUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
            tips: 'Keep your back flat on the bench. Lower the bar to mid-chest level.',
        },
        {
            id: '2',
            name: 'Dumbbell Shoulder Press',
            sets: 3,
            reps: 12,
            restTime: 60,
            muscleGroups: ['Shoulders', 'Triceps'],
            gifUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
            tips: 'Press dumbbells overhead until arms are fully extended. Keep core engaged.',
        },
        {
            id: '3',
            name: 'Cable Flyes',
            sets: 3,
            reps: 15,
            restTime: 60,
            muscleGroups: ['Chest'],
            gifUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
            tips: 'Maintain slight bend in elbows. Focus on squeezing chest at the center.',
        },
        {
            id: '4',
            name: 'Tricep Dips',
            sets: 3,
            reps: 12,
            restTime: 60,
            muscleGroups: ['Triceps'],
            gifUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
            tips: 'Keep elbows close to body. Lower until upper arms are parallel to ground.',
        },
        {
            id: '5',
            name: 'Face Pulls',
            sets: 3,
            reps: 15,
            restTime: 45,
            muscleGroups: ['Shoulders', 'Back'],
            gifUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
            tips: 'Pull rope to face level. Squeeze shoulder blades together.',
        },
    ];

    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [completedSets, setCompletedSets] = useState<boolean[]>(
        new Array(exercises[0].sets).fill(false)
    );
    const [isResting, setIsResting] = useState(false);
    const [restTimer, setRestTimer] = useState(0);
    const [notes, setNotes] = useState('');

    const currentExercise = exercises[currentExerciseIndex];
    const progress = ((currentExerciseIndex / exercises.length) * 100);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isResting && restTimer > 0) {
            interval = setInterval(() => {
                setRestTimer((prev) => {
                    if (prev <= 1) {
                        setIsResting(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isResting, restTimer]);

    const handleSetComplete = () => {
        const newCompletedSets = [...completedSets];
        newCompletedSets[currentSet - 1] = true;
        setCompletedSets(newCompletedSets);

        if (currentSet < currentExercise.sets) {
            // Start rest timer
            setIsResting(true);
            setRestTimer(currentExercise.restTime);
            setCurrentSet(currentSet + 1);
        } else {
            // Move to next exercise
            handleNextExercise();
        }
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
            setCurrentSet(1);
            setCompletedSets(new Array(exercises[currentExerciseIndex + 1].sets).fill(false));
            setIsResting(false);
            setRestTimer(0);
        } else {
            handleCompleteWorkout();
        }
    };

    const handlePreviousExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(currentExerciseIndex - 1);
            setCurrentSet(1);
            setCompletedSets(new Array(exercises[currentExerciseIndex - 1].sets).fill(false));
            setIsResting(false);
            setRestTimer(0);
        }
    };

    const handleSkipRest = () => {
        setIsResting(false);
        setRestTimer(0);
    };

    const handleCompleteWorkout = async () => {
        // Send review reminder if this is a booked session
        if (bookingId && trainerName) {
            try {
                await sendReviewReminder(bookingId, trainerName);
            } catch (error) {
                console.error('Failed to send review reminder:', error);
            }
        }

        Alert.alert(
            'Workout Complete! 🎉',
            bookingId
                ? 'Great job! You\'ll receive a reminder to review your session with ' + trainerName + '.'
                : 'Great job! You\'ve completed your workout.',
            [
                {
                    text: 'Add Notes',
                    onPress: () => {
                        // Show notes input or save
                        navigation.goBack();
                    },
                },
                {
                    text: 'Finish',
                    onPress: () => navigation.goBack(),
                    style: 'default',
                },
            ]
        );
    };

    const handleQuit = () => {
        Alert.alert(
            'Quit Workout?',
            'Are you sure you want to quit? Your progress will not be saved.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Quit',
                    onPress: () => navigation.goBack(),
                    style: 'destructive',
                },
            ]
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
                    <Icon name="close" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.exerciseCount}>
                        Exercise {currentExerciseIndex + 1} of {exercises.length}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <LinearGradient
                        colors={[palette.neonGreen, palette.neonGreenDim]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${progress}%` }]}
                    />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Exercise Image/GIF */}
                <View style={styles.exerciseImageContainer}>
                    <Image
                        source={{ uri: currentExercise.gifUrl }}
                        style={styles.exerciseImage}
                    />
                    {isResting && (
                        <LinearGradient
                            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
                            style={styles.restOverlay}
                        >
                            <Icon name="timer-sand" size={48} color={palette.neonGreen} />
                            <Text style={styles.restTitle}>Rest Time</Text>
                            <Text style={styles.restTimer}>{formatTime(restTimer)}</Text>
                            <TouchableOpacity style={styles.skipRestButton} onPress={handleSkipRest}>
                                <Text style={styles.skipRestText}>Skip Rest</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    )}
                </View>

                {/* Exercise Info */}
                <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{currentExercise.name}</Text>
                    <View style={styles.muscleGroupsRow}>
                        {currentExercise.muscleGroups.map((muscle, index) => (
                            <View key={index} style={styles.muscleTag}>
                                <Text style={styles.muscleText}>{muscle}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Sets & Reps */}
                <View style={styles.setsContainer}>
                    <View style={styles.setsHeader}>
                        <Text style={styles.setsTitle}>Sets & Reps</Text>
                        <Text style={styles.currentSetText}>
                            Set {currentSet} of {currentExercise.sets}
                        </Text>
                    </View>

                    <View style={styles.setsGrid}>
                        {Array.from({ length: currentExercise.sets }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.setCard,
                                    completedSets[index] && styles.setCardCompleted,
                                    index + 1 === currentSet && !completedSets[index] && styles.setCardActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.setNumber,
                                        completedSets[index] && styles.setTextCompleted,
                                        index + 1 === currentSet && !completedSets[index] && styles.setTextActive,
                                    ]}
                                >
                                    {index + 1}
                                </Text>
                                <Text
                                    style={[
                                        styles.setReps,
                                        completedSets[index] && styles.setTextCompleted,
                                        index + 1 === currentSet && !completedSets[index] && styles.setTextActive,
                                    ]}
                                >
                                    {currentExercise.reps} reps
                                </Text>
                                {completedSets[index] && (
                                    <Icon name="check-circle" size={20} color={palette.neonGreen} style={styles.checkIcon} />
                                )}
                            </View>
                        ))}
                    </View>

                    {!completedSets[currentSet - 1] && !isResting && (
                        <TouchableOpacity style={styles.completeSetButton} onPress={handleSetComplete}>
                            <LinearGradient
                                colors={[palette.neonGreen, palette.neonGreenDim]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.completeSetGradient}
                            >
                                <Icon name="check-bold" size={20} color={palette.background} />
                                <Text style={styles.completeSetText}>Complete Set</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Exercise Tips */}
                <View style={styles.tipsContainer}>
                    <View style={styles.tipsHeader}>
                        <Icon name="lightbulb-on" size={20} color="#FFD700" />
                        <Text style={styles.tipsTitle}>Exercise Tips</Text>
                    </View>
                    <Text style={styles.tipsText}>{currentExercise.tips}</Text>
                </View>

                {/* Quick Notes */}
                <View style={styles.notesContainer}>
                    <Text style={styles.notesTitle}>Quick Notes</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Add notes about this exercise..."
                        placeholderTextColor={palette.textSecondary}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
                    onPress={handlePreviousExercise}
                    disabled={currentExerciseIndex === 0}
                >
                    <Icon
                        name="chevron-left"
                        size={24}
                        color={currentExerciseIndex === 0 ? palette.textSecondary : palette.textPrimary}
                    />
                    <Text
                        style={[
                            styles.navButtonText,
                            currentExerciseIndex === 0 && styles.navButtonTextDisabled,
                        ]}
                    >
                        Previous
                    </Text>
                </TouchableOpacity>

                {currentExerciseIndex === exercises.length - 1 && completedSets.every((s) => s) ? (
                    <TouchableOpacity style={styles.completeButton} onPress={handleCompleteWorkout}>
                        <LinearGradient
                            colors={['#4ECDC4', '#45B7D1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.completeButtonGradient}
                        >
                            <Icon name="check-all" size={24} color="#fff" />
                            <Text style={styles.completeButtonText}>Complete Workout</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.navButton, !completedSets.every((s) => s) && styles.navButtonDisabled]}
                        onPress={handleNextExercise}
                        disabled={!completedSets.every((s) => s)}
                    >
                        <Text
                            style={[
                                styles.navButtonText,
                                !completedSets.every((s) => s) && styles.navButtonTextDisabled,
                            ]}
                        >
                            Next
                        </Text>
                        <Icon
                            name="chevron-right"
                            size={24}
                            color={!completedSets.every((s) => s) ? palette.textSecondary : palette.textPrimary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    quitButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    workoutName: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    exerciseCount: {
        color: palette.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: palette.surface,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        width: 45,
    },
    content: {
        flex: 1,
    },
    exerciseImageContainer: {
        height: 280,
        marginHorizontal: spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    exerciseImage: {
        width: '100%',
        height: '100%',
        backgroundColor: palette.border,
    },
    restOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restTitle: {
        color: palette.neonGreen,
        fontSize: 18,
        fontWeight: '700',
        marginTop: spacing.sm,
    },
    restTimer: {
        color: palette.textPrimary,
        fontSize: 48,
        fontWeight: '700',
        marginTop: spacing.sm,
    },
    skipRestButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        backgroundColor: 'rgba(197, 255, 74, 0.2)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.neonGreen,
    },
    skipRestText: {
        color: palette.neonGreen,
        fontSize: 14,
        fontWeight: '700',
    },
    exerciseInfo: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    exerciseName: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    muscleGroupsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    muscleTag: {
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    muscleText: {
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '600',
    },
    setsContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
    },
    setsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    setsTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    currentSetText: {
        color: palette.neonGreen,
        fontSize: 14,
        fontWeight: '600',
    },
    setsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    setCard: {
        width: '22%',
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: palette.border,
        position: 'relative',
    },
    setCardActive: {
        borderColor: palette.neonGreen,
        backgroundColor: 'rgba(197, 255, 74, 0.1)',
    },
    setCardCompleted: {
        borderColor: palette.neonGreen,
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
    },
    setNumber: {
        color: palette.textSecondary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    setReps: {
        color: palette.textSecondary,
        fontSize: 12,
    },
    setTextActive: {
        color: palette.neonGreen,
    },
    setTextCompleted: {
        color: palette.neonGreen,
    },
    checkIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    completeSetButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    completeSetGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    completeSetText: {
        color: palette.background,
        fontSize: 16,
        fontWeight: '700',
    },
    tipsContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.sm,
    },
    tipsTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    tipsText: {
        color: palette.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    notesContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    notesTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    notesInput: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        color: palette.textPrimary,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: palette.border,
    },
    bottomNav: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        gap: spacing.md,
    },
    navButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        paddingVertical: 14,
        gap: 4,
    },
    navButtonDisabled: {
        opacity: 0.4,
    },
    navButtonText: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    navButtonTextDisabled: {
        color: palette.textSecondary,
    },
    completeButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    completeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
