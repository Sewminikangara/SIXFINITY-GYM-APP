import { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { AppStackParamList } from '@/navigation/types';

const { width } = Dimensions.get('window');

type TrainerDetailRouteProp = RouteProp<AppStackParamList, 'TrainerDetail'>;

export const TrainerDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<TrainerDetailRouteProp>();
    const { trainer } = route.params;

    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [activeCertIndex, setActiveCertIndex] = useState(0);

    const scrollViewRef = useRef<ScrollView>(null);

    const photos = [
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=600&fit=crop',
    ];

    const certifications = [
        {
            id: '1',
            name: 'ACE Certified Personal Trainer',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
        },
        {
            id: '2',
            name: 'ISSA Strength & Conditioning Coach',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
        },
        {
            id: '3',
            name: 'CPR & First Aid Certified',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
        },
    ];

    const handleBookSession = () => {
        Alert.alert(
            'Book Session',
            `Book a training session with ${trainer.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Book Now', onPress: () => Alert.alert('Success', 'Booking request sent!') }
            ]
        );
    };

    const handleSendMessage = () => {
        Alert.alert(
            'Send Message',
            `Send a message to ${trainer.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send', onPress: () => Alert.alert('Success', 'Message sent!') }
            ]
        );
    };

    const handleCall = () => {
        Linking.openURL('tel:+94112345678');
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Icon key={i} name="star" size={16} color="#FFD700" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<Icon key={i} name="star-half-full" size={16} color="#FFD700" />);
            } else {
                stars.push(<Icon key={i} name="star-outline" size={16} color="#FFD700" />);
            }
        }
        return stars;
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                ref={scrollViewRef}
            >
                {/* Header Image */}
                <View style={styles.headerImageContainer}>
                    <Image
                        source={{ uri: trainer.image }}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.headerGradient}
                    />

                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Profile Circle */}
                    <View style={styles.profileCircleContainer}>
                        <Image
                            source={{ uri: trainer.image }}
                            style={styles.profileCircle}
                        />
                    </View>
                </View>

                {/* Trainer Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>

                    <View style={styles.ratingRow}>
                        <View style={styles.stars}>{renderStars(trainer.rating)}</View>
                        <Text style={styles.ratingText}>{trainer.rating} Rating</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="map-marker" size={16} color={palette.textSecondary} />
                        <Text style={styles.infoText}>
                            No. 12, Main Street, Colombo 07, Sri Lanka.
                        </Text>
                    </View>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Icon name="clock-outline" size={16} color={palette.neonGreen} />
                            <Text style={styles.detailLabel}>open hours : </Text>
                            <Text style={styles.detailValue}>8 AM - 11 PM</Text>
                        </View>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Price per session : </Text>
                        <Text style={styles.priceValue}>LKR {trainer.pricePerSession.toLocaleString()}</Text>
                    </View>

                    <Text style={styles.bioText}>
                        Certified fitness coach with over 8 years of experience in personal training,
                        strength conditioning, and functional workouts and butt lifting. Passionate about helping
                        clients achieve their goals through sustainable fitness plans and proper
                        nutrition guidance.
                    </Text>
                </View>

                {/* Certifications */}
                <View style={styles.certificationsSection}>
                    <Text style={styles.sectionTitle}>Certifications</Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / (width - spacing.lg * 4));
                            setActiveCertIndex(index);
                        }}
                        contentContainerStyle={styles.certificationsScroll}
                    >
                        {certifications.map((cert, index) => (
                            <View key={cert.id} style={styles.certCard}>
                                <Image
                                    source={{ uri: cert.image }}
                                    style={styles.certImage}
                                />
                                <Text style={styles.certName}>{cert.name}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.dotsContainer}>
                        {certifications.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === activeCertIndex && styles.dotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={handleBookSession}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#FFFFFF', '#F0F0F0']}
                            style={styles.bookButtonGradient}
                        >
                            <Text style={styles.bookButtonText}>Book Session</Text>
                            <Icon name="chevron-right" size={20} color={palette.background} />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={handleSendMessage}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.background, palette.surface]}
                            style={styles.messageButtonGradient}
                        >
                            <Text style={styles.messageButtonText}>Send Message</Text>
                            <Icon name="chevron-right" size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Photo Gallery */}
                <View style={styles.gallerySection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / width);
                            setActivePhotoIndex(index);
                        }}
                    >
                        {photos.map((photo, index) => (
                            <View key={index} style={styles.galleryImageContainer}>
                                <Image
                                    source={{ uri: photo }}
                                    style={styles.galleryImage}
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Navigation Arrows */}
                    <TouchableOpacity
                        style={[styles.galleryArrow, styles.galleryArrowLeft]}
                        onPress={() => {
                            if (activePhotoIndex > 0) {
                                setActivePhotoIndex(activePhotoIndex - 1);
                            }
                        }}
                    >
                        <View style={styles.arrowCircle}>
                            <Icon name="chevron-left" size={24} color={palette.background} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.galleryArrow, styles.galleryArrowRight]}
                        onPress={() => {
                            if (activePhotoIndex < photos.length - 1) {
                                setActivePhotoIndex(activePhotoIndex + 1);
                            }
                        }}
                    >
                        <View style={styles.arrowCircle}>
                            <Icon name="chevron-right" size={24} color={palette.background} />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.galleryDotsContainer}>
                        {photos.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.galleryDot,
                                    index === activePhotoIndex && styles.galleryDotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>

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
    headerImageContainer: {
        width: '100%',
        height: 300,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        top: spacing.xxxl,
        left: spacing.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCircleContainer: {
        position: 'absolute',
        bottom: -60,
        alignSelf: 'center',
    },
    profileCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: palette.background,
    },
    infoSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxxl + spacing.md,
    },
    trainerName: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    infoText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
    detailsRow: {
        marginVertical: spacing.sm,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    detailLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    detailValue: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    priceLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    priceValue: {
        ...typography.body,
        color: palette.neonGreen,
        fontSize: 16,
        fontWeight: '700',
    },
    bioText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    certificationsSection: {
        paddingVertical: spacing.lg,
    },
    sectionTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    certificationsScroll: {
        paddingHorizontal: spacing.lg,
    },
    certCard: {
        width: width - spacing.lg * 4,
        marginRight: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
    },
    certImage: {
        width: '100%',
        height: 180,
        backgroundColor: palette.border,
    },
    certName: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        padding: spacing.md,
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.md,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: palette.textSecondary,
        opacity: 0.3,
    },
    dotActive: {
        backgroundColor: palette.neonGreen,
        opacity: 1,
        width: 24,
    },
    actionButtons: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    bookButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    bookButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    bookButtonText: {
        ...typography.body,
        color: palette.background,
        fontSize: 16,
        fontWeight: '700',
    },
    messageButton: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: palette.border,
    },
    messageButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    messageButtonText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    gallerySection: {
        marginTop: spacing.lg,
        position: 'relative',
    },
    galleryImageContainer: {
        width: width,
        height: 300,
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    galleryArrow: {
        position: 'absolute',
        top: '50%',
        marginTop: -28,
    },
    galleryArrowLeft: {
        left: spacing.lg,
    },
    galleryArrowRight: {
        right: spacing.lg,
    },
    arrowCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: palette.neonGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryDotsContainer: {
        position: 'absolute',
        bottom: spacing.lg,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: spacing.xs,
    },
    galleryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        opacity: 0.5,
    },
    galleryDotActive: {
        opacity: 1,
        width: 24,
    },
    bottomSpacing: {
        height: 40,
    },
});
