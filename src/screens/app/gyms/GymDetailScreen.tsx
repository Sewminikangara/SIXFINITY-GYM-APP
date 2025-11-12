import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Linking,
    Alert,
    Modal,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import {
    getGymDetails,
    getEquipmentStatus,
    getTrainers,
    getClasses,
    getReviews,
    type Gym,
    type Equipment as GymEquipment,
    type Trainer as GymTrainer,
    type Class as DatabaseClass,
    type Review as DatabaseReview,
} from '@/services/gymService';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<AppStackParamList, 'GymDetail'>;

// Local Equipment data structure (enhanced with UI-specific fields)
interface Equipment extends GymEquipment {
    image?: string;
    count?: number;
    specifications?: string;
    instructions?: string;
}

// Local Trainer data structure (same as database)
interface Trainer extends GymTrainer { }

// Local Class schedule data structure (enhanced with UI-specific fields)
interface GymClass extends DatabaseClass { }

// Local Review data structure (enhanced with UI-specific fields)
interface Review extends DatabaseReview {
    wasHelpful?: boolean;
}

export const GymDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { gymId } = route.params;
    const [gym, setGym] = useState<Gym | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isSaved, setIsSaved] = useState(false);
    const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
    const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>('All');
    const [selectedClassType, setSelectedClassType] = useState<string>('All');

    // Database-driven state
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [classes, setClasses] = useState<GymClass[]>([]);

    // Loading states
    const [loadingGym, setLoadingGym] = useState(true);
    const [loadingEquipment, setLoadingEquipment] = useState(true);
    const [loadingTrainers, setLoadingTrainers] = useState(true);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingReviews, setLoadingReviews] = useState(true);

    // Error state
    const [gymError, setGymError] = useState<string | null>(null);

    useEffect(() => {
        loadGymDetails();
        loadEquipment();
        loadTrainers();
        loadClasses();
        loadReviews();
    }, [gymId]);

    const loadGymDetails = async () => {
        try {
            setLoadingGym(true);
            setGymError(null);
            const { data, error } = await getGymDetails(gymId);

            if (error) {
                console.error('Error loading gym details:', error);
                setGymError(error.message);
                Alert.alert('Error', 'Failed to load gym details. Please try again.');
            } else if (data) {
                setGym(data);
            } else {
                setGymError('Gym not found');
                Alert.alert('Error', 'Gym not found.');
            }
        } catch (error) {
            console.error('Unexpected error loading gym details:', error);
            setGymError('An unexpected error occurred');
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoadingGym(false);
        }
    };

    const loadEquipment = async () => {
        try {
            setLoadingEquipment(true);
            const { data, error } = await getEquipmentStatus(gymId);

            if (error) {
                console.error('Error loading equipment:', error);
                setEquipment([]);
            } else {
                setEquipment(data || []);
            }
        } catch (error) {
            console.error('Unexpected error loading equipment:', error);
            setEquipment([]);
        } finally {
            setLoadingEquipment(false);
        }
    };

    const loadTrainers = async () => {
        try {
            setLoadingTrainers(true);
            const { data, error } = await getTrainers(gymId);

            if (error) {
                console.error('Error loading trainers:', error);
                setTrainers([]);
            } else {
                setTrainers(data || []);
            }
        } catch (error) {
            console.error('Unexpected error loading trainers:', error);
            setTrainers([]);
        } finally {
            setLoadingTrainers(false);
        }
    };

    const loadClasses = async () => {
        try {
            setLoadingClasses(true);
            const { data, error } = await getClasses(gymId);

            if (error) {
                console.error('Error loading classes:', error);
                setClasses([]);
            } else {
                setClasses(data || []);
            }
        } catch (error) {
            console.error('Unexpected error loading classes:', error);
            setClasses([]);
        } finally {
            setLoadingClasses(false);
        }
    };

    const loadReviews = async () => {
        try {
            setLoadingReviews(true);
            const { data, error } = await getReviews(gymId);

            if (error) {
                console.error('Error loading reviews:', error);
                setReviews([]);
            } else {
                const enhancedReviews: Review[] = (data || []).map(review => ({
                    ...review,
                    wasHelpful: false,
                }));
                setReviews(enhancedReviews);
            }
        } catch (error) {
            console.error('Unexpected error loading reviews:', error);
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    const categories = ['All', 'Cardio', 'Strength', 'Free Weights', 'Functional', 'Other'];

    const filteredEquipment =
        selectedCategory === 'All'
            ? equipment
            : equipment.filter((eq) => eq.category === selectedCategory);

    const renderStars = (rating: number) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
                        size={16}
                        color="#FFD700"
                    />
                ))}
            </View>
        );
    };

    // Calculate rating breakdown
    const getRatingBreakdown = () => {
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((review) => {
            const rating = Math.floor(review.rating);
            breakdown[rating as keyof typeof breakdown]++;
        });
        return breakdown;
    };

    const handleHelpful = (reviewId: string) => {
        setReviews(
            reviews.map((review) =>
                review.id === reviewId
                    ? {
                        ...review,
                        wasHelpful: !review.wasHelpful,
                        helpfulCount: review.wasHelpful
                            ? review.helpfulCount - 1
                            : review.helpfulCount + 1,
                    }
                    : review
            )
        );
    };

    const handleCall = () => {
        if (gym?.phoneNumber) {
            Linking.openURL(`tel:${gym.phoneNumber}`);
        }
    };

    const handleWebsite = () => {
        if (gym?.website) {
            Linking.openURL(gym.website);
        }
    };

    const handleBookSession = () => {
        Alert.alert('Book Session', 'This feature will allow you to book a training session.');
    };

    const handleSaveGym = () => {
        setIsSaved(!isSaved);
        Alert.alert(
            isSaved ? 'Gym Removed' : 'Gym Saved',
            isSaved ? 'Gym removed from your saved gyms.' : 'Gym added to your saved gyms!'
        );
    };

    const handleBookTrainer = (trainer: Trainer) => {
        Alert.alert('Book Trainer', `Book a session with ${trainer.name}?`);
    };

    const handleBookClass = (gymClass: GymClass) => {
        Alert.alert('Book Class', `Book a spot in ${gymClass.name}?`);
    };

    const handleAddReview = () => {
        Alert.alert('Add Review', 'This feature will allow you to add a review.');
    };

    if (!gym) {
        return (
            <Screen>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading gym details...</Text>
                </View>
            </Screen>
        );
    }

    const images = gym.images && gym.images.length > 0 ? gym.images : [gym.image];

    return (
        <Screen>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Photo Gallery */}
                <View style={styles.galleryContainer}>
                    <FlatList
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    setFullscreenImageIndex(index);
                                    setShowFullscreenGallery(true);
                                }}
                            >
                                <Image source={{ uri: item }} style={styles.galleryImage} />
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => `image-${index}`}
                    />

                    {/* Image Counter & View All Button */}
                    <View style={styles.galleryOverlay}>
                        <View style={styles.imageCounter}>
                            <Ionicons name="images" size={16} color="#fff" />
                            <Text style={styles.imageCounterText}>
                                {activeImageIndex + 1} / {images.length}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => {
                                setFullscreenImageIndex(activeImageIndex);
                                setShowFullscreenGallery(true);
                            }}
                        >
                            <Ionicons name="expand" size={16} color="#fff" />
                            <Text style={styles.viewAllButtonText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Pagination Dots */}
                    <View style={styles.imageIndicatorContainer}>
                        {images.map((_, index) => (
                            <View
                                key={index}
                                style={[styles.imageIndicator, activeImageIndex === index && styles.activeIndicator]}
                            />
                        ))}
                    </View>
                </View>

                {/* Gym Information */}
                <View style={styles.infoCard}>
                    <View style={styles.headerRow}>
                        <Text style={styles.gymName}>{gym.name}</Text>
                        <TouchableOpacity onPress={handleSaveGym} style={styles.saveButton}>
                            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={28} color="#00FF7F" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.ratingRow}>
                        {renderStars(gym.rating)}
                        <Text style={styles.ratingText}>
                            {gym.rating} ({gym.reviewCount} reviews)
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="location" size={20} color="#00FF7F" />
                        <Text style={styles.infoText}>{gym.location.address}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={20} color="#00FF7F" />
                        <Text style={styles.infoText}>{gym.openingHours}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="cash" size={20} color="#00FF7F" />
                        <Text style={styles.infoText}>
                            {gym.priceRange} • ${gym.pricePerMonth}/month
                        </Text>
                    </View>

                    <View style={styles.contactRow}>
                        <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                            <Ionicons name="call" size={20} color="#fff" />
                            <Text style={styles.contactButtonText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactButton} onPress={handleWebsite}>
                            <Ionicons name="globe" size={20} color="#fff" />
                            <Text style={styles.contactButtonText}>Website</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.descriptionText}>{gym.description}</Text>
                </View>

                {/* Facilities */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Facilities</Text>
                    <View style={styles.facilitiesGrid}>
                        {gym.facilities.map((facility, index) => (
                            <View key={index} style={styles.facilityItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#00FF7F" />
                                <Text style={styles.facilityText}>{facility}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Equipment Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Equipment Available</Text>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => navigation.navigate('LiveStatus' as any)}
                        >
                            <Text style={styles.viewAllButtonText}>Live Status</Text>
                            <Ionicons name="chevron-forward" size={16} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>

                    {/* Category Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                    >
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category && styles.activeCategoryChip,
                                ]}
                                onPress={() => setSelectedCategory(category)}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategory === category && styles.activeCategoryChipText,
                                    ]}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Equipment List - Enhanced Design */}
                    {filteredEquipment.length > 0 ? (
                        filteredEquipment.map((equipment) => (
                            <View key={equipment.id} style={styles.equipmentCard}>
                                <Image
                                    source={{ uri: equipment.image }}
                                    style={styles.equipmentImage}
                                />
                                <View style={styles.equipmentContent}>
                                    <View style={styles.equipmentHeader}>
                                        <View style={styles.equipmentTitleRow}>
                                            <Text style={styles.equipmentName}>{equipment.name}</Text>
                                            <View style={styles.equipmentBadge}>
                                                <Text style={styles.equipmentBadgeText}>{equipment.category}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.equipmentCountRow}>
                                            <Ionicons
                                                name={equipment.count > 0 ? "checkmark-circle" : "close-circle"}
                                                size={18}
                                                color={equipment.count > 0 ? palette.neonGreen : "#FF6B6B"}
                                            />
                                            <Text style={[
                                                styles.equipmentCountText,
                                                equipment.count === 0 && styles.equipmentCountTextUnavailable
                                            ]}>
                                                {equipment.count > 0
                                                    ? `${equipment.count} Available`
                                                    : 'All in use'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Specifications */}
                                    <View style={styles.equipmentDetailsSection}>
                                        <Text style={styles.equipmentSectionLabel}>Specifications</Text>
                                        <Text style={styles.equipmentSpecs}>{equipment.specifications}</Text>
                                    </View>

                                    {/* Usage Instructions */}
                                    <View style={styles.equipmentDetailsSection}>
                                        <Text style={styles.equipmentSectionLabel}>How to Use</Text>
                                        <Text style={styles.equipmentInstructions}>{equipment.instructions}</Text>
                                    </View>

                                    {/* Action Button */}
                                    <TouchableOpacity
                                        style={styles.equipmentActionButton}
                                        onPress={() => navigation.navigate('LiveStatus' as any)}
                                    >
                                        <Ionicons name="pulse" size={18} color={palette.neonGreen} />
                                        <Text style={styles.equipmentActionButtonText}>View Live Status</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons name="fitness-outline" size={48} color={palette.textSecondary} />
                            <Text style={styles.emptyStateText}>
                                No {selectedCategory.toLowerCase()} equipment available
                            </Text>
                        </View>
                    )}
                </View>

                {/* Trainers Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Personal Trainers</Text>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => navigation.navigate('Trainers' as any)}>
                            <Text style={styles.viewAllButtonText}>View All</Text>
                            <Ionicons name="chevron-forward" size={16} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>

                    {loadingTrainers ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={palette.neonGreen} />
                            <Text style={styles.loadingText}>Loading trainers...</Text>
                        </View>
                    ) : trainers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={palette.textSecondary} />
                            <Text style={styles.emptyText}>No trainers available at this gym</Text>
                        </View>
                    ) : trainers.map((trainer) => (
                        <TouchableOpacity
                            key={trainer.id}
                            style={styles.trainerCardEnhanced}
                            onPress={() => navigation.navigate('TrainerDetail' as any, { trainerId: trainer.id })}
                        >
                            {/* Trainer Photo */}
                            <Image source={{ uri: trainer.photo }} style={styles.trainerPhotoLarge} />

                            <View style={styles.trainerContentEnhanced}>
                                {/* Name and Rating Row */}
                                <View style={styles.trainerHeaderRow}>
                                    <Text style={styles.trainerNameEnhanced}>{trainer.name}</Text>
                                    <View style={styles.trainerRatingRow}>
                                        <Ionicons name="star" size={16} color="#FFD700" />
                                        <Text style={styles.trainerRatingText}>{trainer.rating}</Text>
                                    </View>
                                </View>

                                {/* Expertise Tags */}
                                <View style={styles.expertiseContainerEnhanced}>
                                    {trainer.expertise.map((exp, index) => (
                                        <View key={index} style={styles.expertiseTagEnhanced}>
                                            <Ionicons name="checkmark-circle" size={12} color={palette.neonGreen} />
                                            <Text style={styles.expertiseTextEnhanced}>{exp}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Price and Experience Row */}
                                <View style={styles.trainerMetaRow}>
                                    <View style={styles.trainerMetaItem}>
                                        <Ionicons name="cash-outline" size={16} color={palette.neonGreen} />
                                        <Text style={styles.trainerPriceEnhanced}>${trainer.pricePerSession}/session</Text>
                                    </View>
                                    <View style={styles.trainerMetaItem}>
                                        <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
                                        <Text style={styles.trainerExperienceText}>5+ years exp</Text>
                                    </View>
                                </View>

                                {/* Book Session Button */}
                                <TouchableOpacity
                                    style={styles.bookSessionButton}
                                    onPress={() => handleBookTrainer(trainer)}
                                >
                                    <Ionicons name="calendar-outline" size={18} color="#000" />
                                    <Text style={styles.bookSessionButtonText}>Book Session</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* View All Trainers Link */}
                    <TouchableOpacity
                        style={styles.viewAllTrainersButton}
                        onPress={() => navigation.navigate('Trainers' as any)}
                    >
                        <Text style={styles.viewAllTrainersText}>View All Trainers</Text>
                        <Ionicons name="arrow-forward" size={18} color={palette.neonGreen} />
                    </TouchableOpacity>
                </View>

                {/* Workout Types Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Workout Types</Text>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => Alert.alert('Coming Soon', 'All workout types coming soon!')}>
                            <Text style={styles.viewAllButtonText}>View All</Text>
                            <Ionicons name="chevron-forward" size={16} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.workoutTypesSubtitle}>
                        Explore the variety of workouts available at this gym
                    </Text>

                    <View style={styles.workoutTypesGrid}>
                        {/* Yoga */}
                        <TouchableOpacity
                            style={styles.workoutTypeCard}
                            onPress={() => Alert.alert('Yoga', 'View yoga class schedule')}>
                            <View style={[styles.workoutTypeIconContainer, { backgroundColor: 'rgba(186, 104, 200, 0.15)' }]}>
                                <Ionicons name="leaf" size={32} color="#BA68C8" />
                            </View>
                            <Text style={styles.workoutTypeName}>Yoga</Text>
                            <Text style={styles.workoutTypeDescription}>Mind & body balance</Text>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>60 min</Text>
                            </View>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="people-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>3 classes/week</Text>
                            </View>
                        </TouchableOpacity>

                        {/* HIIT */}
                        <TouchableOpacity
                            style={styles.workoutTypeCard}
                            onPress={() => Alert.alert('HIIT', 'View HIIT class schedule')}>
                            <View style={[styles.workoutTypeIconContainer, { backgroundColor: 'rgba(239, 83, 80, 0.15)' }]}>
                                <Ionicons name="flame" size={32} color="#EF5350" />
                            </View>
                            <Text style={styles.workoutTypeName}>HIIT</Text>
                            <Text style={styles.workoutTypeDescription}>High intensity training</Text>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>45 min</Text>
                            </View>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="people-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>2 classes/week</Text>
                            </View>
                        </TouchableOpacity>

                        {/* CrossFit */}
                        <TouchableOpacity
                            style={styles.workoutTypeCard}
                            onPress={() => Alert.alert('CrossFit', 'View CrossFit class schedule')}>
                            <View style={[styles.workoutTypeIconContainer, { backgroundColor: 'rgba(0, 255, 127, 0.15)' }]}>
                                <Ionicons name="barbell" size={32} color={palette.neonGreen} />
                            </View>
                            <Text style={styles.workoutTypeName}>CrossFit</Text>
                            <Text style={styles.workoutTypeDescription}>Functional fitness</Text>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>60 min</Text>
                            </View>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="people-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>3 classes/week</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Pilates */}
                        <TouchableOpacity
                            style={styles.workoutTypeCard}
                            onPress={() => Alert.alert('Pilates', 'View Pilates class schedule')}>
                            <View style={[styles.workoutTypeIconContainer, { backgroundColor: 'rgba(129, 199, 132, 0.15)' }]}>
                                <Ionicons name="fitness" size={32} color="#81C784" />
                            </View>
                            <Text style={styles.workoutTypeName}>Pilates</Text>
                            <Text style={styles.workoutTypeDescription}>Core strength</Text>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>50 min</Text>
                            </View>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="people-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>2 classes/week</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Zumba */}
                        <TouchableOpacity
                            style={styles.workoutTypeCard}
                            onPress={() => Alert.alert('Zumba', 'View Zumba class schedule')}>
                            <View style={[styles.workoutTypeIconContainer, { backgroundColor: 'rgba(255, 179, 71, 0.15)' }]}>
                                <Ionicons name="musical-notes" size={32} color="#FFB347" />
                            </View>
                            <Text style={styles.workoutTypeName}>Zumba</Text>
                            <Text style={styles.workoutTypeDescription}>Dance fitness</Text>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>55 min</Text>
                            </View>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="people-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>2 classes/week</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Spin */}
                        <TouchableOpacity
                            style={styles.workoutTypeCard}
                            onPress={() => Alert.alert('Spin', 'View Spin class schedule')}>
                            <View style={[styles.workoutTypeIconContainer, { backgroundColor: 'rgba(66, 165, 245, 0.15)' }]}>
                                <Ionicons name="bicycle" size={32} color="#42A5F5" />
                            </View>
                            <Text style={styles.workoutTypeName}>Spin</Text>
                            <Text style={styles.workoutTypeDescription}>Indoor cycling</Text>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>45 min</Text>
                            </View>
                            <View style={styles.workoutTypeMetaRow}>
                                <Ionicons name="people-outline" size={14} color={palette.textSecondary} />
                                <Text style={styles.workoutTypeMetaText}>3 classes/week</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Browse All Link */}
                    <TouchableOpacity
                        style={styles.browseAllWorkoutsButton}
                        onPress={() => Alert.alert('Coming Soon', 'Full workout types catalog coming soon!')}>
                        <Text style={styles.browseAllWorkoutsText}>Browse All Workout Types</Text>
                        <Ionicons name="grid-outline" size={18} color={palette.neonGreen} />
                    </TouchableOpacity>
                </View>

                {/* Class Schedule */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Class Schedule</Text>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => Alert.alert('Coming Soon', 'Full class schedule view coming soon!')}>
                            <Text style={styles.viewAllButtonText}>View All</Text>
                            <Ionicons name="chevron-forward" size={16} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>

                    {/* Day Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.classFiltersRow}
                    >
                        {['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.classDayChip,
                                    selectedDay === day && styles.classDayChipActive
                                ]}
                                onPress={() => setSelectedDay(day)}
                            >
                                <Text style={[
                                    styles.classDayChipText,
                                    selectedDay === day && styles.classDayChipTextActive
                                ]}>
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Class Type Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.classFiltersRow}
                    >
                        {['All', 'Yoga', 'HIIT', 'CrossFit', 'Pilates', 'Zumba', 'Spin'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.classTypeChip,
                                    selectedClassType === type && styles.classTypeChipActive
                                ]}
                                onPress={() => setSelectedClassType(type)}
                            >
                                <Text style={[
                                    styles.classTypeChipText,
                                    selectedClassType === type && styles.classTypeChipTextActive
                                ]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Class Cards */}
                    {loadingClasses ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={palette.neonGreen} />
                            <Text style={styles.loadingText}>Loading classes...</Text>
                        </View>
                    ) : classes.length === 0 ? (
                        <View style={styles.loadingContainer}>
                            <Ionicons name="calendar-outline" size={48} color={palette.textSecondary} />
                            <Text style={styles.loadingText}>No classes available at this gym</Text>
                        </View>
                    ) : classes.map((gymClass) => {
                        // Calculate available spots
                        const bookedSpots = Math.floor(Math.random() * gymClass.capacity);
                        const availableSpots = gymClass.capacity - bookedSpots;
                        const isAlmostFull = availableSpots <= 3;
                        const isFull = availableSpots === 0;

                        return (
                            <View key={gymClass.id} style={styles.classCardEnhanced}>
                                {/* Class Header */}
                                <View style={styles.classHeaderEnhanced}>
                                    <View style={styles.classMainInfo}>
                                        <Text style={styles.classNameEnhanced}>{gymClass.name}</Text>
                                        <View style={styles.classTypeTagEnhanced}>
                                            <Ionicons name="fitness" size={12} color="#000" />
                                            <Text style={styles.classTypeTextEnhanced}>{gymClass.type}</Text>
                                        </View>
                                    </View>

                                    {/* Availability Badge */}
                                    <View style={[
                                        styles.availabilityBadge,
                                        isFull && styles.availabilityBadgeFull,
                                        isAlmostFull && !isFull && styles.availabilityBadgeAlmostFull
                                    ]}>
                                        <Text style={[
                                            styles.availabilityBadgeText,
                                            isFull && styles.availabilityBadgeTextFull
                                        ]}>
                                            {isFull ? 'Full' : `${availableSpots} spots`}
                                        </Text>
                                    </View>
                                </View>

                                {/* Instructor Info */}
                                <View style={styles.classInstructorRow}>
                                    <Ionicons name="person-circle-outline" size={18} color={palette.textSecondary} />
                                    <Text style={styles.classInstructorEnhanced}>{gymClass.instructor}</Text>
                                </View>

                                {/* Duration & Capacity */}
                                <View style={styles.classMetaRow}>
                                    <View style={styles.classMetaItem}>
                                        <Ionicons name="time-outline" size={16} color={palette.neonGreen} />
                                        <Text style={styles.classMetaText}>{gymClass.duration}</Text>
                                    </View>
                                    <View style={styles.classMetaItem}>
                                        <Ionicons name="people-outline" size={16} color={palette.neonGreen} />
                                        <Text style={styles.classMetaText}>{bookedSpots}/{gymClass.capacity}</Text>
                                    </View>
                                </View>

                                {/* Schedule Times */}
                                <View style={styles.scheduleTimesContainer}>
                                    {gymClass.schedule.map((time, index) => (
                                        <View key={index} style={styles.scheduleTimeChip}>
                                            <Ionicons name="calendar-outline" size={12} color={palette.neonGreen} />
                                            <Text style={styles.scheduleTimeText}>{time}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Book Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.bookClassButtonEnhanced,
                                        isFull && styles.bookClassButtonDisabled
                                    ]}
                                    onPress={() => handleBookClass(gymClass)}
                                    disabled={isFull}
                                >
                                    <Ionicons
                                        name={isFull ? "lock-closed" : "checkmark-circle"}
                                        size={18}
                                        color={isFull ? palette.textSecondary : "#000"}
                                    />
                                    <Text style={[
                                        styles.bookClassButtonTextEnhanced,
                                        isFull && styles.bookClassButtonTextDisabled
                                    ]}>
                                        {isFull ? 'Class Full' : 'Book Class'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    {/* View Full Schedule Link */}
                    <TouchableOpacity
                        style={styles.viewFullScheduleButton}
                        onPress={() => Alert.alert('Coming Soon', 'Full weekly schedule view coming soon!')}
                    >
                        <Ionicons name="calendar" size={18} color={palette.neonGreen} />
                        <Text style={styles.viewFullScheduleText}>View Full Weekly Schedule</Text>
                        <Ionicons name="arrow-forward" size={18} color={palette.neonGreen} />
                    </TouchableOpacity>
                </View>

                {/* Reviews Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.reviewsHeader}>
                        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
                        <TouchableOpacity
                            style={styles.writeReviewButton}
                            onPress={handleAddReview}
                        >
                            <Ionicons name="create-outline" size={18} color={palette.neonGreen} />
                            <Text style={styles.writeReviewText}>Write Review</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Overall Rating Summary */}
                    {gym && (
                        <View style={styles.ratingOverview}>
                            <View style={styles.ratingOverviewLeft}>
                                <Text style={styles.overallRatingNumber}>{gym.rating.toFixed(1)}</Text>
                                {renderStars(gym.rating)}
                                <Text style={styles.totalReviewsText}>
                                    Based on {reviews.length} reviews
                                </Text>
                            </View>

                            {/* Rating Breakdown */}
                            <View style={styles.ratingBreakdown}>
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const breakdown = getRatingBreakdown();
                                    const count = breakdown[star as keyof typeof breakdown];
                                    const percentage = reviews.length > 0
                                        ? (count / reviews.length) * 100
                                        : 0;

                                    return (
                                        <View key={star} style={styles.breakdownRatingRow}>
                                            <Text style={styles.ratingLabel}>{star}★</Text>
                                            <View style={styles.ratingBarContainer}>
                                                <View
                                                    style={[
                                                        styles.ratingBar,
                                                        { width: `${percentage}%` }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.ratingCount}>{count}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Review List */}
                    {reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Image source={{ uri: review.userPhoto }} style={styles.reviewUserPhoto} />
                                <View style={styles.reviewUserInfo}>
                                    <Text style={styles.reviewUserName}>{review.userName}</Text>
                                    <View style={styles.reviewRatingRow}>
                                        {renderStars(review.rating)}
                                        <Text style={styles.reviewDate}>• {review.date}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.reviewComment}>{review.comment}</Text>

                            {/* Review Photos */}
                            {review.photos && review.photos.length > 0 && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.reviewPhotosContainer}
                                >
                                    {review.photos.map((photo, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: photo }}
                                            style={styles.reviewPhoto}
                                        />
                                    ))}
                                </ScrollView>
                            )}

                            {/* Helpful Button */}
                            <TouchableOpacity
                                style={[
                                    styles.helpfulButton,
                                    review.wasHelpful && styles.helpfulButtonActive
                                ]}
                                onPress={() => handleHelpful(review.id)}
                            >
                                <Ionicons
                                    name={review.wasHelpful ? "thumbs-up" : "thumbs-up-outline"}
                                    size={16}
                                    color={review.wasHelpful ? palette.neonGreen : palette.textSecondary}
                                />
                                <Text style={[
                                    styles.helpfulButtonText,
                                    review.wasHelpful && styles.helpfulButtonTextActive
                                ]}>
                                    Helpful ({review.helpfulCount})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleBookSession}>
                        <Text style={styles.primaryButtonText}>Book Session</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Fullscreen Photo Gallery Modal */}
            <Modal
                visible={showFullscreenGallery}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setShowFullscreenGallery(false)}
            >
                <View style={styles.fullscreenContainer}>
                    <StatusBar barStyle="light-content" backgroundColor="#000" />

                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowFullscreenGallery(false)}
                    >
                        <Ionicons name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    {/* Image Counter */}
                    <View style={styles.fullscreenCounter}>
                        <Text style={styles.fullscreenCounterText}>
                            {fullscreenImageIndex + 1} / {images.length}
                        </Text>
                    </View>

                    {/* Fullscreen Image Gallery */}
                    <FlatList
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        initialScrollIndex={fullscreenImageIndex}
                        onScrollToIndexFailed={() => { }}
                        getItemLayout={(data, index) => ({
                            length: width,
                            offset: width * index,
                            index,
                        })}
                        onScroll={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setFullscreenImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => (
                            <View style={styles.fullscreenImageContainer}>
                                <Image
                                    source={{ uri: item }}
                                    style={styles.fullscreenImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                        keyExtractor={(item, index) => `fullscreen-${index}`}
                    />

                    {/* Thumbnail Strip */}
                    <View style={styles.thumbnailStrip}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailContent}
                        >
                            {images.map((image, index) => (
                                <TouchableOpacity
                                    key={`thumb-${index}`}
                                    onPress={() => setFullscreenImageIndex(index)}
                                    style={[
                                        styles.thumbnail,
                                        fullscreenImageIndex === index && styles.activeThumbnail,
                                    ]}
                                >
                                    <Image
                                        source={{ uri: image }}
                                        style={styles.thumbnailImage}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
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
    galleryContainer: {
        height: 300,
        position: 'relative',
    },
    galleryImage: {
        width: width,
        height: 300,
        resizeMode: 'cover',
    },
    imageIndicatorContainer: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 4,
    },
    activeIndicator: {
        backgroundColor: '#00FF7F',
        width: 24,
    },
    galleryOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    imageCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radii.sm,
        gap: 6,
    },
    imageCounterText: {
        ...typography.caption,
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 127, 0.9)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radii.sm,
        gap: 4,
    },
    viewAllButtonText: {
        ...typography.caption,
        color: '#000',
        fontWeight: '700',
        fontSize: 12,
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 10,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenCounter: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
    },
    fullscreenCounterText: {
        ...typography.body,
        color: '#fff',
        fontWeight: '600',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.sm,
    },
    fullscreenImageContainer: {
        width: width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: width,
        height: '100%',
    },
    thumbnailStrip: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingVertical: spacing.sm,
    },
    thumbnailContent: {
        paddingHorizontal: spacing.sm,
        gap: spacing.xs,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: radii.sm,
        marginRight: spacing.xs,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    activeThumbnail: {
        borderColor: palette.neonGreen,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    infoCard: {
        backgroundColor: '#1E1E1E',
        marginHorizontal: spacing.md,
        marginTop: -30,
        borderRadius: radii.lg,
        padding: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    gymName: {
        ...typography.heading2,
        color: palette.textPrimary,
        flex: 1,
    },
    saveButton: {
        marginLeft: spacing.sm,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: spacing.sm,
    },
    ratingText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    infoText: {
        ...typography.body,
        color: palette.textPrimary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    contactRow: {
        flexDirection: 'row',
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00FF7F',
        padding: spacing.sm,
        borderRadius: radii.md,
        gap: spacing.xs,
    },
    contactButtonText: {
        ...typography.bodyBold,
        color: '#000',
    },
    sectionCard: {
        backgroundColor: '#1E1E1E',
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: radii.lg,
        padding: spacing.lg,
    },
    sectionTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    descriptionText: {
        ...typography.body,
        color: palette.textSecondary,
        lineHeight: 22,
    },
    facilitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    facilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        marginBottom: spacing.sm,
    },
    facilityText: {
        ...typography.body,
        color: palette.textPrimary,
        marginLeft: spacing.xs,
    },
    categoryScroll: {
        marginBottom: spacing.md,
    },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.round,
        backgroundColor: '#2A2A2A',
        marginRight: spacing.sm,
    },
    activeCategoryChip: {
        backgroundColor: '#00FF7F',
    },
    categoryChipText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    activeCategoryChipText: {
        color: '#000',
        fontWeight: '600',
    },
    equipmentCard: {
        flexDirection: 'column',
        backgroundColor: '#2A2A2A',
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    equipmentImage: {
        width: '100%',
        height: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    equipmentContent: {
        padding: spacing.lg,
    },
    equipmentHeader: {
        marginBottom: spacing.md,
    },
    equipmentTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    equipmentName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    equipmentBadge: {
        backgroundColor: 'rgba(0, 255, 127, 0.15)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
        marginLeft: spacing.sm,
    },
    equipmentBadgeText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 11,
        fontWeight: '600',
    },
    equipmentCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    equipmentCountText: {
        ...typography.body,
        color: palette.neonGreen,
        fontSize: 14,
        fontWeight: '500',
    },
    equipmentCountTextUnavailable: {
        color: '#FF6B6B',
    },
    equipmentDetailsSection: {
        marginBottom: spacing.md,
    },
    equipmentSectionLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    equipmentSpecs: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        lineHeight: 20,
    },
    equipmentInstructions: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    equipmentActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 255, 127, 0.1)',
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        marginTop: spacing.sm,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 127, 0.3)',
    },
    equipmentActionButtonText: {
        ...typography.bodyBold,
        color: palette.neonGreen,
        fontSize: 15,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyStateText: {
        ...typography.body,
        color: palette.textSecondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    trainerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        borderRadius: radii.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    trainerPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    trainerInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    trainerName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: 4,
    },
    expertiseContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    expertiseTag: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radii.sm,
    },
    expertiseText: {
        ...typography.caption,
        color: '#00FF7F',
        fontSize: 10,
    },
    trainerPrice: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    bookButton: {
        backgroundColor: '#00FF7F',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
    },
    bookButtonText: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 14,
    },
    classCard: {
        backgroundColor: '#2A2A2A',
        borderRadius: radii.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    className: {
        ...typography.subtitle,
        color: palette.textPrimary,
    },
    classTypeTag: {
        backgroundColor: '#00FF7F',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    classTypeText: {
        ...typography.caption,
        color: '#000',
        fontWeight: '600',
    },
    classInstructor: {
        ...typography.body,
        color: palette.textSecondary,
        marginBottom: 4,
    },
    classDuration: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: spacing.sm,
    },
    scheduleContainer: {
        marginBottom: spacing.sm,
    },
    scheduleTime: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 12,
        marginBottom: 2,
    },
    bookClassButton: {
        backgroundColor: '#00FF7F',
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    addReviewText: {
        ...typography.bodyBold,
        color: '#00FF7F',
        fontSize: 14,
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 127, 0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        gap: spacing.xs,
    },
    writeReviewText: {
        ...typography.bodyBold,
        color: palette.neonGreen,
        fontSize: 14,
    },
    ratingOverview: {
        flexDirection: 'row',
        backgroundColor: '#2A2A2A',
        borderRadius: radii.md,
        padding: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.lg,
    },
    ratingOverviewLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: spacing.lg,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.1)',
    },
    overallRatingNumber: {
        fontSize: 48,
        fontWeight: '700',
        color: palette.neonGreen,
        marginBottom: spacing.xs,
    },
    totalReviewsText: {
        ...typography.caption,
        color: palette.textSecondary,
        marginTop: spacing.xs,
    },
    ratingBreakdown: {
        flex: 1,
        justifyContent: 'center',
    },
    breakdownRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
        gap: spacing.sm,
    },
    ratingLabel: {
        ...typography.body,
        color: palette.textPrimary,
        width: 30,
        fontWeight: '600',
    },
    ratingBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: radii.sm,
        overflow: 'hidden',
    },
    ratingBar: {
        height: '100%',
        backgroundColor: palette.neonGreen,
        borderRadius: radii.sm,
    },
    ratingCount: {
        ...typography.caption,
        color: palette.textSecondary,
        width: 30,
        textAlign: 'right',
    },
    reviewCard: {
        backgroundColor: '#2A2A2A',
        borderRadius: radii.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    reviewRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    reviewPhotosContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    reviewPhoto: {
        width: 100,
        height: 100,
        borderRadius: radii.md,
        marginRight: spacing.sm,
    },
    helpfulButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: radii.md,
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    helpfulButtonActive: {
        backgroundColor: 'rgba(0, 255, 127, 0.15)',
    },
    helpfulButtonText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
    },
    helpfulButtonTextActive: {
        color: palette.neonGreen,
        fontWeight: '600',
    },
    reviewHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    reviewUserPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewUserInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    reviewUserName: {
        ...typography.body,
        color: palette.textPrimary,
        fontWeight: '600',
        marginBottom: 2,
    },
    reviewDate: {
        ...typography.caption,
        color: palette.textSecondary,
        marginTop: 2,
    },
    reviewComment: {
        ...typography.body,
        color: palette.textSecondary,
        lineHeight: 20,
    },
    actionButtonsContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    primaryButton: {
        backgroundColor: '#00FF7F',
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        alignItems: 'center',
    },
    primaryButtonText: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 16,
    },
    // Enhanced Trainer Styles
    trainerCardEnhanced: {
        flexDirection: 'column',
        backgroundColor: '#2A2A2A',
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    trainerPhotoLarge: {
        width: '100%',
        height: 200,
        backgroundColor: '#1A1A1A',
    },
    trainerContentEnhanced: {
        padding: spacing.lg,
    },
    trainerHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    trainerNameEnhanced: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    trainerRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    trainerRatingText: {
        ...typography.body,
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '600',
    },
    expertiseContainerEnhanced: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    expertiseTagEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 255, 127, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 127, 0.2)',
    },
    expertiseTextEnhanced: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '600',
    },
    trainerMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    trainerMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    trainerPriceEnhanced: {
        ...typography.body,
        color: palette.neonGreen,
        fontSize: 14,
        fontWeight: '600',
    },
    trainerExperienceText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
    },
    bookSessionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: palette.neonGreen,
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        marginTop: spacing.sm,
    },
    bookSessionButtonText: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    viewAllTrainersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: palette.neonGreen,
        borderRadius: radii.md,
    },
    viewAllTrainersText: {
        ...typography.bodyBold,
        color: palette.neonGreen,
        fontSize: 16,
    },
    // Enhanced Class Schedule Styles
    classFiltersRow: {
        marginBottom: spacing.md,
    },
    classDayChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: radii.md,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    classDayChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    classDayChipText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    classDayChipTextActive: {
        color: '#000',
        fontWeight: '700',
    },
    classTypeChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: radii.md,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    classTypeChipActive: {
        backgroundColor: 'rgba(0, 255, 127, 0.15)',
        borderColor: palette.neonGreen,
    },
    classTypeChipText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    classTypeChipTextActive: {
        color: palette.neonGreen,
        fontWeight: '700',
    },
    classCardEnhanced: {
        backgroundColor: '#2A2A2A',
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    classHeaderEnhanced: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    classMainInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    classNameEnhanced: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    classTypeTagEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: palette.neonGreen,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
        alignSelf: 'flex-start',
    },
    classTypeTextEnhanced: {
        ...typography.caption,
        color: '#000',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    availabilityBadge: {
        backgroundColor: 'rgba(0, 255, 127, 0.15)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: palette.neonGreen,
    },
    availabilityBadgeFull: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        borderColor: '#FF6B6B',
    },
    availabilityBadgeAlmostFull: {
        backgroundColor: 'rgba(255, 165, 0, 0.15)',
        borderColor: '#FFA500',
    },
    availabilityBadgeText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 11,
        fontWeight: '700',
    },
    availabilityBadgeTextFull: {
        color: '#FF6B6B',
    },
    classInstructorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    classInstructorEnhanced: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
    },
    classMetaRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    classMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    classMetaText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    scheduleTimesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    scheduleTimeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 255, 127, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 127, 0.2)',
    },
    scheduleTimeText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '600',
    },
    bookClassButtonEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: palette.neonGreen,
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        marginTop: spacing.sm,
    },
    bookClassButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    bookClassButtonTextEnhanced: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 15,
        fontWeight: '700',
    },
    bookClassButtonTextDisabled: {
        color: palette.textSecondary,
    },
    viewFullScheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: palette.neonGreen,
        borderRadius: radii.md,
    },
    viewFullScheduleText: {
        ...typography.bodyBold,
        color: palette.neonGreen,
        fontSize: 15,
    },
    // Workout Types Styles
    workoutTypesSubtitle: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    workoutTypesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        justifyContent: 'space-between',
    },
    workoutTypeCard: {
        width: '48%',
        backgroundColor: '#2A2A2A',
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    workoutTypeIconContainer: {
        width: 64,
        height: 64,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        alignSelf: 'center',
    },
    workoutTypeName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    workoutTypeDescription: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    workoutTypeMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        justifyContent: 'center',
        marginTop: 2,
    },
    workoutTypeMetaText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
    },
    browseAllWorkoutsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: palette.neonGreen,
        borderRadius: radii.md,
    },
    browseAllWorkoutsText: {
        ...typography.bodyBold,
        color: palette.neonGreen,
        fontSize: 15,
    },
    // Loading & Empty States
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: 'center',
        fontSize: 15,
    },
});
