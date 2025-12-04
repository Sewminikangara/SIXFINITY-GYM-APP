import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation, useRoute } from '@react-navigation/native';

export const SubmitReviewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as {
        trainerId: string;
        trainerName: string;
        bookingId?: string;
    } | undefined;

    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitReview = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
            return;
        }

        if (reviewText.trim().length < 10) {
            Alert.alert(
                'Review Too Short',
                'Please write at least 10 characters to help others know about your experience.'
            );
            return;
        }

        setIsSubmitting(true);

        try {
            // TODO: Submit review to Supabase
            // await submitTrainerReview({
            //   trainer_id: params?.trainerId,
            //   booking_id: params?.bookingId,
            //   rating,
            //   comment: reviewText.trim(),
            // });

            Alert.alert(
                'Review Submitted! ✅',
                'Thank you for your feedback. Your review helps other users find great trainers.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            Alert.alert(
                'Submission Failed',
                'Unable to submit your review. Please try again later.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Write a Review</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Trainer Info */}
                <View style={styles.trainerInfo}>
                    <Text style={styles.reviewFor}>Review for</Text>
                    <Text style={styles.trainerName}>{params?.trainerName || 'Trainer'}</Text>
                </View>

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How was your experience?</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                style={styles.starButton}
                            >
                                <Icon
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={48}
                                    color={star <= rating ? '#FFD700' : palette.textSecondary}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </Text>
                    )}
                </View>

                {/* Review Text Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tell us more</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Share details about your experience with this trainer. What did you like? What could be improved?"
                        placeholderTextColor={palette.textSecondary}
                        value={reviewText}
                        onChangeText={setReviewText}
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{reviewText.length}/500 characters</Text>
                </View>

                {/* Tips Section */}
                <View style={styles.tipsContainer}>
                    <Icon name="lightbulb-outline" size={20} color={palette.neonGreen} />
                    <View style={styles.tipsContent}>
                        <Text style={styles.tipsTitle}>Tips for a helpful review:</Text>
                        <Text style={styles.tipText}>• Be specific about your experience</Text>
                        <Text style={styles.tipText}>• Mention the trainer's strengths</Text>
                        <Text style={styles.tipText}>• Keep it respectful and honest</Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (rating === 0 || reviewText.trim().length < 10 || isSubmitting) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitReview}
                    disabled={rating === 0 || reviewText.trim().length < 10 || isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.cardBackground,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
    },
    trainerInfo: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    reviewFor: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    trainerName: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    starButton: {
        padding: spacing.xs,
    },
    ratingLabel: {
        ...typography.bodyBold,
        color: palette.neonGreen,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    textInput: {
        ...typography.body,
        color: palette.textPrimary,
        backgroundColor: palette.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
        minHeight: 150,
        borderWidth: 1,
        borderColor: palette.cardBackground,
    },
    charCount: {
        ...typography.caption,
        color: palette.textSecondary,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    tipsContainer: {
        flexDirection: 'row',
        backgroundColor: palette.cardBackground,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    tipsContent: {
        flex: 1,
    },
    tipsTitle: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    tipText: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: 2,
    },
    submitButton: {
        backgroundColor: palette.neonGreen,
        borderRadius: 12,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    submitButtonDisabled: {
        backgroundColor: palette.cardBackground,
        opacity: 0.5,
    },
    submitButtonText: {
        ...typography.subtitle,
        color: palette.background,
        fontWeight: '600',
    },
});
