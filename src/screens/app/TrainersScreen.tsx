import { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Dimensions,
    Alert,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { AppStackParamList } from '@/navigation/types';

const { width } = Dimensions.get('window');

type TrainersScreenNavigation = NativeStackNavigationProp<AppStackParamList, 'Trainers'>;

interface Trainer {
    id: string;
    name: string;
    location: string;
    rating: number;
    image: string;
    specialization: string[];
    experience: number;
    pricePerSession: number;
    available: boolean;
}

// Realistic trainer data with Sri Lankan locations and professional pricing
const TRAINERS_DATA: Trainer[] = [
    {
        id: '1',
        name: 'AVISHKA RATHNAYAKE',
        location: 'Colombo 07',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=400&fit=crop',
        specialization: ['Strength Training', 'Bodybuilding', 'Sports Nutrition', 'Butt liftinng'],
        experience: 8,
        pricePerSession: 7500,
        available: true,
    },
    {
        id: '2',
        name: 'KAVINDU FERNANDO',
        location: 'Mount Lavinia',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400&h=400&fit=crop',
        specialization: ['Yoga', 'Meditation', 'Prenatal Fitness'],
        experience: 6,
        pricePerSession: 5500,
        available: true,
    },
    {
        id: '3',
        name: 'RAVINDU SILVA',
        location: 'Nugegoda',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        specialization: ['CrossFit', 'HIIT', 'Athletic Training'],
        experience: 10,
        pricePerSession: 8500,
        available: true,
    },
    {
        id: '4',
        name: 'ANUSHKA JAYAWARDENA',
        location: 'Kandy',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=400&fit=crop',
        specialization: ['Pilates', 'Core Training', 'Flexibility'],
        experience: 5,
        pricePerSession: 6000,
        available: true,
    },
    {
        id: '5',
        name: 'DINESH RATHNAYAKE',
        location: 'Dehiwala',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?w=400&h=400&fit=crop',
        specialization: ['Weight Loss', 'Cardio', 'Nutrition Coaching'],
        experience: 7,
        pricePerSession: 6500,
        available: true,
    },
    {
        id: '6',
        name: 'THARUSHI MENDIS',
        location: 'Colombo 03',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&h=400&fit=crop',
        specialization: ['Zumba', 'Dance Fitness', 'Aerobics'],
        experience: 4,
        pricePerSession: 5000,
        available: true,
    },
    {
        id: '7',
        name: 'CHAMINDA WICKRAMASINGHE',
        location: 'Maharagama',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop',
        specialization: ['Boxing', 'MMA', 'Self Defense'],
        experience: 12,
        pricePerSession: 9000,
        available: true,
    },
    {
        id: '8',
        name: 'ISHARA DE SILVA',
        location: 'Galle',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=400&fit=crop',
        specialization: ['Swimming', 'Water Aerobics', 'Rehabilitation'],
        experience: 9,
        pricePerSession: 7000,
        available: true,
    },
    {
        id: '9',
        name: 'NIMAL FERNANDO',
        location: 'Moratuwa',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop',
        specialization: ['Functional Training', 'Mobility', 'Injury Prevention'],
        experience: 11,
        pricePerSession: 8000,
        available: true,
    },
    {
        id: '10',
        name: 'HASHINI AMARASINGHE',
        location: 'Colombo 05',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400&h=400&fit=crop',
        specialization: ['Barre', 'Ballet Fitness', 'Posture Correction'],
        experience: 5,
        pricePerSession: 6500,
        available: true,
    },
    {
        id: '11',
        name: 'LAHIRU BANDARA',
        location: 'Negombo',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop',
        specialization: ['Olympic Lifting', 'Powerlifting', 'Strength Coaching'],
        experience: 13,
        pricePerSession: 9500,
        available: true,
    },
    {
        id: '12',
        name: 'NIMALI RAJAPAKSHA',
        location: 'Kollupitiya',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
        specialization: ['Senior Fitness', 'Chair Yoga', 'Low Impact'],
        experience: 8,
        pricePerSession: 5500,
        available: true,
    },
];

export const TrainersScreen = () => {
    const navigation = useNavigation<TrainersScreenNavigation>();
    const [activeTab, setActiveTab] = useState<'trainers' | 'workouts'>('trainers');
    const [searchQuery, setSearchQuery] = useState('');
    const [trainers, setTrainers] = useState<Trainer[]>(TRAINERS_DATA);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
    const [selectedExperience, setSelectedExperience] = useState<string>('');
    const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');

    // Apply filters whenever they change
    useEffect(() => {
        let filtered = [...TRAINERS_DATA];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(trainer =>
                trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trainer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trainer.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Filter by specialization
        if (selectedSpecialization) {
            filtered = filtered.filter(trainer =>
                trainer.specialization.some(spec =>
                    spec.toLowerCase().includes(selectedSpecialization.toLowerCase())
                )
            );
        }

        // Filter by experience
        if (selectedExperience) {
            filtered = filtered.filter(trainer => {
                const exp = trainer.experience;
                if (selectedExperience === '0-5') return exp >= 0 && exp <= 5;
                if (selectedExperience === '5-10') return exp > 5 && exp <= 10;
                if (selectedExperience === '10+') return exp > 10;
                return true;
            });
        }

        // Filter by price range
        if (selectedPriceRange) {
            filtered = filtered.filter(trainer => {
                const price = trainer.pricePerSession;
                if (selectedPriceRange === 'low') return price < 6000;
                if (selectedPriceRange === 'medium') return price >= 6000 && price < 8000;
                if (selectedPriceRange === 'high') return price >= 8000;
                return true;
            });
        }

        setTrainers(filtered);
    }, [searchQuery, selectedSpecialization, selectedExperience, selectedPriceRange]);

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => {
            // Reset filters and show all trainers
            setSearchQuery('');
            setSelectedSpecialization('');
            setSelectedExperience('');
            setSelectedPriceRange('');
            setTrainers(TRAINERS_DATA);
            setRefreshing(false);
        }, 1000);
    };

    const handleTrainerPress = (trainer: Trainer) => {
        navigation.navigate('TrainerDetail', { trainer });
    };

    const toggleSpecializationFilter = () => {
        Alert.alert(
            'Filter by Specialization',
            'Select a specialization',
            [
                { text: 'All', onPress: () => setSelectedSpecialization('') },
                { text: 'Strength Training', onPress: () => setSelectedSpecialization('Strength') },
                { text: 'Yoga', onPress: () => setSelectedSpecialization('Yoga') },
                { text: 'CrossFit', onPress: () => setSelectedSpecialization('CrossFit') },
                { text: 'Pilates', onPress: () => setSelectedSpecialization('Pilates') },
                { text: 'Boxing/MMA', onPress: () => setSelectedSpecialization('Boxing') },
                { text: 'Weight Loss', onPress: () => setSelectedSpecialization('Weight Loss') },
                { text: 'Dance Fitness', onPress: () => setSelectedSpecialization('Dance') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const toggleExperienceFilter = () => {
        Alert.alert(
            'Filter by Experience',
            'Select experience level',
            [
                { text: 'All', onPress: () => setSelectedExperience('') },
                { text: '0-5 years', onPress: () => setSelectedExperience('0-5') },
                { text: '5-10 years', onPress: () => setSelectedExperience('5-10') },
                { text: '10+ years', onPress: () => setSelectedExperience('10+') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const togglePriceRangeFilter = () => {
        Alert.alert(
            'Filter by Price Range',
            'Select price range',
            [
                { text: 'All', onPress: () => setSelectedPriceRange('') },
                { text: 'Budget (< LKR 6,000)', onPress: () => setSelectedPriceRange('low') },
                { text: 'Medium (LKR 6,000 - 8,000)', onPress: () => setSelectedPriceRange('medium') },
                { text: 'Premium (> LKR 8,000)', onPress: () => setSelectedPriceRange('high') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
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

    const renderTrainerCard = (trainer: Trainer) => (
        <TouchableOpacity
            key={trainer.id}
            style={styles.trainerCard}
            onPress={() => handleTrainerPress(trainer)}
            activeOpacity={0.7}
        >
            <View style={styles.trainerImageContainer}>
                <Image
                    source={{ uri: trainer.image }}
                    style={styles.trainerImage}
                />
                {trainer.available && (
                    <View style={styles.availableBadge}>
                        <View style={styles.availableDot} />
                    </View>
                )}
            </View>
            <Text style={styles.trainerName}>{trainer.name}</Text>
            <Text style={styles.trainerLocation}>{trainer.location}</Text>
            <View style={styles.ratingRow}>
                <View style={styles.stars}>{renderStars(trainer.rating)}</View>
            </View>
            <Text style={styles.ratingText}>{trainer.rating} Rating</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color={palette.textPrimary} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Workouts & Trainers</Text>
            </View>

            {/* Tab Toggle */}
            <View style={styles.tabContainer}>
                <View style={styles.tabToggle}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'trainers' && styles.tabActive]}
                        onPress={() => setActiveTab('trainers')}
                    >
                        <Text style={[styles.tabText, activeTab === 'trainers' && styles.tabTextActive]}>
                            TRAINERS
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'workouts' && styles.tabActive]}
                        onPress={() => setActiveTab('workouts')}
                    >
                        <Text style={[styles.tabText, activeTab === 'workouts' && styles.tabTextActive]}>
                            WORKOUTS
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchPlaceholder}>Location based search</Text>
                </View>
                <TouchableOpacity style={styles.searchButton}>
                    <LinearGradient
                        colors={[palette.neonGreen, palette.neonGreenDim]}
                        style={styles.searchButtonGradient}
                    >
                        <Icon name="magnify" size={20} color={palette.background} />
                        <Text style={styles.searchButtonText}>search</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedSpecialization && styles.filterChipActive]}
                        onPress={toggleSpecializationFilter}
                    >
                        <Text style={[styles.filterChipText, selectedSpecialization && styles.filterChipTextActive]}>
                            {selectedSpecialization || 'Specialization'}
                        </Text>
                        <Icon name="chevron-down" size={16} color={selectedSpecialization ? palette.background : palette.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedExperience && styles.filterChipActive]}
                        onPress={toggleExperienceFilter}
                    >
                        <Text style={[styles.filterChipText, selectedExperience && styles.filterChipTextActive]}>
                            {selectedExperience ? `${selectedExperience} years` : 'Experience'}
                        </Text>
                        <Icon name="chevron-down" size={16} color={selectedExperience ? palette.background : palette.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedPriceRange && styles.filterChipActive]}
                        onPress={togglePriceRangeFilter}
                    >
                        <Text style={[styles.filterChipText, selectedPriceRange && styles.filterChipTextActive]}>
                            {selectedPriceRange ? selectedPriceRange.charAt(0).toUpperCase() + selectedPriceRange.slice(1) : 'Price Range'}
                        </Text>
                        <Icon name="chevron-down" size={16} color={selectedPriceRange ? palette.background : palette.textPrimary} />
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Filter Dots */}
            <View style={styles.dotsContainer}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
            </View>

            {/* Content */}
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
                {activeTab === 'trainers' ? (
                    <>
                        <Text style={styles.sectionTitle}>Trainers</Text>
                        <View style={styles.trainersGrid}>
                            {trainers.map(renderTrainerCard)}
                        </View>

                        {/* Pagination Dots */}
                        <View style={styles.paginationDots}>
                            <View style={[styles.paginationDot, styles.paginationDotActive]} />
                            <View style={styles.paginationDot} />
                            <View style={styles.paginationDot} />
                            <View style={styles.paginationDot} />
                            <View style={styles.paginationDot} />
                        </View>

                        {/* Location-based Search Section */}
                        <View style={styles.locationSection}>
                            <Text style={styles.locationTitle}>Location-based search</Text>
                            <View style={styles.mapContainer}>
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&h=400&fit=crop' }}
                                    style={styles.mapImage}
                                />
                                <TouchableOpacity
                                    style={styles.mapViewButton}
                                    onPress={() => Alert.alert('Map View', 'Opening map with trainer locations...')}
                                >
                                    <View style={styles.mapViewButtonInner}>
                                        <Text style={styles.mapViewText}>Map view</Text>
                                        <Icon name="chevron-right" size={20} color={palette.background} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <Icon name="dumbbell" size={64} color={palette.textSecondary} />
                        <Text style={styles.emptyStateText}>Workouts Coming Soon</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Browse and book personalized workout sessions with our trainers
                        </Text>
                    </View>
                )}

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
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxxl,
        paddingBottom: spacing.md,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    backText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
    },
    title: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 28,
        fontWeight: '700',
    },
    tabContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    tabToggle: {
        flexDirection: 'row',
        backgroundColor: palette.surface,
        borderRadius: 25,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: 22,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: palette.neonGreen,
    },
    tabText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: palette.background,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    searchBar: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    searchPlaceholder: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
    },
    searchButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    searchButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    searchButtonText: {
        ...typography.body,
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    filterContainer: {
        marginBottom: spacing.sm,
    },
    filterScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.xs,
        borderWidth: 1.5,
        borderColor: palette.textPrimary,
    },
    filterChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    filterChipText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
    },
    filterChipTextActive: {
        color: palette.background,
        fontWeight: '600',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xs,
        marginBottom: spacing.lg,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: palette.textSecondary,
        opacity: 0.3,
    },
    dotActive: {
        backgroundColor: palette.neonGreen,
        opacity: 1,
        width: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: spacing.lg,
    },
    trainersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    trainerCard: {
        width: (width - spacing.lg * 2 - spacing.md) / 2,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    trainerImageContainer: {
        position: 'relative',
        marginBottom: spacing.sm,
    },
    trainerImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: palette.surface,
    },
    availableBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: palette.neonGreen,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: palette.background,
    },
    availableDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: palette.background,
    },
    trainerName: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
    },
    trainerLocation: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
        marginBottom: spacing.xs,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xs,
        marginVertical: spacing.xl,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: palette.textSecondary,
        opacity: 0.3,
    },
    paginationDotActive: {
        backgroundColor: palette.neonGreen,
        opacity: 1,
    },
    locationSection: {
        marginTop: spacing.lg,
    },
    locationTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    mapContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 180,
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapViewButton: {
        position: 'absolute',
        bottom: spacing.md,
        left: '50%',
        transform: [{ translateX: -60 }],
    },
    mapViewButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: 20,
    },
    mapViewText: {
        ...typography.body,
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl * 2,
        paddingHorizontal: spacing.xl,
    },
    emptyStateText: {
        ...typography.heading2,
        color: palette.textPrimary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        ...typography.body,
        color: palette.textSecondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    bottomSpacing: {
        height: 40,
    },
});
