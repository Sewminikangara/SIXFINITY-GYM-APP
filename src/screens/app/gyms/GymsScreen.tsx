import { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ImageBackground,
    Alert,
    Platform,
    Linking,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { palette, spacing, typography } from '@/theme';
import { GymFiltersModal, type GymFilterOptions } from '@/components';
import { filterGyms, getCountries, getCitiesByCountry, type Gym, type GymFilters } from '@/services/gymService';
import { AppTabParamList, AppStackParamList } from '@/navigation/types';

type GymsScreenNavigation = CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList, 'Gyms'>,
    NativeStackNavigationProp<AppStackParamList>
>;

const { width } = Dimensions.get('window');

const FACILITY_ICONS: Record<string, string> = {
    parking: 'car',
    wifi: 'wifi',
    shower: 'shower',
    locker: 'locker',
    trainer: 'account',
    pool: 'pool',
    sauna: 'steam',
    spa: 'spa',
    cafe: 'coffee',
    yoga: 'yoga',
    crossfit: 'weight-lifter',
    supplement: 'pill',
    '24hours': 'clock-outline',
    zumba: 'run',
    hiit: 'run-fast',
    nutrition: 'food-apple',
};

export const GymsScreen = () => {
    const navigation = useNavigation<GymsScreenNavigation>();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('list');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Advanced Filters
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [selectedDistance, setSelectedDistance] = useState<number>(50); // km
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
    const [minRating, setMinRating] = useState<number>(0);
    const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);

    // Location & Gyms
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'error'>('loading');
    const [selectedCountry, setSelectedCountry] = useState<string>('All');
    const [selectedCity, setSelectedCity] = useState<string>('');

    // Carousel state - track active image index for each gym
    const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

    // Request location permission and get user location
    useEffect(() => {
        requestLocationAndLoadGyms();
    }, []);

    const requestLocationAndLoadGyms = async () => {
        try {
            setLoading(true);
            setLocationStatus('loading');

            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setLocationStatus('denied');
                // Load gyms without location
                loadGymsWithoutLocation();
                return;
            }

            setLocationStatus('granted');

            // Get location with HIGH ACCURACY
            let location = null;
            try {
                // First attempt: HIGH ACCURACY with timeout
                location = await Promise.race([
                    Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Highest,
                    }),
                    new Promise<null>((_, reject) =>
                        setTimeout(() => reject(new Error('High accuracy timeout')), 15000)
                    )
                ]);
            } catch (highAccuracyError) {
                console.log('High accuracy failed, falling back to balanced:', highAccuracyError);
                // Fallback: Try Balanced accuracy
                try {
                    location = await Promise.race([
                        Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Balanced,
                        }),
                        new Promise<null>((_, reject) =>
                            setTimeout(() => reject(new Error('Balanced accuracy timeout')), 10000)
                        )
                    ]);
                } catch (balancedError) {
                    console.log('Balanced accuracy failed, using last known:', balancedError);
                    // Last resort: Get last known position
                    location = await Location.getLastKnownPositionAsync({
                        maxAge: 60000, // Accept location up to 1 minute old
                    });
                }
            }

            if (location && 'coords' in location) {
                const { latitude, longitude, accuracy } = location.coords;
                console.log(`Location obtained - Lat: ${latitude}, Lng: ${longitude}, Accuracy: ${accuracy}m`);

                setUserLocation({ latitude, longitude });

                // Auto-detect country
                const detectedCountry = detectCountryFromCoords(latitude, longitude);
                setSelectedCountry(detectedCountry);

                // Show accuracy to user if low
                if (accuracy && accuracy > 100) {
                    Alert.alert(
                        'Location Accuracy Notice',
                        `Location accuracy: ±${Math.round(accuracy)}m\nFor better results, ensure GPS is enabled and you're outdoors.`,
                        [{ text: 'OK' }]
                    );
                }

                // Load nearby gyms
                loadGymsWithLocation(latitude, longitude, detectedCountry);
            } else {
                throw new Error('Could not get location');
            }
        } catch (error) {
            console.error('Location error:', error);
            setLocationStatus('error');
            loadGymsWithoutLocation();
        }
    };

    const detectCountryFromCoords = (lat: number, lng: number): string => {
        // Sri Lanka: lat ~6-10, lng ~79-82
        if (lat >= 6 && lat <= 10 && lng >= 79 && lng <= 82) {
            return 'Sri Lanka';
        }
        // Dubai: lat ~24-26, lng ~54-56
        if (lat >= 24 && lat <= 26 && lng >= 54 && lng <= 56) {
            return 'Dubai';
        }
        // Australia: lat ~-44 to -10, lng ~113-154
        if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) {
            return 'Australia';
        }
        return 'All';
    };

    const loadGymsWithLocation = (lat: number, lng: number, country: string) => {
        const filters: GymFilters = {
            country: country !== 'All' ? country as any : undefined,
            city: selectedCity || undefined,
            searchQuery: searchQuery.trim() || undefined,
            userLocation: { latitude: lat, longitude: lng },
            // Only apply distance filter if 'All' countries selected
            maxDistance: country === 'All' ? selectedDistance : undefined,
            facilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
            minRating: minRating > 0 ? minRating : undefined,
        };

        const results = filterGyms(filters);
        setGyms(results);
        setLoading(false);
    };

    const loadGymsWithoutLocation = () => {
        const filters: GymFilters = {
            country: selectedCountry !== 'All' ? selectedCountry as any : undefined,
            city: selectedCity || undefined,
            searchQuery: searchQuery.trim() || undefined,
            facilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
            minRating: minRating > 0 ? minRating : undefined,
        };

        const results = filterGyms(filters);
        setGyms(results);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (userLocation) {
            loadGymsWithLocation(userLocation.latitude, userLocation.longitude, selectedCountry);
        } else {
            await requestLocationAndLoadGyms();
        }
        setRefreshing(false);
    };

    const handleSearch = () => {
        if (userLocation) {
            loadGymsWithLocation(userLocation.latitude, userLocation.longitude, selectedCountry);
        } else {
            loadGymsWithoutLocation();
        }
    };

    const toggleFavorite = (gymId: string) => {
        if (favorites.includes(gymId)) {
            setFavorites(favorites.filter(id => id !== gymId));
        } else {
            setFavorites([...favorites, gymId]);
        }
    };

    const handleGymPress = (gym: Gym) => {
        navigation.navigate('GymDetail', { gymId: gym.id });
    };

    const handleApplyFilters = (newFilters: GymFilterOptions) => {
        setSelectedDistance(newFilters.selectedDistance);
        setSelectedFacilities(newFilters.selectedFacilities);
        setSelectedPriceRange(newFilters.priceRange);
        setMinRating(newFilters.minRating);
        setOpenNowOnly(newFilters.openNowOnly);

        // Reload gyms with new filters
        if (userLocation) {
            loadGymsWithLocation(userLocation.latitude, userLocation.longitude, selectedCountry);
        } else {
            loadGymsWithoutLocation();
        }
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (selectedFacilities.length > 0) count++;
        if (selectedPriceRange.length > 0) count++;
        if (minRating > 0) count++;
        if (openNowOnly) count++;
        if (selectedDistance !== 50) count++;
        return count;
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Icon key={`full-${i}`} name="star" size={14} color="#FFD700" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Icon key="half" name="star-half-full" size={14} color="#FFD700" />
            );
        }

        return stars;
    };

    const renderGymCard = (gym: Gym) => {
        const images = gym.images && gym.images.length > 0 ? gym.images : [gym.image];
        const activeImageIndex = carouselIndices[gym.id] || 0;

        const handleScroll = (event: any) => {
            const scrollPosition = event.nativeEvent.contentOffset.x;
            const imageWidth = viewMode === 'grid' ? (width - spacing.lg * 3) / 2 : width - spacing.lg * 2;
            const index = Math.round(scrollPosition / imageWidth);
            setCarouselIndices(prev => ({ ...prev, [gym.id]: index }));
        };

        return (
            <View
                key={gym.id}
                style={[styles.gymCard, viewMode === 'grid' && styles.gymCardGrid]}
            >
                {/* Photo Carousel */}
                <View style={styles.carouselContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        style={[styles.gymImage, viewMode === 'grid' && styles.gymImageGrid]}
                    >
                        {images.map((imageUri, index) => (
                            <ImageBackground
                                key={`${gym.id}-img-${index}`}
                                source={{ uri: imageUri }}
                                style={[
                                    styles.carouselImage,
                                    viewMode === 'grid' && styles.carouselImageGrid
                                ]}
                                imageStyle={styles.gymImageStyle}
                            >
                                {index === 0 && (
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                                        style={styles.imageGradient}
                                    >
                                        <TouchableOpacity
                                            style={styles.favoriteButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(gym.id);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Icon
                                                name={favorites.includes(gym.id) ? "heart" : "heart-outline"}
                                                size={22}
                                                color={favorites.includes(gym.id) ? "#FF4444" : "#FFFFFF"}
                                            />
                                        </TouchableOpacity>

                                        {gym.distance && (
                                            <View style={styles.distanceBadge}>
                                                <Icon name="map-marker" size={14} color={palette.neonGreen} />
                                                <Text style={styles.distanceBadgeText}>{gym.distance}</Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                )}
                            </ImageBackground>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    {images.length > 1 && (
                        <View style={styles.paginationDots}>
                            {images.map((_, index) => (
                                <View
                                    key={`dot-${index}`}
                                    style={[
                                        styles.dot,
                                        index === activeImageIndex && styles.dotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.gymInfo}>
                    <Text style={styles.gymName} numberOfLines={1}>{gym.name}</Text>

                    <View style={styles.locationRow}>
                        <Icon name="map-marker-outline" size={14} color={palette.textSecondary} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {gym.location.city}, {gym.location.country}
                        </Text>
                    </View>

                    <View style={styles.ratingRow}>
                        <View style={styles.stars}>
                            {renderStars(gym.rating)}
                        </View>
                        <Text style={styles.ratingText}>{gym.rating}</Text>
                        <Text style={styles.reviewCount}>({gym.reviewCount})</Text>
                        <Text style={styles.priceText}> • {gym.priceRange}</Text>
                    </View>

                    <View style={styles.facilitiesRow}>
                        {gym.facilities.slice(0, 6).map((facility) => (
                            <View key={facility} style={styles.facilityBadge}>
                                <Icon
                                    name={FACILITY_ICONS[facility] || 'check-circle'}
                                    size={14}
                                    color={palette.neonGreen}
                                />
                            </View>
                        ))}
                        {gym.facilities.length > 6 && (
                            <Text style={styles.moreFacilities}>+{gym.facilities.length - 6}</Text>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.viewDetailsButton}
                            onPress={() => handleGymPress(gym)}
                            activeOpacity={0.7}
                        >
                            <Icon name="information" size={16} color={palette.textPrimary} />
                            <Text style={styles.viewDetailsText}>View Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.joinNowButton}
                            onPress={() => {
                                Alert.alert(
                                    'Join Gym',
                                    `Join ${gym.name}?`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Join Now',
                                            onPress: () => {
                                                setFavorites([...favorites, gym.id]);
                                                Alert.alert('Success', `You've joined ${gym.name}!`);
                                            }
                                        }
                                    ]
                                );
                            }}
                            activeOpacity={0.7}
                        >
                            <Icon name="plus-circle" size={16} color="#000" />
                            <Text style={styles.joinNowText}>Join Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={palette.neonGreen} />
                <Text style={styles.loadingText}>
                    {locationStatus === 'loading' ? 'Getting your location...' : 'Loading gyms...'}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Find Gyms</Text>
                    {userLocation && locationStatus === 'granted' && (
                        <View style={styles.locationIndicator}>
                            <Icon name="map-marker-check" size={16} color={palette.neonGreen} />
                            <Text style={styles.locationText2}>
                                Showing {gyms.length} gym{gyms.length !== 1 ? 's' : ''} near you
                            </Text>
                        </View>
                    )}
                    {locationStatus === 'denied' && (
                        <TouchableOpacity
                            style={styles.locationIndicator}
                            onPress={() => Alert.alert(
                                'Location Access',
                                'Enable location in settings to see nearby gyms',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Open Settings', onPress: () => Linking.openSettings() }
                                ]
                            )}
                        >
                            <Icon name="map-marker-off" size={16} color={palette.textSecondary} />
                            <Text style={styles.locationDeniedText}>Location disabled • Tap to enable</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.myGymsButton}
                        onPress={() => navigation.navigate('MyGyms')}
                    >
                        <Icon name="heart" size={20} color={palette.neonGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <Icon
                            name="view-list"
                            size={20}
                            color={viewMode === 'list' ? palette.neonGreen : palette.textSecondary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
                        onPress={() => setViewMode('grid')}
                    >
                        <Icon
                            name="view-grid"
                            size={20}
                            color={viewMode === 'grid' ? palette.neonGreen : palette.textSecondary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'map' && styles.viewModeButtonActive]}
                        onPress={() => navigation.navigate('GymMap')}
                    >
                        <Icon
                            name="map"
                            size={20}
                            color={viewMode === 'map' ? palette.neonGreen : palette.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar with Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Icon name="magnify" size={20} color={palette.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search gyms..."
                            placeholderTextColor={palette.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                            onSubmitEditing={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Icon name="close-circle" size={20} color={palette.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Advanced Filter Button */}
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFiltersModal(true)}
                    >
                        <Icon name="tune-variant" size={20} color={palette.textPrimary} />
                        {getActiveFiltersCount() > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Location Accuracy Indicator & Refresh */}
                {userLocation && locationStatus === 'granted' && (
                    <View style={styles.locationBar}>
                        <View style={styles.locationInfo}>
                            <Icon name="crosshairs-gps" size={16} color={palette.neonGreen} />
                            <Text style={styles.locationBarText}>
                                Using your current location
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.refreshLocationButton}
                            onPress={async () => {
                                setLoading(true);
                                await requestLocationAndLoadGyms();
                            }}
                        >
                            <Icon name="refresh" size={18} color={palette.neonGreen} />
                            <Text style={styles.refreshLocationText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Compact Country Filter */}
                <View style={styles.compactFilter}>
                    {getCountries().map((country, index) => (
                        <TouchableOpacity
                            key={`country-${index}-${country}`}
                            style={[
                                styles.filterDot,
                                selectedCountry === country && styles.filterDotActive
                            ]}
                            onPress={() => {
                                setSelectedCountry(country);
                                setSelectedCity('');
                                if (userLocation && country !== 'All') {
                                    loadGymsWithLocation(userLocation.latitude, userLocation.longitude, country);
                                } else {
                                    loadGymsWithoutLocation();
                                }
                            }}
                        >
                            <Text style={[
                                styles.filterDotText,
                                selectedCountry === country && styles.filterDotTextActive
                            ]}>
                                {country === 'All' ? 'All' : country === 'Sri Lanka' ? 'SL' : country === 'Dubai' ? 'DB' : 'AU'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Gym List */}
            <FlatList
                data={gyms}
                renderItem={({ item }) => renderGymCard(item)}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.gymList}
                showsVerticalScrollIndicator={false}
                numColumns={viewMode === 'grid' ? 2 : 1}
                key={viewMode} // Force re-render when switching between grid and list
                columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.neonGreen}
                        colors={[palette.neonGreen]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="map-marker-off" size={64} color={palette.textSecondary} />
                        <Text style={styles.emptyStateText}>No gyms found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            {locationStatus === 'denied'
                                ? 'Enable location to find gyms near you'
                                : 'Try adjusting your search or location'}
                        </Text>
                        {locationStatus === 'denied' && (
                            <TouchableOpacity
                                style={styles.enableLocationButton}
                                onPress={() => Linking.openSettings()}
                            >
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    style={styles.enableLocationGradient}
                                >
                                    <Icon name="map-marker-check" size={20} color={palette.background} />
                                    <Text style={styles.enableLocationText}>Enable Location</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListFooterComponent={<View style={styles.bottomSpacing} />}
            />

            {/* Filters Modal */}
            <GymFiltersModal
                visible={showFiltersModal}
                onClose={() => setShowFiltersModal(false)}
                filters={{
                    selectedDistance,
                    selectedFacilities,
                    priceRange: selectedPriceRange,
                    minRating,
                    openNowOnly,
                }}
                onApplyFilters={handleApplyFilters}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: palette.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    loadingText: {
        ...typography.body,
        color: palette.textSecondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxxl,
        paddingBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    title: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 32,
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    locationIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    locationText2: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '600',
    },
    locationDeniedText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    myGymsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${palette.neonGreen}15`,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.neonGreen,
    },
    viewModeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    viewModeButtonActive: {
        backgroundColor: `${palette.neonGreen}10`,
        borderColor: palette.neonGreen,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    searchRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        paddingVertical: spacing.md,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: palette.neonGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        ...typography.caption,
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
    },
    locationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `${palette.neonGreen}15`,
        borderRadius: 10,
        padding: spacing.sm,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: `${palette.neonGreen}30`,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        flex: 1,
    },
    locationBarText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    refreshLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${palette.neonGreen}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: 8,
    },
    refreshLocationText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 11,
        fontWeight: '600',
    },
    compactFilter: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    filterDot: {
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
    },
    filterDotActive: {
        backgroundColor: palette.neonGreen,
    },
    filterDotText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 10,
        fontWeight: '600',
    },
    filterDotTextActive: {
        color: palette.background,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    gymList: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xs,
    },
    gymCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
    },
    gymCardGrid: {
        width: (width - spacing.lg * 3) / 2,
        marginRight: spacing.md,
    },
    gymImage: {
        width: '100%',
        height: 160,
    },
    gymImageGrid: {
        height: 120,
    },
    gymImageStyle: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    carouselContainer: {
        position: 'relative',
    },
    carouselImage: {
        width: width - spacing.lg * 2,
        height: 160,
    },
    carouselImageGrid: {
        width: (width - spacing.lg * 3) / 2,
        height: 120,
    },
    paginationDots: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    dotActive: {
        backgroundColor: palette.neonGreen,
        width: 16,
    },
    imageGradient: {
        flex: 1,
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    favoriteButton: {
        alignSelf: 'flex-end',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    distanceBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    distanceBadgeText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 11,
        fontWeight: '700',
    },
    gymInfo: {
        padding: spacing.md,
    },
    gymName: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    locationText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: spacing.xs,
    },
    reviewCount: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    priceText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '600',
    },
    facilitiesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    facilityBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${palette.neonGreen}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreFacilities: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 10,
        marginLeft: spacing.xs,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    viewDetailsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    viewDetailsText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    joinNowButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        borderRadius: 8,
        backgroundColor: palette.neonGreen,
    },
    joinNowText: {
        ...typography.caption,
        color: '#000',
        fontSize: 13,
        fontWeight: '700',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridRow: {
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
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
    enableLocationButton: {
        marginTop: spacing.lg,
        borderRadius: 12,
        overflow: 'hidden',
    },
    enableLocationGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    enableLocationText: {
        ...typography.body,
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    bottomSpacing: {
        height: 100,
    },
});
