import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

type OfferStatus = 'available' | 'claimed' | 'expired';

interface Offer {
    id: string;
    title: string;
    description: string;
    discount: string;
    icon: string;
    validUntil: Date;
    status: OfferStatus;
    terms: string[];
    code?: string;
    category: 'gym' | 'trainer' | 'class' | 'general';
}

export default function OffersScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<OfferStatus>('available');
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Placeholder data
    const offers: Offer[] = [
        {
            id: '1',
            title: 'New Year Fitness Sale',
            description: 'Get 30% off on all gym memberships',
            discount: '30% OFF',
            icon: '',
            validUntil: new Date(Date.now() + 15 * 86400000),
            status: 'available',
            terms: [
                'Valid for new memberships only',
                'Cannot be combined with other offers',
                'Minimum 3-month subscription required',
                'Offer expires on specified date',
            ],
            category: 'gym',
        },
        {
            id: '2',
            title: 'Trainer Session Combo',
            description: 'Buy 5 sessions, get 1 free',
            discount: 'BUY 5 GET 1',
            icon: '',
            validUntil: new Date(Date.now() + 30 * 86400000),
            status: 'available',
            terms: [
                'Valid for personal training sessions only',
                'All 6 sessions must be used within 2 months',
                'Non-transferable',
                'Cannot be redeemed for cash',
            ],
            category: 'trainer',
        },
        {
            id: '3',
            title: 'Weekend Warrior',
            description: 'Rs. 500 off on weekend bookings',
            discount: 'Rs. 500 OFF',
            icon: '',
            validUntil: new Date(Date.now() + 7 * 86400000),
            status: 'available',
            terms: [
                'Valid only on Saturdays and Sundays',
                'Minimum booking value Rs. 1000',
                'Limited to 2 bookings per user',
                'First come, first served',
            ],
            category: 'gym',
        },
        {
            id: '4',
            title: 'First Booking Discount',
            description: 'Flat 20% off on your first booking',
            discount: '20% OFF',
            icon: '',
            validUntil: new Date(Date.now() + 60 * 86400000),
            status: 'claimed',
            code: 'FIRST200',
            terms: [
                'Valid for first-time users only',
                'One-time use per account',
                'Minimum booking value Rs. 500',
                'Code will be applied automatically',
            ],
            category: 'general',
        },
        {
            id: '5',
            title: 'Yoga Class Bundle',
            description: '20% off on 10+ yoga class bookings',
            discount: '20% OFF',
            icon: '',
            validUntil: new Date(Date.now() + 45 * 86400000),
            status: 'claimed',
            code: 'YOGA20',
            terms: [
                'Valid for yoga classes only',
                'Minimum 10 classes must be booked together',
                'All classes must be used within 3 months',
                'Cannot be combined with other offers',
            ],
            category: 'class',
        },
        {
            id: '6',
            title: 'Summer Special',
            description: 'Free month on annual membership',
            discount: '1 MONTH FREE',
            icon: '',
            validUntil: new Date(Date.now() - 5 * 86400000),
            status: 'expired',
            terms: [
                'Valid for annual memberships only',
                'Free month added at the end of subscription',
                'Non-refundable',
                'Offer has expired',
            ],
            category: 'gym',
        },
    ];

    const filteredOffers = offers.filter((offer) => offer.status === activeTab);

    const getDaysRemaining = (date: Date) => {
        const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return 'Expired';
        if (days === 0) return 'Expires today';
        if (days === 1) return 'Expires tomorrow';
        return `${days} days left`;
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'gym':
                return palette.brandPrimary;
            case 'trainer':
                return palette.success;
            case 'class':
                return palette.warning;
            case 'general':
                return palette.brandSecondary;
            default:
                return palette.textSecondary;
        }
    };

    const handleClaimOffer = (offer: Offer) => {
        Alert.alert(
            'Claim Offer',
            `Claim "${offer.title}"? The offer code will be added to your account.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Claim',
                    onPress: () => {
                        Alert.alert(
                            'Success!',
                            `Offer claimed! Your code is: OFFER${Math.random().toString(36).substring(7).toUpperCase()}`
                        );
                        setShowDetails(false);
                    },
                },
            ]
        );
    };

    const handleViewDetails = (offer: Offer) => {
        setSelectedOffer(offer);
        setShowDetails(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Offers</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'available' && styles.activeTab]}
                    onPress={() => setActiveTab('available')}
                >
                    <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
                        Available
                    </Text>
                    <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>
                            {offers.filter((o) => o.status === 'available').length}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'claimed' && styles.activeTab]}
                    onPress={() => setActiveTab('claimed')}
                >
                    <Text style={[styles.tabText, activeTab === 'claimed' && styles.activeTabText]}>
                        Claimed
                    </Text>
                    <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>
                            {offers.filter((o) => o.status === 'claimed').length}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
                    onPress={() => setActiveTab('expired')}
                >
                    <Text style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}>
                        Expired
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {filteredOffers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>
                            {activeTab === 'available' ? '' : activeTab === 'claimed' ? '✅' : '❌'}
                        </Text>
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'available' ? 'No Available Offers' :
                                activeTab === 'claimed' ? 'No Claimed Offers' :
                                    'No Expired Offers'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'available'
                                ? 'Check back later for new deals!'
                                : activeTab === 'claimed'
                                    ? 'Claim offers from the Available tab'
                                    : 'Your expired offers will appear here'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.offersList}>
                        {filteredOffers.map((offer) => (
                            <TouchableOpacity
                                key={offer.id}
                                style={[
                                    styles.offerCard,
                                    offer.status === 'expired' && styles.offerCardExpired,
                                ]}
                                onPress={() => handleViewDetails(offer)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.offerHeader}>
                                    <Text style={styles.offerIcon}>{offer.icon}</Text>
                                    <View
                                        style={[
                                            styles.discountBadge,
                                            { backgroundColor: getCategoryColor(offer.category) },
                                        ]}
                                    >
                                        <Text style={styles.discountText}>{offer.discount}</Text>
                                    </View>
                                </View>

                                <Text style={styles.offerTitle}>{offer.title}</Text>
                                <Text style={styles.offerDescription}>{offer.description}</Text>

                                <View style={styles.offerFooter}>
                                    <View style={styles.validityContainer}>
                                        <Text style={styles.validityIcon}>⏰</Text>
                                        <Text
                                            style={[
                                                styles.validityText,
                                                offer.status === 'expired' && styles.expiredText,
                                            ]}
                                        >
                                            {getDaysRemaining(offer.validUntil)}
                                        </Text>
                                    </View>
                                    {offer.code && (
                                        <View style={styles.codeContainer}>
                                            <Text style={styles.codeLabel}>Code: </Text>
                                            <Text style={styles.codeText}>{offer.code}</Text>
                                        </View>
                                    )}
                                </View>

                                {offer.status === 'available' && (
                                    <TouchableOpacity
                                        style={styles.claimButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleClaimOffer(offer);
                                        }}
                                    >
                                        <Text style={styles.claimButtonText}>Claim Offer</Text>
                                    </TouchableOpacity>
                                )}

                                {offer.status === 'claimed' && (
                                    <View style={styles.claimedBadge}>
                                        <Text style={styles.claimedBadgeText}>✓ Claimed</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Offer Details Modal */}
            <Modal
                visible={showDetails}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetails(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Offer Details</Text>
                            <TouchableOpacity onPress={() => setShowDetails(false)}>
                                <Text style={styles.modalCloseButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedOffer && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.modalOfferHeader}>
                                    <Text style={styles.modalOfferIcon}>{selectedOffer.icon}</Text>
                                    <View
                                        style={[
                                            styles.modalDiscountBadge,
                                            { backgroundColor: getCategoryColor(selectedOffer.category) },
                                        ]}
                                    >
                                        <Text style={styles.modalDiscountText}>{selectedOffer.discount}</Text>
                                    </View>
                                </View>

                                <Text style={styles.modalOfferTitle}>{selectedOffer.title}</Text>
                                <Text style={styles.modalOfferDescription}>{selectedOffer.description}</Text>

                                <View style={styles.modalInfoRow}>
                                    <Text style={styles.modalInfoLabel}>Valid Until:</Text>
                                    <Text style={styles.modalInfoValue}>
                                        {selectedOffer.validUntil.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                </View>

                                <View style={styles.modalInfoRow}>
                                    <Text style={styles.modalInfoLabel}>Category:</Text>
                                    <Text style={[styles.modalInfoValue, { textTransform: 'capitalize' }]}>
                                        {selectedOffer.category}
                                    </Text>
                                </View>

                                {selectedOffer.code && (
                                    <View style={styles.modalInfoRow}>
                                        <Text style={styles.modalInfoLabel}>Offer Code:</Text>
                                        <Text style={[styles.modalInfoValue, { fontWeight: '700' }]}>
                                            {selectedOffer.code}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.termsSection}>
                                    <Text style={styles.termsTitle}>Terms & Conditions:</Text>
                                    {selectedOffer.terms.map((term, index) => (
                                        <View key={index} style={styles.termItem}>
                                            <Text style={styles.termBullet}>•</Text>
                                            <Text style={styles.termText}>{term}</Text>
                                        </View>
                                    ))}
                                </View>

                                {selectedOffer.status === 'available' && (
                                    <TouchableOpacity
                                        style={styles.modalClaimButton}
                                        onPress={() => handleClaimOffer(selectedOffer)}
                                    >
                                        <Text style={styles.modalClaimButtonText}>Claim This Offer</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    backButton: {
        fontSize: 16,
        color: palette.brandPrimary,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    activeTab: {
        borderBottomColor: palette.brandPrimary,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: palette.textSecondary,
    },
    activeTabText: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    tabBadge: {
        backgroundColor: palette.brandPrimary,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 3,
        paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: 14,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    offersList: {
        padding: spacing.md,
        gap: spacing.md,
    },
    offerCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
    },
    offerCardExpired: {
        opacity: 0.6,
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    offerIcon: {
        fontSize: 40,
    },
    discountBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
    },
    discountText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    offerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    offerDescription: {
        fontSize: 14,
        color: palette.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    offerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    validityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    validityIcon: {
        fontSize: 14,
        marginRight: spacing.xs,
    },
    validityText: {
        fontSize: 13,
        color: palette.textSecondary,
        fontWeight: '500',
    },
    expiredText: {
        color: palette.error,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${palette.brandPrimary}15`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 6,
    },
    codeLabel: {
        fontSize: 11,
        color: palette.textSecondary,
    },
    codeText: {
        fontSize: 12,
        fontWeight: '700',
        color: palette.brandPrimary,
    },
    claimButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.sm,
        borderRadius: 10,
        alignItems: 'center',
    },
    claimButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    claimedBadge: {
        backgroundColor: palette.success,
        paddingVertical: spacing.sm,
        borderRadius: 10,
        alignItems: 'center',
    },
    claimedBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: palette.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    modalCloseButton: {
        fontSize: 24,
        color: palette.textSecondary,
        fontWeight: '300',
    },
    modalBody: {
        padding: spacing.lg,
    },
    modalOfferHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalOfferIcon: {
        fontSize: 64,
    },
    modalDiscountBadge: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 20,
    },
    modalDiscountText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOfferTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    modalOfferDescription: {
        fontSize: 15,
        color: palette.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    modalInfoLabel: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    modalInfoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    termsSection: {
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    termsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    termItem: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    termBullet: {
        fontSize: 14,
        color: palette.textSecondary,
        marginRight: spacing.sm,
    },
    termText: {
        flex: 1,
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 20,
    },
    modalClaimButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    modalClaimButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
