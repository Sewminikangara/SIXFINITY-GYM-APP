import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';

const { width } = Dimensions.get('window');

export interface GymFilterOptions {
    selectedDistance: number;
    selectedFacilities: string[];
    priceRange: string[];
    minRating: number;
    openNowOnly: boolean;
}

interface GymFiltersModalProps {
    visible: boolean;
    onClose: () => void;
    filters: GymFilterOptions;
    onApplyFilters: (filters: GymFilterOptions) => void;
}

const FACILITIES = [
    { id: 'pool', label: 'Swimming Pool', icon: 'pool' },
    { id: 'sauna', label: 'Sauna', icon: 'hot-tub' },
    { id: 'classes', label: 'Group Classes', icon: 'account-group' },
    { id: 'equipment', label: 'Gym Equipment', icon: 'dumbbell' },
    { id: 'parking', label: 'Parking', icon: 'parking' },
    { id: 'locker', label: 'Lockers', icon: 'locker' },
    { id: 'shower', label: 'Showers', icon: 'shower' },
    { id: 'wifi', label: 'WiFi', icon: 'wifi' },
];

const PRICE_RANGES = [
    { id: 'low', label: 'Low', symbol: '$' },
    { id: 'medium', label: 'Medium', symbol: '$$' },
    { id: 'high', label: 'High', symbol: '$$$' },
];

export const GymFiltersModal: React.FC<GymFiltersModalProps> = ({
    visible,
    onClose,
    filters,
    onApplyFilters,
}) => {
    const [distance, setDistance] = useState(filters.selectedDistance);
    const [facilities, setFacilities] = useState<string[]>(filters.selectedFacilities);
    const [priceRanges, setPriceRanges] = useState<string[]>(filters.priceRange);
    const [rating, setRating] = useState(filters.minRating);
    const [openNow, setOpenNow] = useState(filters.openNowOnly);

    const toggleFacility = (facilityId: string) => {
        setFacilities(prev =>
            prev.includes(facilityId)
                ? prev.filter(f => f !== facilityId)
                : [...prev, facilityId]
        );
    };

    const togglePriceRange = (rangeId: string) => {
        setPriceRanges(prev =>
            prev.includes(rangeId)
                ? prev.filter(p => p !== rangeId)
                : [...prev, rangeId]
        );
    };

    const handleReset = () => {
        setDistance(50);
        setFacilities([]);
        setPriceRanges([]);
        setRating(0);
        setOpenNow(false);
    };

    const handleApply = () => {
        onApplyFilters({
            selectedDistance: distance,
            selectedFacilities: facilities,
            priceRange: priceRanges,
            minRating: rating,
            openNowOnly: openNow,
        });
        onClose();
    };

    const hasAnyFilters = () => {
        return facilities.length > 0 ||
            priceRanges.length > 0 ||
            rating > 0 ||
            openNow ||
            distance !== 50;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Filters</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={palette.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Distance Filter */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Distance</Text>
                            <Text style={styles.sectionSubtitle}>Within radius (default: 50 km)</Text>
                            <View style={styles.distanceRow}>
                                {[1, 5, 10, 25, 50].map(dist => (
                                    <TouchableOpacity
                                        key={dist}
                                        style={[
                                            styles.distanceChip,
                                            distance === dist && styles.distanceChipActive
                                        ]}
                                        onPress={() => setDistance(dist)}
                                    >
                                        <Text style={[
                                            styles.distanceChipText,
                                            distance === dist && styles.distanceChipTextActive
                                        ]}>
                                            {dist} km
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Facilities Filter */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Facilities</Text>
                            <View style={styles.facilitiesGrid}>
                                {FACILITIES.map(facility => (
                                    <TouchableOpacity
                                        key={facility.id}
                                        style={[
                                            styles.facilityChip,
                                            facilities.includes(facility.id) && styles.facilityChipActive
                                        ]}
                                        onPress={() => toggleFacility(facility.id)}
                                    >
                                        <Icon
                                            name={facility.icon}
                                            size={20}
                                            color={facilities.includes(facility.id) ? '#000' : palette.textSecondary}
                                        />
                                        <Text style={[
                                            styles.facilityLabel,
                                            facilities.includes(facility.id) && styles.facilityLabelActive
                                        ]}>
                                            {facility.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Price Range Filter */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Price Range</Text>
                            <View style={styles.priceRow}>
                                {PRICE_RANGES.map(price => (
                                    <TouchableOpacity
                                        key={price.id}
                                        style={[
                                            styles.priceChip,
                                            priceRanges.includes(price.id) && styles.priceChipActive
                                        ]}
                                        onPress={() => togglePriceRange(price.id)}
                                    >
                                        <Text style={[
                                            styles.priceSymbol,
                                            priceRanges.includes(price.id) && styles.priceSymbolActive
                                        ]}>
                                            {price.symbol}
                                        </Text>
                                        <Text style={[
                                            styles.priceLabel,
                                            priceRanges.includes(price.id) && styles.priceLabelActive
                                        ]}>
                                            {price.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Rating Filter */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Minimum Rating</Text>
                            <View style={styles.ratingRow}>
                                {[0, 3, 4, 5].map(stars => (
                                    <TouchableOpacity
                                        key={stars}
                                        style={[
                                            styles.ratingChip,
                                            rating === stars && styles.ratingChipActive
                                        ]}
                                        onPress={() => setRating(stars)}
                                    >
                                        {stars === 0 ? (
                                            <Text style={[
                                                styles.ratingLabel,
                                                rating === stars && styles.ratingLabelActive
                                            ]}>
                                                Any
                                            </Text>
                                        ) : (
                                            <>
                                                <Icon
                                                    name="star"
                                                    size={16}
                                                    color={rating === stars ? '#000' : palette.neonGreen}
                                                />
                                                <Text style={[
                                                    styles.ratingLabel,
                                                    rating === stars && styles.ratingLabelActive
                                                ]}>
                                                    {stars}+
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Open Now Toggle */}
                        <View style={styles.section}>
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleLeft}>
                                    <Icon name="clock-check-outline" size={24} color={palette.textPrimary} />
                                    <Text style={styles.toggleLabel}>Open Now</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.toggle, openNow && styles.toggleActive]}
                                    onPress={() => setOpenNow(!openNow)}
                                >
                                    <View style={[styles.toggleThumb, openNow && styles.toggleThumbActive]} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={styles.footer}>
                        {hasAnyFilters() && (
                            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                                <Text style={styles.resetButtonText}>Reset All</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.applyButton,
                                !hasAnyFilters() && styles.applyButtonFull
                            ]}
                            onPress={handleApply}
                        >
                            <Text style={styles.applyButtonText}>
                                {hasAnyFilters() ? 'Apply Filters' : 'Close'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: palette.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        padding: spacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: spacing.md,
    },
    distanceRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    distanceChip: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
    },
    distanceChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    distanceChipText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    distanceChipTextActive: {
        color: '#000',
        fontWeight: '700',
    },
    facilitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    facilityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    facilityChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    facilityLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    facilityLabelActive: {
        color: '#000',
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    priceChip: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    priceChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    priceSymbol: {
        ...typography.body,
        color: palette.neonGreen,
        fontSize: 20,
        fontWeight: '700',
    },
    priceSymbolActive: {
        color: '#000',
    },
    priceLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
    priceLabelActive: {
        color: '#000',
        fontWeight: '600',
    },
    ratingRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    ratingChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ratingChipActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    ratingLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    ratingLabelActive: {
        color: '#000',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    toggleLabel: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '500',
    },
    toggle: {
        width: 51,
        height: 31,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: palette.neonGreen,
    },
    toggleThumb: {
        width: 27,
        height: 27,
        borderRadius: 13.5,
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
    },
    toggleThumbActive: {
        alignSelf: 'flex-end',
        backgroundColor: '#000',
    },
    footer: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    resetButton: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    resetButtonText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    applyButton: {
        flex: 2,
        paddingVertical: spacing.md,
        backgroundColor: palette.neonGreen,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButtonFull: {
        flex: 1,
    },
    applyButtonText: {
        ...typography.body,
        color: '#000',
        fontSize: 15,
        fontWeight: '700',
    },
});
