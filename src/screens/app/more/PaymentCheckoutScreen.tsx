import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';
import {
    getWalletBalance,
    getPaymentMethods,
    processPayment,
    PaymentMethod,
} from '../../../services/walletService';
import PaymentProcessingModal from '../../../components/PaymentProcessingModal';

interface BookingDetails {
    bookingId?: string;
    gymName: string;
    trainerName?: string;
    sessionDate: string;
    sessionTime: string;
    duration: number; // in minutes
    baseFee: number;
    discount: number;
    tax: number;
    finalAmount: number;
    bookingType: 'gym' | 'trainer' | 'class';
}

type PaymentCheckoutRouteProp = RouteProp<{
    PaymentCheckout: {
        bookingDetails: BookingDetails;
    };
}, 'PaymentCheckout'>;

export default function PaymentCheckoutScreen() {
    const navigation = useNavigation();
    const route = useRoute<PaymentCheckoutRouteProp>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [useWallet, setUseWallet] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [userRegion, setUserRegion] = useState<'india' | 'international'>('india');
    const [recommendedGateways, setRecommendedGateways] = useState<string[]>([]);

    const bookingDetails = route.params?.bookingDetails;

    useEffect(() => {
        if (user?.id) {
            loadPaymentData();
            detectUserRegion();
        } else {
            setLoading(false);
        }
    }, [user]);

    const detectUserRegion = async () => {


        try {
            // Mock detection - in production, call a geolocation API
            const region = 'india'; // Default to India for demo
            setUserRegion(region);

            // Set recommended gateways based on region
            if (region === 'india') {
                setRecommendedGateways(['Razorpay', 'UPI', 'Paytm', 'PhonePe']);
            } else {
                setRecommendedGateways(['Stripe', 'PayPal', 'Apple Pay', 'Google Pay']);
            }
        } catch (error) {
            console.error('Error detecting region:', error);
            // Default to India
            setUserRegion('india');
            setRecommendedGateways(['Razorpay', 'UPI']);
        }
    };

    const getGatewayForMethod = (methodType: string): string => {
        // Map payment methods to gateways based on region
        if (userRegion === 'india') {
            switch (methodType) {
                case 'upi':
                    return 'Razorpay';
                case 'credit_card':
                case 'debit_card':
                    return 'Razorpay';
                case 'wallet':
                    return 'Paytm/PhonePe';
                case 'bank_account':
                    return 'Razorpay';
                default:
                    return 'Razorpay';
            }
        } else {
            // International
            switch (methodType) {
                case 'credit_card':
                case 'debit_card':
                    return 'Stripe';
                case 'paypal':
                    return 'PayPal';
                case 'apple_pay':
                    return 'Apple Pay';
                case 'google_pay':
                    return 'Google Pay';
                default:
                    return 'Stripe';
            }
        }
    };

    const isRecommendedGateway = (methodType: string): boolean => {
        const gateway = getGatewayForMethod(methodType);
        return recommendedGateways.some(rg => gateway.includes(rg));
    };

    const loadPaymentData = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Load wallet balance
            const balanceResult = await getWalletBalance(user.id);
            if (balanceResult.data) {
                setWalletBalance(balanceResult.data.balance);
            }

            // Load payment methods
            const methodsResult = await getPaymentMethods(user.id);
            if (methodsResult.data && methodsResult.data.length > 0) {
                setPaymentMethods(methodsResult.data);
                // Auto-select default payment method
                const defaultMethod = methodsResult.data.find(m => m.is_default);
                if (defaultMethod) {
                    setSelectedMethod(defaultMethod.payment_method_id);
                } else {
                    setSelectedMethod(methodsResult.data[0].payment_method_id);
                }
            } else {
            }
        } catch (error) {
            console.error('Error loading payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateFinalAmount = () => {
        if (!bookingDetails) return 0;

        let amount = bookingDetails.finalAmount;

        // Apply coupon discount
        if (appliedCoupon) {
            amount -= appliedCoupon.discount;
        }

        // Deduct wallet balance if enabled
        if (useWallet && walletBalance > 0) {
            amount = Math.max(0, amount - walletBalance);
        }

        return amount;
    };

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) {
            Alert.alert('Error', 'Please enter a coupon code');
            return;
        }

        // Mock coupon validation - in production, call API
        const validCoupons: Record<string, number> = {
            'FIRST10': bookingDetails ? bookingDetails.baseFee * 0.1 : 0,
            'SAVE20': bookingDetails ? bookingDetails.baseFee * 0.2 : 0,
            'WELCOME50': 50,
            'FRIEND100': 100,
        };

        const discount = validCoupons[couponCode.toUpperCase()];

        if (discount) {
            setAppliedCoupon({ code: couponCode.toUpperCase(), discount });
            setShowCouponInput(false);
            setCouponCode('');
            Alert.alert('Success', `Coupon applied! You saved Rs. ${discount}`);
        } else {
            Alert.alert('Invalid Coupon', 'This coupon code is not valid or has expired');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
    };

    const handlePayment = async () => {
        if (!user?.id || !bookingDetails) {
            Alert.alert('Error', 'Missing required information');
            return;
        }

        const finalAmount = calculateFinalAmount();

        // Validate payment method if amount > 0
        if (finalAmount > 0 && !selectedMethod && !useWallet) {
            Alert.alert('Payment Method Required', 'Please select a payment method');
            return;
        }

        Alert.alert(
            'Confirm Payment',
            `You will be charged Rs. ${finalAmount.toFixed(2)}. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay Now',
                    onPress: async () => {
                        try {
                            setProcessing(true);

                            // Determine payment method ID
                            const paymentMethodId = useWallet && walletBalance >= finalAmount
                                ? 'wallet'
                                : selectedMethod || '';

                            if (!paymentMethodId) {
                                throw new Error('No payment method selected');
                            }

                            // Find payment method name for modal display
                            const selectedPaymentMethod = paymentMethods.find(m => m.payment_method_id === paymentMethodId);
                            const paymentMethodName = selectedPaymentMethod
                                ? getMethodLabel(selectedPaymentMethod)
                                : 'Wallet Balance';

                            // Show processing modal by keeping processing state
                            // Simulate real payment processing time (2-4 seconds)
                            await new Promise(resolve => setTimeout(resolve, 2500));

                            // Process payment
                            const result = await processPayment(
                                user.id,
                                finalAmount,
                                bookingDetails.bookingType === 'trainer' ? 'trainer_payment' : 'gym_payment',
                                paymentMethodId,
                                {
                                    booking_id: bookingDetails.bookingId || `booking_${Date.now()}`,
                                    description: `${bookingDetails.gymName} - ${bookingDetails.sessionDate}`,
                                }
                            );

                            if (result.error) {
                                throw new Error(result.error.message || 'Payment failed');
                            }

                            // Navigate to success screen (cast to any to bypass type checking)
                            (navigation as any).navigate('PaymentSuccess', {
                                transactionId: result.data?.transaction_id || `txn_${Date.now()}`,
                                amount: finalAmount,
                                bookingDetails,
                                paymentMethod: paymentMethodId,
                            });

                        } catch (error: any) {
                            console.error('Payment error:', error);
                            // Navigate to failed screen (cast to any to bypass type checking)
                            (navigation as any).navigate('PaymentFailed', {
                                error: error.message || 'Payment processing failed',
                                amount: finalAmount,
                                bookingDetails,
                            });
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const getMethodIcon = (type: PaymentMethod['method_type']) => {
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

    const getMethodLabel = (method: PaymentMethod) => {
        if (method.method_type === 'upi' && method.upi_id) {
            return method.upi_id;
        }
        if (method.card_last_four) {
            return `•••• ${method.card_last_four}`;
        }
        return method.nickname || method.method_type;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.brandPrimary} />
                    <Text style={styles.loadingText}>Loading payment details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!bookingDetails) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}></Text>
                    <Text style={styles.errorTitle}>No Booking Details</Text>
                    <Text style={styles.errorText}>
                        Unable to load booking information. Please go back and try again.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const finalAmount = calculateFinalAmount();
    const walletDeduction = useWallet ? Math.min(walletBalance, bookingDetails.finalAmount - (appliedCoupon?.discount || 0)) : 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Summary</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Booking Details Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <View style={styles.card}>
                        <View style={styles.bookingRow}>
                            <Text style={styles.bookingLabel}>
                                {bookingDetails.bookingType === 'gym' ? ' Gym' :
                                    bookingDetails.bookingType === 'trainer' ? 'Trainer' : ' Class'}
                            </Text>
                            <Text style={styles.bookingValue}>{bookingDetails.gymName}</Text>
                        </View>
                        {bookingDetails.trainerName && (
                            <View style={styles.bookingRow}>
                                <Text style={styles.bookingLabel}>Trainer</Text>
                                <Text style={styles.bookingValue}>{bookingDetails.trainerName}</Text>
                            </View>
                        )}
                        <View style={styles.bookingRow}>
                            <Text style={styles.bookingLabel}>Date & Time</Text>
                            <Text style={styles.bookingValue}>
                                {bookingDetails.sessionDate} • {bookingDetails.sessionTime}
                            </Text>
                        </View>
                        <View style={styles.bookingRow}>
                            <Text style={styles.bookingLabel}>Duration</Text>
                            <Text style={styles.bookingValue}>{bookingDetails.duration} mins</Text>
                        </View>
                    </View>
                </View>

                {/* Pricing Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Price Breakdown</Text>
                    <View style={styles.card}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Base Fee</Text>
                            <Text style={styles.priceValue}>Rs. {bookingDetails.baseFee.toFixed(2)}</Text>
                        </View>
                        {bookingDetails.discount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Discount</Text>
                                <Text style={[styles.priceValue, styles.discountText]}>
                                    -Rs. {bookingDetails.discount.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        {appliedCoupon && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>
                                    Coupon ({appliedCoupon.code})
                                    <TouchableOpacity onPress={handleRemoveCoupon}>
                                        <Text style={styles.removeCoupon}> ✕</Text>
                                    </TouchableOpacity>
                                </Text>
                                <Text style={[styles.priceValue, styles.discountText]}>
                                    -Rs. {appliedCoupon.discount.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Tax & Fees</Text>
                            <Text style={styles.priceValue}>Rs. {bookingDetails.tax.toFixed(2)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.subtotalLabel}>Subtotal</Text>
                            <Text style={styles.subtotalValue}>
                                Rs. {(bookingDetails.finalAmount - (appliedCoupon?.discount || 0)).toFixed(2)}
                            </Text>
                        </View>
                        {walletDeduction > 0 && (
                            <>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Wallet Balance Used</Text>
                                    <Text style={[styles.priceValue, styles.discountText]}>
                                        -Rs. {walletDeduction.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.divider} />
                            </>
                        )}
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total Payable</Text>
                            <Text style={styles.totalValue}>Rs. {finalAmount.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Coupon Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}> Apply Coupon</Text>
                    {!appliedCoupon ? (
                        <TouchableOpacity
                            style={styles.couponButton}
                            onPress={() => setShowCouponInput(!showCouponInput)}
                        >
                            <Text style={styles.couponButtonText}>
                                {showCouponInput ? 'Hide' : 'Have a coupon code?'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.appliedCouponCard}>
                            <Text style={styles.appliedCouponText}>
                                ✓ {appliedCoupon.code} applied • Saved {appliedCoupon.discount}
                            </Text>
                        </View>
                    )}

                    {showCouponInput && !appliedCoupon && (
                        <View style={styles.couponInputContainer}>
                            <TextInput
                                style={styles.couponInput}
                                placeholder="Enter coupon code"
                                placeholderTextColor={palette.textTertiary}
                                value={couponCode}
                                onChangeText={setCouponCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon}>
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Wallet Section */}
                {walletBalance > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}> Wallet Balance</Text>
                        <TouchableOpacity
                            style={[styles.walletCard, useWallet && styles.walletCardActive]}
                            onPress={() => setUseWallet(!useWallet)}
                        >
                            <View style={styles.walletLeft}>
                                <View style={styles.walletCheckbox}>
                                    {useWallet && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <View>
                                    <Text style={styles.walletLabel}>Use Wallet Balance</Text>
                                    <Text style={styles.walletBalance}>Available: Rs. {walletBalance.toFixed(2)}</Text>
                                </View>
                            </View>
                            <Text style={styles.walletSavings}>
                                Save Rs. {Math.min(walletBalance, bookingDetails.finalAmount - (appliedCoupon?.discount || 0)).toFixed(2)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Recommended Payment Gateways */}
                {recommendedGateways.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.recommendedHeader}>
                            <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedBadgeText}>TOP</Text>
                            </View>
                            <View style={styles.recommendedTextContainer}>
                                <Text style={styles.recommendedTitle}>Recommended for {userRegion === 'india' ? 'India' : 'International'}</Text>
                                <Text style={styles.recommendedSubtitle}>Fast, secure and low fees</Text>
                            </View>
                        </View>
                        <View style={styles.gatewaysList}>
                            {recommendedGateways.map((gateway, index) => (
                                <View key={index} style={styles.gatewayChip}>
                                    <Text style={styles.gatewayIcon}>
                                        {gateway === 'Razorpay' ? 'RZ' :
                                            gateway === 'Stripe' ? 'ST' :
                                                gateway === 'PayPal' ? 'PP' :
                                                    gateway === 'UPI' ? 'UPI' :
                                                        gateway === 'Paytm' ? 'PTM' :
                                                            gateway === 'PhonePe' ? 'PH' :
                                                                gateway === 'Apple Pay' ? 'AP' :
                                                                    gateway === 'Google Pay' ? 'GP' : 'PAY'}
                                    </Text>
                                    <Text style={styles.gatewayName}>{gateway}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Payment Methods */}
                {finalAmount > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}> Payment Method</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods' as never)}>
                                <Text style={styles.manageLinkText}>Manage</Text>
                            </TouchableOpacity>
                        </View>

                        {paymentMethods.length === 0 ? (
                            <View style={styles.noMethodsCard}>
                                <Text style={styles.noMethodsIcon}></Text>
                                <Text style={styles.noMethodsText}>No payment methods added</Text>
                                <TouchableOpacity
                                    style={styles.addMethodButton}
                                    onPress={() => navigation.navigate('PaymentMethods' as never)}
                                >
                                    <Text style={styles.addMethodButtonText}>+ Add Payment Method</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.methodsList}>
                                {paymentMethods.map((method) => (
                                    <TouchableOpacity
                                        key={method.payment_method_id}
                                        activeOpacity={0.7}
                                        style={[
                                            styles.methodCard,
                                            selectedMethod === method.payment_method_id && styles.methodCardSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedMethod(method.payment_method_id);
                                        }}
                                    >
                                        <View style={styles.methodLeft}>
                                            <View style={styles.methodRadio}>
                                                {selectedMethod === method.payment_method_id && (
                                                    <View style={styles.methodRadioInner} />
                                                )}
                                            </View>
                                            <Text style={styles.methodIcon}>{getMethodIcon(method.method_type)}</Text>
                                            <View>
                                                <Text style={styles.methodName}>{getMethodLabel(method)}</Text>
                                                {method.is_default && (
                                                    <Text style={styles.methodDefault}>Default</Text>
                                                )}
                                                {isRecommendedGateway(method.method_type) && (
                                                    <Text style={styles.recommendedBadge}>Recommended</Text>
                                                )}
                                            </View>
                                        </View>
                                        {method.is_verified && (
                                            <Text style={styles.verifiedBadge}>✓ Verified</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Security Note */}
                <View style={styles.securityNote}>
                    <Text style={styles.securityIcon}></Text>
                    <Text style={styles.securityText}>
                        Your payment is secured with SSL encryption and processed by trusted payment gateways
                    </Text>
                </View>
            </ScrollView>

            {/* Pay Button */}
            <View style={styles.footer}>
                <View style={styles.footerAmount}>
                    <Text style={styles.footerLabel}>Total Amount</Text>
                    <Text style={styles.footerValue}>Rs. {finalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.payButton,
                        (processing || (finalAmount > 0 && !selectedMethod && paymentMethods.length > 0)) && styles.payButtonDisabled,
                    ]}
                    onPress={handlePayment}
                    disabled={processing || (finalAmount > 0 && !selectedMethod && paymentMethods.length > 0)}
                >
                    {processing ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            {finalAmount === 0 ? 'Confirm Booking' : `Pay Rs. ${finalAmount.toFixed(2)}`}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Payment Processing Modal */}
            <PaymentProcessingModal
                visible={processing}
                amount={finalAmount}
                currency="Rs. "
                paymentMethod={
                    selectedMethod
                        ? getMethodLabel(paymentMethods.find(m => m.payment_method_id === selectedMethod) as PaymentMethod)
                        : useWallet
                            ? 'Wallet Balance'
                            : undefined
                }
            />
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
        backgroundColor: palette.surface,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 14,
        color: palette.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    errorText: {
        fontSize: 14,
        color: palette.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    manageLinkText: {
        fontSize: 14,
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    card: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        padding: spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    bookingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    bookingLabel: {
        fontSize: 14,
        color: palette.textSecondary,
        flex: 1,
    },
    bookingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        flex: 1,
        textAlign: 'right',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    priceLabel: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '500',
        color: palette.textPrimary,
    },
    discountText: {
        color: palette.success,
    },
    removeCoupon: {
        fontSize: 12,
        color: palette.error,
        marginLeft: spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: palette.border,
        marginVertical: spacing.sm,
    },
    subtotalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    subtotalValue: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.brandPrimary,
    },
    couponButton: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.border,
        borderStyle: 'dashed',
    },
    couponButtonText: {
        fontSize: 14,
        color: palette.brandPrimary,
        fontWeight: '600',
        textAlign: 'center',
    },
    appliedCouponCard: {
        backgroundColor: `${palette.success}20`,
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.success,
    },
    appliedCouponText: {
        fontSize: 14,
        color: palette.success,
        fontWeight: '600',
        textAlign: 'center',
    },
    couponInputContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.md,
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    couponInput: {
        flex: 1,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 14,
        color: palette.textPrimary,
    },
    applyButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    walletCard: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        padding: spacing.lg,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: palette.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletCardActive: {
        borderColor: palette.brandPrimary,
        backgroundColor: `${palette.brandPrimary}10`,
    },
    walletLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    walletCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: palette.brandPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 16,
        color: palette.brandPrimary,
        fontWeight: '700',
    },
    walletLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    walletBalance: {
        fontSize: 12,
        color: palette.textSecondary,
        marginTop: 2,
    },
    walletSavings: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.success,
    },
    noMethodsCard: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        padding: spacing.xl,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        alignItems: 'center',
    },
    noMethodsIcon: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    noMethodsText: {
        fontSize: 14,
        color: palette.textSecondary,
        marginBottom: spacing.md,
    },
    addMethodButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
    },
    addMethodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    methodsList: {
        marginHorizontal: spacing.md,
        gap: spacing.sm,
    },
    methodCard: {
        backgroundColor: palette.surface,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: palette.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    methodCardSelected: {
        borderColor: palette.brandPrimary,
        backgroundColor: `${palette.brandPrimary}05`,
    },
    methodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    methodRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: palette.brandPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: palette.brandPrimary,
    },
    methodIcon: {
        fontSize: 24,
    },
    methodName: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    methodDefault: {
        fontSize: 11,
        color: palette.textTertiary,
        marginTop: 2,
    },
    verifiedBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.success,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${palette.brandPrimary}10`,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.md,
        borderRadius: 8,
        gap: spacing.sm,
    },
    securityIcon: {
        fontSize: 20,
    },
    securityText: {
        flex: 1,
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    footer: {
        backgroundColor: palette.surface,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    footerAmount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    footerValue: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    payButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    payButtonDisabled: {
        backgroundColor: palette.textTertiary,
        opacity: 0.5,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: palette.surface,
        padding: spacing.xl,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 200,
    },
    modalText: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.textPrimary,
        marginTop: spacing.md,
    },
    modalSubtext: {
        fontSize: 12,
        color: palette.textSecondary,
        marginTop: spacing.xs,
    },
    // Recommended Gateways Styles
    recommendedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        backgroundColor: palette.brandPrimary + '15',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.brandPrimary + '30',
    },
    recommendedIcon: {
        fontSize: 28,
        marginRight: spacing.sm,
    },
    recommendedTextContainer: {
        flex: 1,
    },
    recommendedTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: 2,
    },
    recommendedSubtitle: {
        fontSize: 12,
        color: palette.textSecondary,
        fontWeight: '500',
    },
    gatewaysList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    gatewayChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.brandPrimary + '20',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: palette.brandPrimary,
    },
    gatewayIcon: {
        fontSize: 16,
        marginRight: spacing.xs,
    },
    gatewayName: {
        fontSize: 13,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    recommendedBadge: {
        backgroundColor: 'rgba(185, 242, 72, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: spacing.sm,
    },
    recommendedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: palette.brandPrimary,
        letterSpacing: 0.5,
    },
});
