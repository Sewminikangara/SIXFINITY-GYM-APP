import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { palette, spacing } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';
import { getPaymentMethods, PaymentMethod } from '../../../services/walletService';

interface AddMoneyModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ visible, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMethods, setLoadingMethods] = useState(true);

    useEffect(() => {
        if (visible && user?.id) {
            loadPaymentMethods();
        }
    }, [visible, user]);

    const loadPaymentMethods = async () => {
        if (!user?.id) return;

        try {
            setLoadingMethods(true);
            const result = await getPaymentMethods(user.id);
            if (result.data && result.data.length > 0) {
                setPaymentMethods(result.data);
                // Auto-select default method
                const defaultMethod = result.data.find(m => m.is_default);
                if (defaultMethod) {
                    setSelectedPaymentMethod(defaultMethod.payment_method_id);
                } else {
                    setSelectedPaymentMethod(result.data[0].payment_method_id);
                }
            }
        } catch (error) {
            console.error('Error loading payment methods:', error);
        } finally {
            setLoadingMethods(false);
        }
    };

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
    };

    const handleAddMoney = () => {
        const numAmount = parseFloat(amount);

        // Validation
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        if (numAmount < 100) {
            Alert.alert('Minimum Amount', 'Minimum top-up amount is ₹100');
            return;
        }

        if (numAmount > 50000) {
            Alert.alert('Maximum Amount', 'Maximum top-up amount is ₹50,000 per transaction');
            return;
        }

        if (!selectedPaymentMethod) {
            Alert.alert('Payment Method Required', 'Please select a payment method');
            return;
        }

        // Show confirmation
        Alert.alert(
            'Confirm Top-Up',
            `Are you sure you want to add ₹${numAmount.toFixed(2)} to your wallet?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => processTopUp(numAmount),
                },
            ]
        );
    };

    const processTopUp = async (topUpAmount: number) => {
        try {
            setLoading(true);

            // TODO: Integrate with actual payment gateway
            // For now, simulate successful top-up
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                'Success! 🎉',
                `₹${topUpAmount.toFixed(2)} has been added to your wallet successfully!`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setAmount('');
                            onSuccess();
                            onClose();
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error processing top-up:', error);
            Alert.alert('Error', 'Failed to process payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getMethodIcon = (type: PaymentMethod['method_type']) => {
        switch (type) {
            case 'credit_card':
            case 'debit_card':
                return '';
            case 'upi':
                return '';
            case 'paypal':
                return '';
            case 'bank_account':
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
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Money to Wallet</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView}>
                        {/* Amount Input */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Enter Amount</Text>
                            <View style={styles.amountInputContainer}>
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    placeholderTextColor={palette.textTertiary}
                                />
                            </View>
                            <Text style={styles.limitText}>Min: ₹100 | Max: ₹50,000</Text>
                        </View>

                        {/* Quick Amount Buttons */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Quick Add</Text>
                            <View style={styles.quickAmountsGrid}>
                                {QUICK_AMOUNTS.map((quickAmount) => (
                                    <TouchableOpacity
                                        key={quickAmount}
                                        style={[
                                            styles.quickAmountButton,
                                            amount === quickAmount.toString() && styles.quickAmountButtonSelected,
                                        ]}
                                        onPress={() => handleQuickAmount(quickAmount)}
                                    >
                                        <Text
                                            style={[
                                                styles.quickAmountText,
                                                amount === quickAmount.toString() && styles.quickAmountTextSelected,
                                            ]}
                                        >
                                            ₹{quickAmount}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Payment Method Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Select Payment Method</Text>

                            {loadingMethods ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={palette.brandPrimary} />
                                    <Text style={styles.loadingText}>Loading payment methods...</Text>
                                </View>
                            ) : paymentMethods.length === 0 ? (
                                <View style={styles.noMethodsContainer}>
                                    <Text style={styles.noMethodsText}>No payment methods found</Text>
                                    <Text style={styles.noMethodsSubtext}>
                                        Please add a payment method first
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.paymentMethodsList}>
                                    {paymentMethods.map((method) => (
                                        <TouchableOpacity
                                            key={method.payment_method_id}
                                            style={[
                                                styles.paymentMethodCard,
                                                selectedPaymentMethod === method.payment_method_id &&
                                                styles.paymentMethodCardSelected,
                                            ]}
                                            onPress={() => setSelectedPaymentMethod(method.payment_method_id)}
                                        >
                                            <View style={styles.methodLeft}>
                                                <View style={styles.methodRadio}>
                                                    {selectedPaymentMethod === method.payment_method_id && (
                                                        <View style={styles.methodRadioInner} />
                                                    )}
                                                </View>
                                                <Text style={styles.methodIcon}>
                                                    {getMethodIcon(method.method_type)}
                                                </Text>
                                                <View>
                                                    <Text style={styles.methodName}>
                                                        {getMethodLabel(method)}
                                                    </Text>
                                                    {method.is_default && (
                                                        <Text style={styles.methodDefault}>Default</Text>
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Security Note */}
                        <View style={styles.securityNote}>
                            <Text style={styles.securityIcon}></Text>
                            <Text style={styles.securityText}>
                                Your payment is secured with SSL encryption
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer Button */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[
                                styles.addMoneyButton,
                                (loading || !amount || !selectedPaymentMethod || paymentMethods.length === 0) &&
                                styles.addMoneyButtonDisabled,
                            ]}
                            onPress={handleAddMoney}
                            disabled={loading || !amount || !selectedPaymentMethod || paymentMethods.length === 0}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.addMoneyButtonText}>
                                    Add ₹{amount || '0'} to Wallet
                                </Text>
                            )}
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
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: palette.textSecondary,
    },
    scrollView: {
        maxHeight: '70%',
    },
    section: {
        padding: spacing.lg,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: palette.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '700',
        color: palette.brandPrimary,
        marginRight: spacing.sm,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: '700',
        color: palette.textPrimary,
        padding: 0,
    },
    limitText: {
        fontSize: 12,
        color: palette.textTertiary,
        marginTop: spacing.xs,
    },
    quickAmountsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    quickAmountButton: {
        flex: 1,
        minWidth: '48%',
        backgroundColor: palette.surface,
        borderWidth: 2,
        borderColor: palette.border,
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    quickAmountButtonSelected: {
        borderColor: palette.brandPrimary,
        backgroundColor: `${palette.brandPrimary}10`,
    },
    quickAmountText: {
        fontSize: 18,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    quickAmountTextSelected: {
        color: palette.brandPrimary,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.sm,
    },
    loadingText: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    noMethodsContainer: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.lg,
        alignItems: 'center',
    },
    noMethodsText: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    noMethodsSubtext: {
        fontSize: 12,
        color: palette.textTertiary,
    },
    paymentMethodsList: {
        gap: spacing.sm,
    },
    paymentMethodCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 2,
        borderColor: palette.border,
    },
    paymentMethodCardSelected: {
        borderColor: palette.brandPrimary,
        backgroundColor: `${palette.brandPrimary}05`,
    },
    methodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
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
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${palette.brandPrimary}10`,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.md,
        borderRadius: 8,
        gap: spacing.sm,
    },
    securityIcon: {
        fontSize: 16,
    },
    securityText: {
        flex: 1,
        fontSize: 12,
        color: palette.textSecondary,
    },
    modalFooter: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    addMoneyButton: {
        backgroundColor: palette.brandPrimary,
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    addMoneyButtonDisabled: {
        backgroundColor: palette.textTertiary,
        opacity: 0.5,
    },
    addMoneyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
