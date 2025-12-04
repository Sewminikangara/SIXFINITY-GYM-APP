import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';
import { getTrainers, getFeaturedTrainers, type Trainer } from '@/services/trainersService';

const SPECIALIZATIONS = [
    'Strength Training',
    'Weight Loss',
    'Yoga',
    'Cardio',
    'CrossFit',
    'Boxing',
    'HIIT',
    'Nutrition',
];

const EXPERIENCE_LEVELS = ['1-2 years', '3-5 years', '5-10 years', '10+ years'];
const PRICE_RANGES = ['$0-50', '$50-100', '$100-150', '$150+'];
const RATINGS = ['4.5+', '4.0+', '3.5+', 'Any'];
const AVAILABILITY = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const TrainersTab = () => {
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
    const [selectedExperience, setSelectedExperience] = useState<string>('');
    const [selectedPrice, setSelectedPrice] = useState<string>('');
    const [selectedRating, setSelectedRating] = useState<string>('');
    const [selectedAvailability, setSelectedAvailability] = useState<string>('');

    // Real data from Supabase
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [featuredTrainers, setFeaturedTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load trainers on mount
    useEffect(() => {
        loadTrainers();
    }, []);

    // Load trainers with filters
    const loadTrainers = async () => {
        try {
            setLoading(true);

            // Build filters from UI selections
            const filters: any = {};
            if (selectedSpecializations.length > 0) {
                filters.specialization = selectedSpecializations[0];
            }
            if (selectedRating && selectedRating !== 'Any') {
                filters.minRating = parseFloat(selectedRating.replace('+', ''));
            }
            if (searchQuery) {
                filters.searchQuery = searchQuery;
            }

            const [allTrainers, featured] = await Promise.all([
                getTrainers(filters),
                getFeaturedTrainers(10)
            ]);

            setTrainers(allTrainers);
            setFeaturedTrainers(featured);
        } catch (error) {
            console.error('Error loading trainers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Reload when filters change
    useEffect(() => {
        loadTrainers();
    }, [selectedSpecializations, selectedRating, searchQuery]);

    const toggleSpecialization = (spec: string) => {
        setSelectedSpecializations(prev =>
            prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
        );
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (selectedSpecializations.length > 0) count++;
        if (selectedExperience) count++;
        if (selectedPrice) count++;
        if (selectedRating) count++;
        if (selectedAvailability) count++;
        return count;
    };

    const clearAllFilters = () => {
        setSelectedSpecializations([]);
        setSelectedExperience('');
        setSelectedPrice('');
        setSelectedRating('');
        setSelectedAvailability('');
    };

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Search Bar & Filters */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Icon name="magnify" size={20} color={palette.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or specialization"
                            placeholderTextColor={palette.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Icon name="close-circle" size={20} color={palette.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFiltersModal(true)}
                    >
                        <Icon name="filter-variant" size={20} color={palette.textPrimary} />
                        {getActiveFiltersCount() > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Loading State */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={palette.neonGreen} />
                        <Text style={styles.loadingText}>Loading trainers...</Text>
                    </View>
                )}

                {/* Featured Trainers */}
                {!loading && featuredTrainers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Featured Trainers</Text>
                        {featuredTrainers.map((trainer) => (
                            <TouchableOpacity
                                key={trainer.id}
                                style={styles.trainerCard}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('TrainerDetail', { trainerId: trainer.id })}
                            >
                                <Image
                                    source={{ uri: trainer.profile_photo_url || 'https://via.placeholder.com/100' }}
                                    style={styles.trainerPhoto}
                                />
                                <View style={styles.trainerInfo}>
                                    <View style={styles.trainerHeader}>
                                        <Text style={styles.trainerName}>{trainer.full_name}</Text>
                                        <TouchableOpacity style={styles.favoriteButton}>
                                            <Icon
                                                name="heart-outline"
                                                size={20}
                                                color={palette.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.ratingContainer}>
                                        <Icon name="star" size={14} color="#FFD700" />
                                        <Text style={styles.ratingText}>{trainer.rating.toFixed(1)}</Text>
                                    </View>

                                    <View style={styles.specializationsContainer}>
                                        {trainer.specializations.slice(0, 2).map((spec, index) => (
                                            <View key={index} style={styles.specializationBadge}>
                                                <Text style={styles.specializationText}>{spec}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.trainerFooter}>
                                        <View style={styles.experienceContainer}>
                                            <Icon name="shield-check" size={14} color={palette.neonGreen} />
                                            <Text style={styles.experienceText}>{trainer.experience_years} years exp</Text>
                                        </View>
                                        <Text style={styles.priceText}>${trainer.price_per_session}/session</Text>
                                    </View>

                                    <View style={styles.availabilityContainer}>
                                        <Icon
                                            name="circle"
                                            size={8}
                                            color={trainer.availability_status === 'available' ? palette.neonGreen : palette.textSecondary}
                                        />
                                        <Text style={[
                                            styles.availabilityText,
                                            trainer.availability_status === 'available' && styles.availableText
                                        ]}>
                                            {trainer.availability_status === 'available' ? 'Available Now' : 'Busy'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* All Trainers */}
                {!loading && trainers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>All Trainers</Text>
                        {trainers.map((trainer) => (
                            <TouchableOpacity
                                key={trainer.id}
                                style={styles.trainerCard}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('TrainerDetail', { trainerId: trainer.id })}
                            >
                                <Image
                                    source={{ uri: trainer.profile_photo_url || 'https://via.placeholder.com/100' }}
                                    style={styles.trainerPhoto}
                                />
                                <View style={styles.trainerInfo}>
                                    <View style={styles.trainerHeader}>
                                        <Text style={styles.trainerName}>{trainer.full_name}</Text>
                                    </View>

                                    <View style={styles.ratingContainer}>
                                        <Icon name="star" size={14} color="#FFD700" />
                                        <Text style={styles.ratingText}>{trainer.rating.toFixed(1)}</Text>
                                    </View>

                                    <View style={styles.specializationsContainer}>
                                        {trainer.specializations.slice(0, 2).map((spec, index) => (
                                            <View key={index} style={styles.specializationBadge}>
                                                <Text style={styles.specializationText}>{spec}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.trainerFooter}>
                                        <Text style={styles.priceText}>${trainer.price_per_session}/session</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {!loading && trainers.length === 0 && featuredTrainers.length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="account-search" size={64} color={palette.textSecondary} />
                        <Text style={styles.emptyStateTitle}>No Trainers Found</Text>
                        <Text style={styles.emptyStateText}>Try adjusting your filters or search query</Text>
                    </View>
                )}
            </ScrollView>

            {/* Filters Modal */}
            <Modal
                visible={showFiltersModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFiltersModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filters</Text>
                            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                                <Icon name="close" size={24} color={palette.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {/* Specializations */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Specializations</Text>
                                <View style={styles.filterGrid}>
                                    {SPECIALIZATIONS.map((spec) => (
                                        <TouchableOpacity
                                            key={spec}
                                            style={[
                                                styles.filterChip,
                                                selectedSpecializations.includes(spec) && styles.filterChipActive,
                                            ]}
                                            onPress={() => toggleSpecialization(spec)}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    selectedSpecializations.includes(spec) && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {spec}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Experience */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Experience</Text>
                                <View style={styles.filterGrid}>
                                    {EXPERIENCE_LEVELS.map((exp) => (
                                        <TouchableOpacity
                                            key={exp}
                                            style={[
                                                styles.filterChip,
                                                selectedExperience === exp && styles.filterChipActive,
                                            ]}
                                            onPress={() => setSelectedExperience(exp === selectedExperience ? '' : exp)}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    selectedExperience === exp && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {exp}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Price Range */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Price Range</Text>
                                <View style={styles.filterGrid}>
                                    {PRICE_RANGES.map((price) => (
                                        <TouchableOpacity
                                            key={price}
                                            style={[
                                                styles.filterChip,
                                                selectedPrice === price && styles.filterChipActive,
                                            ]}
                                            onPress={() => setSelectedPrice(price === selectedPrice ? '' : price)}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    selectedPrice === price && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {price}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Rating */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                                <View style={styles.filterGrid}>
                                    {RATINGS.map((rating) => (
                                        <TouchableOpacity
                                            key={rating}
                                            style={[
                                                styles.filterChip,
                                                selectedRating === rating && styles.filterChipActive,
                                            ]}
                                            onPress={() => setSelectedRating(rating === selectedRating ? '' : rating)}
                                        >
                                            <Icon name="star" size={14} color={selectedRating === rating ? palette.background : palette.textSecondary} />
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    selectedRating === rating && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {rating}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Availability */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Availability</Text>
                                <View style={styles.filterGrid}>
                                    {AVAILABILITY.map((avail) => (
                                        <TouchableOpacity
                                            key={avail}
                                            style={[
                                                styles.filterChip,
                                                selectedAvailability === avail && styles.filterChipActive,
                                            ]}
                                            onPress={() => setSelectedAvailability(avail === selectedAvailability ? '' : avail)}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    selectedAvailability === avail && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {avail}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearAllFilters}
                            >
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setShowFiltersModal(false)}
                            >
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.applyButtonGradient}
                                >
                                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}; const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: palette.textPrimary,
        fontSize: 15,
        paddingVertical: 8,
    },
    filterButton: {
        width: 50,
        height: 50,
        backgroundColor: palette.surface,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: palette.neonGreen,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        color: palette.background,
        fontSize: 10,
        fontWeight: '700',
    },
    section: {
        paddingTop: spacing.md,
    },
    sectionTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    myTrainerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.md,
        backgroundColor: 'rgba(197, 255, 74, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.neonGreen + '40',
    },
    myTrainerPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: palette.border,
    },
    myTrainerInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    myTrainerName: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    myTrainerSpecialization: {
        color: palette.textSecondary,
        fontSize: 13,
        marginBottom: 6,
    },
    nextSessionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nextSessionText: {
        color: palette.neonGreen,
        fontSize: 13,
        fontWeight: '600',
    },
    messageButton: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(197, 255, 74, 0.2)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trainerCard: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
    },
    trainerPhoto: {
        width: 120,
        height: '100%',
        backgroundColor: palette.border,
    },
    trainerInfo: {
        flex: 1,
        padding: spacing.md,
    },
    trainerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    trainerName: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    favoriteButton: {
        padding: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 4,
    },
    ratingText: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    reviewsText: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    specializationsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    specializationTag: {
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    specializationText: {
        color: palette.neonGreen,
        fontSize: 11,
        fontWeight: '600',
    },
    trainerMetaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 10,
    },
    trainerMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trainerMetaText: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 6,
    },
    availabilityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: palette.neonGreen,
    },
    availabilityText: {
        color: palette.neonGreen,
        fontSize: 13,
        fontWeight: '600',
    },
    trainerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    bookButton: {
        flex: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    bookButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    bookButtonText: {
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    messageIconButton: {
        width: 42,
        height: 42,
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: palette.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    modalTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 22,
        fontWeight: '700',
    },
    modalContent: {
        padding: spacing.lg,
    },
    filterSection: {
        marginBottom: spacing.xl,
    },
    filterSectionTitle: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    filterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.border,
        gap: 4,
    },
    filterChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    filterChipText: {
        color: palette.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: palette.background,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    clearButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: palette.surface,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButtonText: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    applyButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    applyButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        color: palette.background,
        fontSize: 15,
        fontWeight: '700',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        marginTop: spacing.xxl,
    },
    loadingText: {
        color: palette.textSecondary,
        fontSize: 14,
        marginTop: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xxl,
    },
    emptyStateTitle: {
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginTop: spacing.md,
    },
    emptyStateText: {
        color: palette.textSecondary,
        fontSize: 14,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    specializationBadge: {
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    experienceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    experienceText: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    priceText: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    trainerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    availableText: {
        color: palette.neonGreen,
    },
});
