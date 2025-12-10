import { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Platform,
    Linking,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing, typography } from '@/theme';
import { filterGyms, type Gym, type GymFilters } from '@/services/gymService';

const { width, height } = Dimensions.get('window');

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
};

// Sri Lanka major cities with coordinates
const SRI_LANKA_LOCATIONS = [
    { name: 'Colombo', latitude: 6.9271, longitude: 79.8612 },
    { name: 'Kandy', latitude: 7.2906, longitude: 80.6337 },
    { name: 'Galle', latitude: 6.0535, longitude: 80.2210 },
    { name: 'Negombo', latitude: 7.2008, longitude: 79.8358 },
    { name: 'Nugegoda', latitude: 6.8649, longitude: 79.8997 },
    { name: 'Mount Lavinia', latitude: 6.8382, longitude: 79.8634 },
    { name: 'Dehiwala', latitude: 6.8563, longitude: 79.8632 },
    { name: 'Moratuwa', latitude: 6.7730, longitude: 79.8816 },
    { name: 'Battaramulla', latitude: 6.8987, longitude: 79.9185 },
    { name: 'Rajagiriya', latitude: 6.9147, longitude: 79.8910 },
];

export const GymMapScreen = () => {
    const navigation = useNavigation();
    const mapRef = useRef<MapView>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;

    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchSuggestions, setSearchSuggestions] = useState<typeof SRI_LANKA_LOCATIONS>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 6.9271, // Colombo center
        longitude: 79.8612,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
    });

    useEffect(() => {
        initializeMap();
    }, []);

    useEffect(() => {
        if (searchQuery.length > 0) {
            const filtered = SRI_LANKA_LOCATIONS.filter(loc =>
                loc.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSearchSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery]);

    const initializeMap = async () => {
        try {
            setLoading(true);

            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };

                setUserLocation(coords);
                setMapRegion({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                });

                loadNearbyGyms(coords.latitude, coords.longitude);
            } else {
                // Default to Colombo
                loadNearbyGyms(6.9271, 79.8612);
            }
        } catch (error) {
            console.error('Map initialization error:', error);
            loadNearbyGyms(6.9271, 79.8612);
        } finally {
            setLoading(false);
        }
    };

    const loadNearbyGyms = async (lat: number, lng: number) => {
        const filters: GymFilters = {
            country: 'Sri Lanka',
            userLocation: { latitude: lat, longitude: lng },
            maxDistance: 50, // 50km radius
        };

        const results = await filterGyms(filters);
        setGyms(results);
    };

    const handleSearch = (locationName: string) => {
        const location = SRI_LANKA_LOCATIONS.find(
            loc => loc.name.toLowerCase() === locationName.toLowerCase()
        );

        if (location) {
            const newRegion = {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            };

            setMapRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            loadNearbyGyms(location.latitude, location.longitude);
            setSearchQuery(location.name);
            setShowSuggestions(false);
        } else {
            Alert.alert('Location Not Found', 'Please select a location from suggestions');
        }
    };

    const handleMarkerPress = (gym: Gym) => {
        setSelectedGym(gym);

        // Animate card up
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();

        // Center map on selected gym
        mapRef.current?.animateToRegion({
            latitude: gym.location.latitude,
            longitude: gym.location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }, 500);
    };

    const closeGymDetails = () => {
        Animated.spring(slideAnim, {
            toValue: 300,
            useNativeDriver: true,
        }).start(() => {
            setSelectedGym(null);
        });
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(coords);
            setMapRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            });

            mapRef.current?.animateToRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }, 1000);

            loadNearbyGyms(coords.latitude, coords.longitude);
        } catch (error) {
            Alert.alert('Location Error', 'Could not get your current location');
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Icon key={i} name="star" size={12} color="#FFD700" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<Icon key={i} name="star-half-full" size={12} color="#FFD700" />);
            } else {
                stars.push(<Icon key={i} name="star-outline" size={12} color="#FFD700" />);
            }
        }
        return stars;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[palette.background, 'rgba(18, 18, 18, 0.95)']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Icon name="arrow-left" size={24} color={palette.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Find Nearby Gyms</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Icon name="magnify" size={20} color={palette.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search location (e.g., Colombo, Kandy)"
                            placeholderTextColor={palette.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                            onSubmitEditing={() => handleSearch(searchQuery)}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Icon name="close-circle" size={20} color={palette.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={() => handleSearch(searchQuery)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            style={styles.searchButtonGradient}
                        >
                            <Icon name="magnify" size={20} color={palette.background} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Search Suggestions */}
                {showSuggestions && (
                    <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
                        <Text style={styles.suggestionsTitle}>Suggestions</Text>
                        {searchSuggestions.map((location) => (
                            <TouchableOpacity
                                key={location.name}
                                style={styles.suggestionItem}
                                onPress={() => handleSearch(location.name)}
                            >
                                <Icon name="map-marker" size={20} color={palette.neonGreen} />
                                <Text style={styles.suggestionText}>{location.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Gym Count Badge */}
                <View style={styles.gymCountBadge}>
                    <Icon name="dumbbell" size={16} color={palette.neonGreen} />
                    <Text style={styles.gymCountText}>
                        {gyms.length} gym{gyms.length !== 1 ? 's' : ''} found nearby
                    </Text>
                </View>
            </LinearGradient>

            {/* Map */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.neonGreen} />
                    <Text style={styles.loadingText}>Loading map...</Text>
                </View>
            ) : (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={mapRegion}
                    region={mapRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    showsCompass={true}
                    customMapStyle={MAP_STYLE}
                >
                    {gyms.map((gym) => (
                        <Marker
                            key={gym.id}
                            coordinate={{
                                latitude: gym.location.latitude,
                                longitude: gym.location.longitude,
                            }}
                            onPress={() => handleMarkerPress(gym)}
                        >
                            <View style={styles.markerContainer}>
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    style={styles.marker}
                                >
                                    <Icon name="dumbbell" size={20} color={palette.background} />
                                </LinearGradient>
                                <View style={styles.markerArrow} />
                            </View>
                        </Marker>
                    ))}
                </MapView>
            )}

            {/* Current Location Button */}
            <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[palette.neonGreen, palette.neonGreenDim]}
                    style={styles.currentLocationGradient}
                >
                    <Icon name="crosshairs-gps" size={24} color={palette.background} />
                </LinearGradient>
            </TouchableOpacity>

            {/* Selected Gym Details Card */}
            {selectedGym && (
                <Animated.View
                    style={[
                        styles.gymDetailsCard,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <View style={styles.cardHandle} />

                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Text style={styles.gymName} numberOfLines={1}>
                                {selectedGym.name}
                            </Text>
                            <View style={styles.locationRow}>
                                <Icon name="map-marker" size={14} color={palette.neonGreen} />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {selectedGym.location.city}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={closeGymDetails}
                        >
                            <Icon name="close" size={24} color={palette.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardContent}>
                        {selectedGym.distance && (
                            <View style={styles.distanceChip}>
                                <Icon name="navigation" size={14} color={palette.neonGreen} />
                                <Text style={styles.distanceText}>{selectedGym.distance}</Text>
                            </View>
                        )}

                        <View style={styles.ratingRow}>
                            <View style={styles.stars}>{renderStars(selectedGym.rating)}</View>
                            <Text style={styles.ratingText}>{selectedGym.rating}</Text>
                            <Text style={styles.reviewText}>({selectedGym.reviewCount} reviews)</Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={styles.priceRange}>{selectedGym.priceRange}</Text>
                            <Text style={styles.priceText}>
                                LKR {selectedGym.pricePerMonth.toLocaleString()}/month
                            </Text>
                        </View>

                        <Text style={styles.facilitiesLabel}>Facilities</Text>
                        <View style={styles.facilitiesRow}>
                            {selectedGym.facilities.slice(0, 8).map((facility) => (
                                <View key={facility} style={styles.facilityBadge}>
                                    <Icon
                                        name={FACILITY_ICONS[facility] || 'check-circle'}
                                        size={16}
                                        color={palette.neonGreen}
                                    />
                                </View>
                            ))}
                            {selectedGym.facilities.length > 8 && (
                                <Text style={styles.moreFacilities}>
                                    +{selectedGym.facilities.length - 8}
                                </Text>
                            )}
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                    const scheme = Platform.select({
                                        ios: 'maps:0,0?q=',
                                        android: 'geo:0,0?q='
                                    });
                                    const latLng = `${selectedGym.location.latitude},${selectedGym.location.longitude}`;
                                    const label = selectedGym.name;
                                    const url = Platform.select({
                                        ios: `${scheme}${label}@${latLng}`,
                                        android: `${scheme}${latLng}(${label})`
                                    });
                                    Linking.openURL(url!);
                                }}
                            >
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    style={styles.actionButtonGradient}
                                >
                                    <Icon name="directions" size={20} color={palette.background} />
                                    <Text style={styles.actionButtonText}>Directions</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonSecondary]}
                                onPress={() => Linking.openURL(`tel:${selectedGym.phoneNumber}`)}
                            >
                                <Icon name="phone" size={20} color={palette.neonGreen} />
                                <Text style={styles.actionButtonTextSecondary}>Call</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

// Dark map style for better UI
const MAP_STYLE = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#2c2c2c" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }]
    }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        paddingTop: spacing.xxxl,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    placeholder: {
        width: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
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
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionsContainer: {
        maxHeight: 200,
        backgroundColor: palette.surface,
        borderRadius: 12,
        marginTop: spacing.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    suggestionsTitle: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    suggestionText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
    },
    gymCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing.xs,
        backgroundColor: `${palette.neonGreen}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
    },
    gymCountText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        color: palette.textSecondary,
        marginTop: spacing.md,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: palette.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: palette.neonGreen,
        marginTop: -2,
    },
    currentLocationButton: {
        position: 'absolute',
        bottom: 320,
        right: spacing.lg,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    currentLocationGradient: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gymDetailsCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: palette.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    cardHandle: {
        width: 40,
        height: 4,
        backgroundColor: palette.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    cardHeaderLeft: {
        flex: 1,
        marginRight: spacing.md,
    },
    gymName: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    locationText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: palette.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        gap: spacing.sm,
    },
    distanceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing.xs,
        backgroundColor: `${palette.neonGreen}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    distanceText: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '700',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: spacing.xs,
    },
    reviewText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    priceRange: {
        ...typography.body,
        color: palette.neonGreen,
        fontSize: 16,
        fontWeight: '700',
    },
    priceText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    facilitiesLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginTop: spacing.xs,
    },
    facilitiesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        alignItems: 'center',
    },
    facilityBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${palette.neonGreen}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreFacilities: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        marginLeft: spacing.xs,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
    },
    actionButtonText: {
        ...typography.body,
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    actionButtonSecondary: {
        backgroundColor: palette.background,
        borderWidth: 1.5,
        borderColor: palette.neonGreen,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
    },
    actionButtonTextSecondary: {
        ...typography.body,
        color: palette.neonGreen,
        fontSize: 14,
        fontWeight: '700',
    },
});
