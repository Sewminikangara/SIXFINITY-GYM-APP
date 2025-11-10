import { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ImageBackground,
    Alert,
    Modal,
    Animated,
    Platform,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { palette, spacing, typography } from '@/theme';
import { filterGyms, getCountries, getCitiesByCountry, type Gym, type GymFilters } from '@/services/gymService';
import { AppStackParamList } from '@/navigation/types';

type GymFinderScreenNavigation = NativeStackNavigationProp<AppStackParamList, 'GymFinder'>;

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

const DISTANCE_OPTIONS = ['1 km', '3 km', '5 km', '10 km', '15 km', '20 km'];
const PRICE_OPTIONS = ['$', '$$', '$$$', '$$$$'];

export const GymFinderScreen = () => {
    const navigation = useNavigation<GymFinderScreenNavigation>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'favorites'>('list');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showFilterModal, setShowFilterModal] = useState<string | null>(null);

    // Filter states
    const [selectedCountry, setSelectedCountry] = useState<string>('Sri Lanka');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistance, setSelectedDistance] = useState('5 km');
    const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

    // Temporary states for modals (to allow cancellation)
    const [tempPriceRange, setTempPriceRange] = useState<string[]>([]);
    const [tempFacilities, setTempFacilities] = useState<string[]>([]);

    // Location & Gyms
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

    // Available cities for selected country
    const availableCities = getCitiesByCountry(selectedCountry);

    // Request location permission and get user location
    useEffect(() => {
        (async () => {
            try {
                console.log('Requesting location permission...');
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status !== 'granted') {
                    console.log('Location permission denied');
                    setLocationStatus('denied');
                    Alert.alert(
                        'Location Permission Required',
                        'To show nearby gyms, please enable location services in your device settings.',
                        [{ text: 'OK' }]
                    );
                    // Still load gyms without location
                    return;
                }

                console.log('Location permission granted, getting position...');
                setLocationStatus('granted');

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                console.log('User location:', location.coords.latitude, location.coords.longitude);
                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                Alert.alert(
                    'Location Found! 📍',
                    `Showing gyms near your location\nLat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`,
                    [{ text: 'Great!' }]
                );
            } catch (error) {
                console.error('Error getting location:', error);
                setLocationStatus('denied');
                Alert.alert(
                    'Location Error',
                    'Could not get your location. Showing all gyms instead.',
                    [{ text: 'OK' }]
                );
            }
        })();
    }, []);

    // Load gyms when filters change
    useEffect(() => {
        loadGyms();
    }, [selectedCountry, selectedCity, selectedDistance, selectedPriceRange, selectedFacilities, searchQuery, userLocation]);

    const loadGyms = () => {
        setLoading(true);

        // Auto-detect country based on GPS location if available
        let detectedCountry = selectedCountry;
        if (userLocation && selectedCountry === 'Sri Lanka') {
            const { latitude, longitude } = userLocation;

            // Sri Lanka: lat ~6-10, lng ~79-82
            // Dubai: lat ~24-26, lng ~54-56
            // Australia: lat ~-44 to -10, lng ~113-154

            if (latitude >= 6 && latitude <= 10 && longitude >= 79 && longitude <= 82) {
                detectedCountry = 'Sri Lanka';
                console.log('Detected location: Sri Lanka');
            } else if (latitude >= 24 && latitude <= 26 && longitude >= 54 && longitude <= 56) {
                detectedCountry = 'Dubai';
                console.log('Detected location: Dubai');
                if (selectedCountry !== 'Dubai') {
                    setSelectedCountry('Dubai');
                }
            } else if (latitude >= -44 && latitude <= -10 && longitude >= 113 && longitude <= 154) {
                detectedCountry = 'Australia';
                console.log('Detected location: Australia');
                if (selectedCountry !== 'Australia') {
                    setSelectedCountry('Australia');
                }
            }
        }

        const filters: GymFilters = {
            country: detectedCountry !== 'All' ? detectedCountry as any : undefined,
            city: selectedCity || undefined,
            searchQuery: searchQuery.trim() || undefined,
            maxDistance: selectedDistance ? parseFloat(selectedDistance.replace(' km', '')) : undefined,
            facilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
            priceRange: selectedPriceRange.length > 0 ? selectedPriceRange : undefined,
            userLocation: userLocation || undefined,
        };

        console.log('Filters applied:', JSON.stringify(filters, null, 2));
        const results = filterGyms(filters);
        console.log(`Found ${results.length} gyms`);

        // If we have user location, results are already sorted by distance
        setGyms(results);
        setLoading(false);
    };

    const toggleFilter = (filter: string) => {
        if (selectedFilters.includes(filter)) {
            setSelectedFilters(selectedFilters.filter(f => f !== filter));
        } else {
            setSelectedFilters([...selectedFilters, filter]);
        }
    };

    const clearFilters = () => {
        setSelectedFilters([]);
        setSelectedDistance('5 km');
        setSelectedPriceRange([]);
        setSelectedFacilities([]);
        setSelectedCountry('Sri Lanka');
        setSelectedCity('');
    };

    const toggleFavorite = (gymId: string) => {
        if (favorites.includes(gymId)) {
            setFavorites(favorites.filter(id => id !== gymId));
        } else {
            setFavorites([...favorites, gymId]);
        }
    };

    const handleSearch = () => {
        if (!searchQuery.trim() && !selectedCountry) {
            Alert.alert('Enter Location', 'Please enter a city or select a country');
            return;
        }
        loadGyms();
    };

    const handleGymPress = (gym: Gym) => {
        Alert.alert(
            gym.name,
            `${gym.location.city}, ${gym.location.country}\n${gym.distance || 'Distance unknown'}\nRating: ${gym.rating}⭐\nPrice: ${gym.priceRange}/month\n\n${gym.description}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Call',
                    onPress: () => Linking.openURL(`tel:${gym.phoneNumber}`)
                },
                {
                    text: 'Directions',
                    onPress: () => {
                        const scheme = Platform.select({
                            ios: 'maps:0,0?q=',
                            android: 'geo:0,0?q='
                        });
                        const latLng = `${gym.location.latitude},${gym.location.longitude}`;
                        const label = gym.name;
                        const url = Platform.select({
                            ios: `${scheme}${label}@${latLng}`,
                            android: `${scheme}${latLng}(${label})`
                        });
                        Linking.openURL(url!);
                    }
                }
            ]
        );
    };

    const openFilterModal = (filterType: string) => {
        // Initialize temp states with current values when opening modal
        if (filterType === 'price') {
            setTempPriceRange([...selectedPriceRange]);
        } else if (filterType === 'facilities') {
            setTempFacilities([...selectedFacilities]);
        }
        setShowFilterModal(filterType);
    };

    const applyFilter = (filterType: string, value: any) => {
        if (filterType === 'distance') {
            setSelectedDistance(value);
            if (!selectedFilters.includes('distance')) {
                setSelectedFilters([...selectedFilters, 'distance']);
            }
            setShowFilterModal(null);
        } else if (filterType === 'price') {
            setSelectedPriceRange(value);
            setTempPriceRange(value);
            if (value.length > 0 && !selectedFilters.includes('price')) {
                setSelectedFilters([...selectedFilters, 'price']);
            } else if (value.length === 0) {
                setSelectedFilters(selectedFilters.filter(f => f !== 'price'));
            }
            setShowFilterModal(null);
        } else if (filterType === 'facilities') {
            setSelectedFacilities(value);
            setTempFacilities(value);
            if (value.length > 0 && !selectedFilters.includes('facilities')) {
                setSelectedFilters([...selectedFilters, 'facilities']);
            } else if (value.length === 0) {
                setSelectedFilters(selectedFilters.filter(f => f !== 'facilities'));
            }
            setShowFilterModal(null);
        } else if (filterType === 'country') {
            setSelectedCountry(value);
            setSelectedCity(''); // Reset city when country changes
        }
    };

    const filteredGyms = gyms.filter(gym => {
        if (viewMode === 'favorites') {
            return favorites.includes(gym.id);
        }
        return true;
    });

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Icon key={`full-${i}`} name="star" size={16} color="#FFD700" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Icon key="half" name="star-half-full" size={16} color="#FFD700" />
            );
        }

        return stars;
    };

    const renderGymCard = (gym: Gym) => (
        <TouchableOpacity
            key={gym.id}
            style={[
                styles.gymCard,
                viewMode === 'grid' && styles.gymCardGrid
            ]}
            onPress={() => handleGymPress(gym)}
            activeOpacity={0.7}
        >
            <ImageBackground
                source={{ uri: gym.image }}
                style={[
                    styles.gymImage,
                    viewMode === 'grid' && styles.gymImageGrid
                ]}
                imageStyle={styles.gymImageStyle}
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
                        size={20}
                        color={favorites.includes(gym.id) ? "#FF4444" : palette.neonGreen}
                    />
                </TouchableOpacity>
            </ImageBackground>

            <View style={styles.gymInfo}>
                <Text style={styles.gymName}>{gym.name}</Text>

                <View style={styles.distanceRow}>
                    <Text style={styles.distanceLabel}>Distance</Text>
                    <Text style={styles.distanceValue}>{gym.distance}</Text>
                </View>

                <Text style={styles.gymDescription} numberOfLines={2}>
                    {gym.description}
                </Text>

                <Text style={styles.facilitiesLabel}>Facilities</Text>
                <View style={styles.facilitiesRow}>
                    {gym.facilities.map((facility) => (
                        <Icon
                            key={facility}
                            name={FACILITY_ICONS[facility] || 'check-circle'}
                            size={20}
                            color={palette.textPrimary}
                            style={styles.facilityIcon}
                        />
                    ))}
                </View>

                <View style={styles.ratingRow}>
                    <View style={styles.stars}>
                        {renderStars(gym.rating)}
                    </View>
                    <Text style={styles.ratingText}>{gym.rating} Rating</Text>
                </View>

                <TouchableOpacity style={styles.viewMoreButton}>
                    <LinearGradient
                        colors={[palette.neonGreen, palette.neonGreenDim]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.viewMoreGradient}
                    >
                        <Text style={styles.viewMoreText}>View Details</Text>
                        <Icon name="chevron-right" size={20} color={palette.background} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
                </TouchableOpacity>
                <Text style={styles.title}>Find Your Gym</Text>
            </View>

            {/* Location Status Banner */}
            {userLocation && (
                <View style={styles.locationBanner}>
                    <Icon name="map-marker" size={20} color={palette.neonGreen} />
                    <Text style={styles.locationBannerText}>
                        📍 Showing gyms near you • {gyms.length} gym{gyms.length !== 1 ? 's' : ''} found
                    </Text>
                </View>
            )}

            {locationStatus === 'loading' && (
                <View style={styles.locationBanner}>
                    <Icon name="loading" size={20} color={palette.textSecondary} />
                    <Text style={styles.locationBannerText}>Getting your location...</Text>
                </View>
            )}

            {/* Country Selector */}
            <View style={styles.countrySelector}>
                <Text style={styles.countrySelectorLabel}>Select Country:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryChips}>
                    {getCountries().map((country) => (
                        <TouchableOpacity
                            key={country}
                            style={[
                                styles.countryChip,
                                selectedCountry === country && styles.countryChipActive
                            ]}
                            onPress={() => applyFilter('country', country)}
                        >
                            <Text style={[
                                styles.countryChipText,
                                selectedCountry === country && styles.countryChipTextActive
                            ]}>
                                {country}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* City Selector (if country selected) */}
            {selectedCountry !== 'All' && availableCities.length > 0 && (
                <View style={styles.citySelector}>
                    <Text style={styles.citySelectorLabel}>Cities:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityChips}>
                        <TouchableOpacity
                            style={[
                                styles.cityChip,
                                !selectedCity && styles.cityChipActive
                            ]}
                            onPress={() => setSelectedCity('')}
                        >
                            <Text style={[
                                styles.cityChipText,
                                !selectedCity && styles.cityChipTextActive
                            ]}>
                                All
                            </Text>
                        </TouchableOpacity>
                        {availableCities.map((city) => (
                            <TouchableOpacity
                                key={city}
                                style={[
                                    styles.cityChip,
                                    selectedCity === city && styles.cityChipActive
                                ]}
                                onPress={() => setSelectedCity(city)}
                            >
                                <Text style={[
                                    styles.cityChipText,
                                    selectedCity === city && styles.cityChipTextActive
                                ]}>
                                    {city}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="magnify" size={20} color={palette.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search gym name..."
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
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[palette.neonGreen, palette.neonGreenDim]}
                        style={styles.searchButtonGradient}
                    >
                        <Text style={styles.searchButtonText}>search</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterButtons}>
                <TouchableOpacity
                    style={[styles.filterButton, selectedFilters.includes('distance') && styles.filterButtonActive]}
                    onPress={() => openFilterModal('distance')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.filterButtonText}>Distance</Text>
                    <Icon name="chevron-down" size={16} color={palette.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, selectedFilters.includes('facilities') && styles.filterButtonActive]}
                    onPress={() => openFilterModal('facilities')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.filterButtonText}>Facilities</Text>
                    <Icon name="chevron-down" size={16} color={palette.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, selectedFilters.includes('price') && styles.filterButtonActive]}
                    onPress={() => openFilterModal('price')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.filterButtonText}>Price Range</Text>
                    <Icon name="chevron-down" size={16} color={palette.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Filter Dots Indicator */}
            <View style={styles.dotsContainer}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
            </View>

            {/* Active Filters */}
            {(selectedFilters.length > 0 || selectedCountry !== 'Sri Lanka') && (
                <View style={styles.activeFilters}>
                    {selectedCountry !== 'Sri Lanka' && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>{selectedCountry}</Text>
                            <TouchableOpacity onPress={() => setSelectedCountry('Sri Lanka')}>
                                <Icon name="close" size={16} color={palette.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {selectedFilters.includes('distance') && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>≤ {selectedDistance}</Text>
                            <TouchableOpacity onPress={() => toggleFilter('distance')}>
                                <Icon name="close" size={16} color={palette.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {selectedFilters.includes('price') && selectedPriceRange.length > 0 && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>Price: {selectedPriceRange.join(', ')}</Text>
                            <TouchableOpacity onPress={() => {
                                toggleFilter('price');
                                setSelectedPriceRange([]);
                            }}>
                                <Icon name="close" size={16} color={palette.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {selectedFilters.includes('facilities') && selectedFacilities.length > 0 && (
                        <View style={styles.filterChip}>
                            <Text style={styles.filterChipText}>{selectedFacilities.length} Facilities</Text>
                            <TouchableOpacity onPress={() => toggleFilter('facilities')}>
                                <Icon name="close" size={16} color={palette.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.filterChip, styles.clearAllChip]}
                        onPress={clearFilters}
                    >
                        <Text style={styles.filterChipText}>Clear All</Text>
                        <Icon name="close" size={16} color={palette.textPrimary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* View Mode Toggle */}
            <View style={styles.viewModeContainer}>
                <TouchableOpacity
                    style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                    onPress={() => setViewMode('list')}
                    activeOpacity={0.7}
                >
                    <Icon
                        name="view-list"
                        size={24}
                        color={viewMode === 'list' ? palette.neonGreen : palette.textSecondary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
                    onPress={() => setViewMode('grid')}
                    activeOpacity={0.7}
                >
                    <Icon
                        name="view-grid"
                        size={24}
                        color={viewMode === 'grid' ? palette.neonGreen : palette.textSecondary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.viewModeButton, viewMode === 'favorites' && styles.viewModeButtonActive]}
                    onPress={() => setViewMode('favorites')}
                    activeOpacity={0.7}
                >
                    <Icon
                        name={viewMode === 'favorites' ? "heart" : "heart-outline"}
                        size={24}
                        color={viewMode === 'favorites' ? palette.neonGreen : palette.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Gym List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.gymList}
                showsVerticalScrollIndicator={false}
            >
                {viewMode === 'favorites' && filteredGyms.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="heart-outline" size={64} color={palette.textSecondary} />
                        <Text style={styles.emptyStateText}>No favorites yet</Text>
                        <Text style={styles.emptyStateSubtext}>Add gyms to your favorites to see them here</Text>
                    </View>
                ) : filteredGyms.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="magnify" size={64} color={palette.textSecondary} />
                        <Text style={styles.emptyStateText}>No gyms found</Text>
                        <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
                    </View>
                ) : (
                    <>
                        <View style={viewMode === 'grid' ? styles.gridContainer : undefined}>
                            {filteredGyms.map(renderGymCard)}
                        </View>

                        {/* View More Button */}
                        {filteredGyms.length >= 4 && (
                            <TouchableOpacity
                                style={styles.viewMoreAllButton}
                                onPress={() => Alert.alert('Load More', 'Loading more gyms...')}
                            >
                                <Text style={styles.viewMoreAllText}>View More Gyms</Text>
                                <View style={styles.viewMoreIconCircle}>
                                    <Icon name="chevron-down" size={24} color={palette.neonGreen} />
                                </View>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* Location-based Search */}
                <View style={styles.locationSection}>
                    <Text style={styles.locationTitle}>Location-based search</Text>
                    <View style={styles.mapPlaceholder}>
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&h=400&fit=crop' }}
                            style={styles.mapImage}
                            imageStyle={styles.mapImageStyle}
                        >
                            <TouchableOpacity
                                style={styles.mapViewButton}
                                onPress={() => navigation.navigate('GymMap')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                                    style={styles.mapViewGradient}
                                >
                                    <Text style={styles.mapViewText}>Map view</Text>
                                    <Icon name="chevron-right" size={20} color={palette.background} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </ImageBackground>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Filter Modals */}
            <Modal
                visible={showFilterModal !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Distance Filter */}
                        {showFilterModal === 'distance' && (
                            <>
                                <Text style={styles.modalTitle}>Select Distance</Text>
                                {DISTANCE_OPTIONS.map((dist) => (
                                    <TouchableOpacity
                                        key={dist}
                                        style={[
                                            styles.modalOption,
                                            selectedDistance === dist && styles.modalOptionSelected
                                        ]}
                                        onPress={() => applyFilter('distance', dist)}
                                    >
                                        <Text style={[
                                            styles.modalOptionText,
                                            selectedDistance === dist && styles.modalOptionTextSelected
                                        ]}>
                                            Within {dist}
                                        </Text>
                                        {selectedDistance === dist && (
                                            <Icon name="check-circle" size={24} color={palette.neonGreen} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {/* Price Filter */}
                        {showFilterModal === 'price' && (
                            <>
                                <Text style={styles.modalTitle}>Select Price Range</Text>
                                {PRICE_OPTIONS.map((price) => (
                                    <TouchableOpacity
                                        key={price}
                                        style={[
                                            styles.modalOption,
                                            tempPriceRange.includes(price) && styles.modalOptionSelected
                                        ]}
                                        onPress={() => {
                                            const newRange = tempPriceRange.includes(price)
                                                ? tempPriceRange.filter(p => p !== price)
                                                : [...tempPriceRange, price];
                                            setTempPriceRange(newRange);
                                        }}
                                    >
                                        <Text style={[
                                            styles.modalOptionText,
                                            tempPriceRange.includes(price) && styles.modalOptionTextSelected
                                        ]}>
                                            {price === '$' && 'Budget (Under $30/month)'}
                                            {price === '$$' && 'Affordable ($30-$70/month)'}
                                            {price === '$$$' && 'Premium ($70-$120/month)'}
                                            {price === '$$$$' && 'Luxury ($120+/month)'}
                                        </Text>
                                        {tempPriceRange.includes(price) && (
                                            <Icon name="check-circle" size={24} color={palette.neonGreen} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={styles.modalApplyButton}
                                    onPress={() => applyFilter('price', tempPriceRange)}
                                >
                                    <LinearGradient
                                        colors={[palette.neonGreen, palette.neonGreenDim]}
                                        style={styles.modalApplyGradient}
                                    >
                                        <Text style={styles.modalApplyText}>Apply Price Filter</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Facilities Filter */}
                        {showFilterModal === 'facilities' && (
                            <>
                                <Text style={styles.modalTitle}>Select Facilities</Text>
                                <ScrollView style={{ maxHeight: 400 }}>
                                    {Object.keys(FACILITY_ICONS).map((facility) => (
                                        <TouchableOpacity
                                            key={facility}
                                            style={[
                                                styles.modalOption,
                                                tempFacilities.includes(facility) && styles.modalOptionSelected
                                            ]}
                                            onPress={() => {
                                                const newFacilities = tempFacilities.includes(facility)
                                                    ? tempFacilities.filter(f => f !== facility)
                                                    : [...tempFacilities, facility];
                                                setTempFacilities(newFacilities);
                                            }}
                                        >
                                            <View style={styles.facilityOption}>
                                                <Icon
                                                    name={FACILITY_ICONS[facility]}
                                                    size={24}
                                                    color={palette.textPrimary}
                                                />
                                                <Text style={[
                                                    styles.modalOptionText,
                                                    tempFacilities.includes(facility) && styles.modalOptionTextSelected
                                                ]}>
                                                    {facility.charAt(0).toUpperCase() + facility.slice(1)}
                                                </Text>
                                            </View>
                                            {tempFacilities.includes(facility) && (
                                                <Icon name="check-circle" size={24} color={palette.neonGreen} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity
                                    style={styles.modalApplyButton}
                                    onPress={() => applyFilter('facilities', tempFacilities)}
                                >
                                    <LinearGradient
                                        colors={[palette.neonGreen, palette.neonGreenDim]}
                                        style={styles.modalApplyGradient}
                                    >
                                        <Text style={styles.modalApplyText}>Apply Filters</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowFilterModal(null)}
                        >
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    backText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
    },
    title: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 32,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
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
    searchButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    searchButtonGradient: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchButtonText: {
        ...typography.body,
        color: palette.background,
        fontSize: 14,
        fontWeight: '600',
    },
    filterButtons: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.background,
        borderWidth: 1.5,
        borderColor: palette.border,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    filterButtonActive: {
        borderColor: palette.neonGreen,
        backgroundColor: `${palette.neonGreen}15`,
    },
    filterButtonText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
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
    activeFilters: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 16,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        gap: spacing.xs,
    },
    filterChipText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 12,
    },
    clearAllChip: {
        backgroundColor: `${palette.neonGreen}20`,
        borderWidth: 1,
        borderColor: palette.neonGreen,
    },
    viewModeContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    viewModeButton: {
        padding: spacing.xs,
        borderRadius: 8,
    },
    viewModeButtonActive: {
        backgroundColor: `${palette.neonGreen}20`,
    },
    scrollView: {
        flex: 1,
    },
    gymList: {
        paddingHorizontal: spacing.lg,
    },
    gymCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    gymImage: {
        width: '100%',
        height: 140,
        position: 'relative',
    },
    gymImageStyle: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    favoriteButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(18, 18, 18, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gymInfo: {
        padding: spacing.md,
    },
    gymName: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    distanceLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    distanceValue: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    gymDescription: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        marginBottom: spacing.sm,
    },
    facilitiesLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: spacing.xs,
    },
    facilitiesRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    facilityIcon: {
        marginRight: spacing.xs,
    },
    ratingRow: {
        flexDirection: 'row',
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
        fontSize: 12,
        fontWeight: '600',
    },
    viewMoreButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    viewMoreGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    viewMoreText: {
        ...typography.body,
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    viewMoreAllButton: {
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    viewMoreAllText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    viewMoreIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    locationSection: {
        marginTop: spacing.lg,
    },
    locationTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    mapPlaceholder: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
    },
    mapImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapImageStyle: {
        borderRadius: 16,
    },
    mapViewButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    mapViewGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        gap: spacing.xs,
    },
    mapViewText: {
        ...typography.body,
        color: palette.background,
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 100,
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
    // Grid View Styles
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gymCardGrid: {
        width: (width - spacing.lg * 3) / 2,
        marginBottom: spacing.md,
    },
    gymImageGrid: {
        height: 120,
    },
    // Country & City Selector Styles
    countrySelector: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    countrySelectorLabel: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    countryChips: {
        flexDirection: 'row',
    },
    countryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: palette.surface,
        borderRadius: 20,
        marginRight: spacing.sm,
        borderWidth: 1.5,
        borderColor: palette.border,
    },
    countryChipActive: {
        backgroundColor: `${palette.neonGreen}20`,
        borderColor: palette.neonGreen,
    },
    countryChipText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    countryChipTextActive: {
        color: palette.neonGreen,
        fontWeight: '700',
    },
    citySelector: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    citySelectorLabel: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: spacing.xs,
    },
    cityChips: {
        flexDirection: 'row',
    },
    cityChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: palette.background,
        borderRadius: 16,
        marginRight: spacing.xs,
        borderWidth: 1,
        borderColor: palette.border,
    },
    cityChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    cityChipText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    cityChipTextActive: {
        color: palette.background,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: palette.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxxl,
        paddingHorizontal: spacing.lg,
        maxHeight: '70%',
    },
    modalTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 24,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: palette.background,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        marginBottom: spacing.sm,
        borderWidth: 1.5,
        borderColor: palette.border,
    },
    modalOptionSelected: {
        borderColor: palette.neonGreen,
        backgroundColor: `${palette.neonGreen}10`,
    },
    modalOptionText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '500',
    },
    modalOptionTextSelected: {
        color: palette.neonGreen,
        fontWeight: '700',
    },
    facilityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    modalApplyButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: spacing.lg,
    },
    modalApplyGradient: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    modalApplyText: {
        ...typography.body,
        color: palette.background,
        fontSize: 16,
        fontWeight: '700',
    },
    modalCloseButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    modalCloseText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 16,
    },
});
