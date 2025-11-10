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
} from 'react-native';
import { Screen } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { GYM_DATABASE, Gym } from '@/services/gymService';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<AppStackParamList, 'GymDetail'>;

// Equipment data structure
interface Equipment {
    id: string;
    name: string;
    category: 'Cardio' | 'Strength' | 'Free Weights' | 'Functional' | 'Other';
    image: string;
    count: number;
    specifications: string;
    instructions: string;
}

// Trainer data structure
interface Trainer {
    id: string;
    name: string;
    photo: string;
    expertise: string[];
    rating: number;
    pricePerSession: number;
}

// Class schedule data structure
interface GymClass {
    id: string;
    name: string;
    type: string;
    instructor: string;
    schedule: string[];
    duration: string;
    capacity: number;
}

// Review data structure
interface Review {
    id: string;
    userName: string;
    userPhoto: string;
    rating: number;
    comment: string;
    date: string;
    photos?: string[];
    helpfulCount: number;
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

    // Mock data - will be replaced with real data from backend
    const mockEquipment: Equipment[] = [
        {
            id: '1',
            name: 'Treadmill',
            category: 'Cardio',
            image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400',
            count: 10,
            specifications: 'Max Speed: 20 km/h, Incline: 0-15%, Display: LCD touchscreen',
            instructions: 'Start with warm-up at 5 km/h, gradually increase speed. Use safety clip.',
        },
        {
            id: '2',
            name: 'Elliptical Trainer',
            category: 'Cardio',
            image: 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=400',
            count: 8,
            specifications: 'Resistance Levels: 20, Stride Length: 20", Heart Rate Monitor',
            instructions: 'Stand upright, use handles for balance, maintain steady rhythm.',
        },
        {
            id: '3',
            name: 'Bench Press',
            category: 'Strength',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
            count: 5,
            specifications: 'Adjustable bench, Olympic barbell compatible, Max load: 200kg',
            instructions: 'Always use spotter, keep back flat, lower bar to chest level.',
        },
        {
            id: '4',
            name: 'Dumbbells',
            category: 'Free Weights',
            image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
            count: 50,
            specifications: 'Range: 2.5kg - 50kg, Rubber coated, Various grips',
            instructions: 'Select appropriate weight, maintain proper form, rerack after use.',
        },
        {
            id: '5',
            name: 'Cable Machine',
            category: 'Functional',
            image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
            count: 4,
            specifications: 'Adjustable height, 150kg weight stack, Multiple attachments',
            instructions: 'Attach desired handle, set weight, perform exercise with controlled motion.',
        },
    ];

    const mockTrainers: Trainer[] = [
        {
            id: '1',
            name: 'Avishka I',
            photo: 'https://randomuser.me/api/portraits/men/1.jpg',
            expertise: ['Strength Training', 'HIIT', 'Weight Loss'],
            rating: 4.8,
            pricePerSession: 50,
        },
        {
            id: '2',
            name: 'Avishka R',
            photo: 'https://randomuser.me/api/portraits/women/2.jpg',
            expertise: ['Yoga', 'Pilates', 'Flexibility'],
            rating: 4.9,
            pricePerSession: 45,
        },
        {
            id: '3',
            name: 'Avishka B',
            photo: 'https://randomuser.me/api/portraits/men/3.jpg',
            expertise: ['CrossFit', 'Olympic Lifting', 'Nutrition'],
            rating: 4.7,
            pricePerSession: 55,
        },
    ];

    const mockClasses: GymClass[] = [
        {
            id: '1',
            name: 'Morning Yoga',
            type: 'Yoga',
            instructor: 'Kavinda K',
            schedule: ['Mon 7:00 AM', 'Wed 7:00 AM', 'Fri 7:00 AM'],
            duration: '60 min',
            capacity: 20,
        },
        {
            id: '2',
            name: 'HIIT Power',
            type: 'HIIT',
            instructor: 'Devin A',
            schedule: ['Tue 6:00 PM', 'Thu 6:00 PM'],
            duration: '45 min',
            capacity: 15,
        },
        {
            id: '3',
            name: 'CrossFit WOD',
            type: 'CrossFit',
            instructor: 'Avishka R',
            schedule: ['Mon 5:30 PM', 'Wed 5:30 PM', 'Fri 5:30 PM'],
            duration: '60 min',
            capacity: 12,
        },
    ];

    const mockReviews: Review[] = [
        {
            id: '1',
            userName: 'Avishka RRRRRR',
            userPhoto: 'https://randomuser.me/api/portraits/men/10.jpg',
            rating: 5,
            comment: 'Great gym with excellent equipment! Staff is very friendly and helpful. The trainers are knowledgeable and always ready to assist.',
            date: '2024-10-15',
            photos: [
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
                'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
            ],
            helpfulCount: 24,
            wasHelpful: false,
        },
        {
            id: '2',
            userName: 'Avishka RRRRRR',
            userPhoto: 'https://randomuser.me/api/portraits/women/12.jpg',
            rating: 4,
            comment: 'Good facilities but can get crowded during peak hours. Would recommend coming in the morning for a better experience.',
            date: '2024-10-10',
            helpfulCount: 12,
            wasHelpful: true,
        },
        {
            id: '3',
            userName: 'Avishka RRRRR',
            userPhoto: 'https://randomuser.me/api/portraits/men/15.jpg',
            rating: 5,
            comment: 'Best gym in the area! Love the variety of classes and trainers. The equipment is always well-maintained and clean.',
            date: '2024-10-05',
            photos: [
                'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400',
            ],
            helpfulCount: 18,
            wasHelpful: false,
        },
        {
            id: '4',
            userName: 'Mike Johnson',
            userPhoto: 'https://randomuser.me/api/portraits/men/22.jpg',
            rating: 3,
            comment: 'Decent gym but could use some upgrades to the locker room facilities. Equipment is good though.',
            date: '2024-10-01',
            helpfulCount: 5,
            wasHelpful: false,
        },
        {
            id: '5',
            userName: 'Sarah Williams',
            userPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
            rating: 5,
            comment: 'Amazing atmosphere and great community! The yoga classes are top-notch.',
            date: '2024-09-28',
            photos: [
                'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
                'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400',
            ],
            helpfulCount: 31,
            wasHelpful: false,
        },
    ];

    useEffect(() => {
        loadGymDetails();
        setReviews(mockReviews);
    }, [gymId]);

    const loadGymDetails = () => {
        // Get gym from GYM_DATABASE
        const foundGym = GYM_DATABASE.find((g) => g.id === gymId);
        if (foundGym) {
            setGym(foundGym);
        }
    };

    const categories = ['All', 'Cardio', 'Strength', 'Free Weights', 'Functional', 'Other'];

    const filteredEquipment =
        selectedCategory === 'All'
            ? mockEquipment
            : mockEquipment.filter((eq) => eq.category === selectedCategory);

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
                    <Text style={styles.sectionTitle}>Personal Trainers</Text>
                    {mockTrainers.map((trainer) => (
                        <View key={trainer.id} style={styles.trainerCard}>
                            <Image source={{ uri: trainer.photo }} style={styles.trainerPhoto} />
                            <View style={styles.trainerInfo}>
                                <Text style={styles.trainerName}>{trainer.name}</Text>
                                {renderStars(trainer.rating)}
                                <View style={styles.expertiseContainer}>
                                    {trainer.expertise.map((exp, index) => (
                                        <View key={index} style={styles.expertiseTag}>
                                            <Text style={styles.expertiseText}>{exp}</Text>
                                        </View>
                                    ))}
                                </View>
                                <Text style={styles.trainerPrice}>${trainer.pricePerSession}/session</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => handleBookTrainer(trainer)}
                            >
                                <Text style={styles.bookButtonText}>Book</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Class Schedule */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Class Schedule</Text>
                    {mockClasses.map((gymClass) => (
                        <View key={gymClass.id} style={styles.classCard}>
                            <View style={styles.classHeader}>
                                <Text style={styles.className}>{gymClass.name}</Text>
                                <View style={styles.classTypeTag}>
                                    <Text style={styles.classTypeText}>{gymClass.type}</Text>
                                </View>
                            </View>
                            <Text style={styles.classInstructor}>Instructor: {gymClass.instructor}</Text>
                            <Text style={styles.classDuration}>
                                {gymClass.duration} • Capacity: {gymClass.capacity}
                            </Text>
                            <View style={styles.scheduleContainer}>
                                {gymClass.schedule.map((time, index) => (
                                    <Text key={index} style={styles.scheduleTime}>
                                        • {time}
                                    </Text>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.bookClassButton}
                                onPress={() => handleBookClass(gymClass)}
                            >
                                <Text style={styles.bookButtonText}>Book Class</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
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
});
