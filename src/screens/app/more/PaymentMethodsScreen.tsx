import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';
import {
    PaymentMethod,
    getPaymentMethods,
    addPaymentMethod,
    setDefaultPaymentMethod,
    deletePaymentMethod,
} from '../../../services/walletService';

export default function PaymentMethodsScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [showAddMethod, setShowAddMethod] = useState(false);

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    // Reload when screen comes into focus (e.g., after adding a new method)
    useFocusEffect(
        React.useCallback(() => {
            loadPaymentMethods();
        }, [user?.id])
    );

    const loadPaymentMethods = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await getPaymentMethods(user.id);
            if (result.error) {
                throw result.error;
            }
            setMethods(result.data || []);
        } catch (error) {
            console.error('Error loading payment methods:', error);
            Alert.alert('Error', 'Failed to load payment methods');
        } finally {
            setLoading(false);
        }
    }; const handleSetDefault = async (methodId: string) => {
        if (!user?.id) return;

        try {
            await setDefaultPaymentMethod(user.id, methodId);
            await loadPaymentMethods();
            Alert.alert('Success', 'Default payment method updated');
        } catch (error) {
            console.error('Error setting default:', error);
            Alert.alert('Error', 'Failed to update default payment method');
        }
    };

    const handleDelete = async (methodId: string) => {
        Alert.alert(
            'Delete Payment Method',
            'Are you sure you want to remove this payment method?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePaymentMethod(methodId);
                            await loadPaymentMethods();
                            Alert.alert('Success', 'Payment method removed');
                        } catch (error) {
                            console.error('Error deleting method:', error);
                            Alert.alert('Error', 'Failed to remove payment method');
                        }
                    },
                },
            ]
        );
    };

    const handleAddMethod = () => {
        (navigation as any).navigate('AddPaymentMethod');
    }; const getMethodIcon = (type: PaymentMethod['method_type']) => {
        switch (type) {
            case 'credit_card':
            case 'debit_card':
                return '';
            case 'upi':
                return '';
            case 'paypal':
            case 'apple_pay':
                return '';
            case 'google_pay':
                return '';
            case 'bank_account':
                return '';
            case 'wallet':
                return '';
            default:
                return '';
        }
    };

    const maskCardNumber = (number: string) => {
        if (!number) return '****';
        const last4 = number.slice(-4);
        return `•••• ${last4}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment Methods</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={palette.brandPrimary} />
                    <Text style={styles.loadingText}>Loading payment methods...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment Methods</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}></Text>
                    <Text style={styles.emptyTitle}>Please Log In</Text>
                    <Text style={styles.emptyText}>
                        You need to be logged in to manage payment methods
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
                <TouchableOpacity onPress={handleAddMethod}>
                    <Text style={styles.addButton}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}></Text>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Secure Payments</Text>
                        <Text style={styles.infoText}>
                            Your payment information is encrypted and secure. We support multiple payment gateways for your convenience.
                        </Text>
                    </View>
                </View>

                {/* Payment Methods List */}
                {methods.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}></Text>
                        <Text style={styles.emptyTitle}>No Payment Methods</Text>
                        <Text style={styles.emptyText}>
                            Add a payment method to make faster and secure payments
                        </Text>
                        <TouchableOpacity style={styles.addFirstButton} onPress={handleAddMethod}>
                            <Text style={styles.addFirstButtonText}>+ Add Payment Method</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.methodsList}>
                        {methods.map((method) => (
                            <View key={method.payment_method_id} style={styles.methodCard}>
                                <View style={styles.methodHeader}>
                                    <View style={styles.methodInfo}>
                                        <Text style={styles.methodIcon}>
                                            {getMethodIcon(method.method_type)}
                                        </Text>
                                        <View style={styles.methodDetails}>
                                            <View style={styles.methodTitleRow}>
                                                <Text style={styles.methodType}>
                                                    {method.method_type === 'credit_card' ? 'Credit Card' :
                                                        method.method_type === 'debit_card' ? 'Debit Card' :
                                                            method.method_type === 'upi' ? 'UPI' :
                                                                method.method_type === 'paypal' ? 'PayPal' :
                                                                    method.method_type === 'apple_pay' ? 'Apple Pay' :
                                                                        method.method_type === 'google_pay' ? 'Google Pay' :
                                                                            method.method_type === 'bank_account' ? 'Bank Account' :
                                                                                'Payment Method'}
                                                </Text>
                                                {method.is_default && (
                                                    <View style={styles.defaultBadge}>
                                                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {method.nickname && (
                                                <Text style={styles.methodNickname}>{method.nickname}</Text>
                                            )}
                                            {method.card_last_four && (
                                                <Text style={styles.methodNumber}>
                                                    {maskCardNumber(method.card_last_four)}
                                                </Text>
                                            )}
                                            {method.upi_id && (
                                                <Text style={styles.methodNumber}>{method.upi_id}</Text>
                                            )}
                                            {method.card_expiry_month && method.card_expiry_year && (
                                                <Text style={styles.methodExpiry}>
                                                    Expires: {String(method.card_expiry_month).padStart(2, '0')}/{method.card_expiry_year}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.methodActions}>
                                    {!method.is_default && (
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleSetDefault(method.payment_method_id)}
                                        >
                                            <Text style={styles.actionButtonText}>Set as Default</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(method.payment_method_id)}
                                    >
                                        <Text style={styles.deleteButtonText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>

                                {method.is_verified && (
                                    <View style={styles.verifiedBadge}>
                                        <Text style={styles.verifiedText}>✓ Verified</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Regional Gateway Info */}
                <View style={styles.gatewayInfo}>
                    <Text style={styles.gatewayTitle}>Supported Payment Gateways</Text>
                    <Text style={styles.gatewayText}>
                        • Razorpay (India){'\n'}
                        • Stripe (International){'\n'}
                        • PayPal (Global){'\n'}
                        • UPI (India)
                    </Text>
                    <Text style={styles.gatewayNote}>
                        Gateway is automatically selected based on your region for best rates and faster processing.
                    </Text>
                </View>

                {/* Security Info */}
                <View style={styles.securityCard}>
                    <Text style={styles.securityTitle}>Security & Privacy</Text>
                    <Text style={styles.securityText}>
                        • All transactions are encrypted with SSL{'\n'}
                        • We never store your CVV{'\n'}
                        • PCI DSS Level 1 compliant{'\n'}
                        • Two-factor authentication supported{'\n'}
                        • Instant refunds for canceled bookings
                    </Text>
                </View>
            </ScrollView>
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
    addButton: {
        fontSize: 16,
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 14,
        color: palette.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    infoCard: {
        backgroundColor: `${palette.brandPrimary}10`,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: `${palette.brandPrimary}30`,
    },
    infoIcon: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    infoText: {
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 2,
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
        marginBottom: spacing.xl,
        lineHeight: 20,
    },
    addFirstButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
    },
    addFirstButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    methodsList: {
        padding: spacing.md,
    },
    methodCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    methodHeader: {
        flexDirection: 'column',
    },
    methodInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    methodIcon: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    methodDetails: {
        flex: 1,
    },
    methodTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    methodType: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginRight: spacing.sm,
    },
    defaultBadge: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 8,
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    methodNickname: {
        fontSize: 14,
        fontWeight: '500',
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    methodNumber: {
        fontSize: 14,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    methodExpiry: {
        fontSize: 12,
        color: palette.textTertiary,
    },
    methodActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deleteButton: {
        backgroundColor: `${palette.error}20`,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.error,
        flex: 1,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.error,
    },
    verifiedBadge: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.success,
    },
    gatewayInfo: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        padding: spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    gatewayTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    gatewayText: {
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.sm,
    },
    gatewayNote: {
        fontSize: 11,
        color: palette.textTertiary,
        fontStyle: 'italic',
        lineHeight: 16,
    },
    securityCard: {
        backgroundColor: `${palette.success}10`,
        marginHorizontal: spacing.md,
        marginVertical: spacing.md,
        padding: spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${palette.success}30`,
    },
    securityTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    securityText: {
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 22,
    },
});
