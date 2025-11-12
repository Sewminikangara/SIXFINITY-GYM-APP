import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';
import { addPaymentMethod } from '../../../services/walletService';

type PaymentMethodType = 'credit_card' | 'debit_card' | 'upi' | 'bank_account' | 'paypal';

export default function AddPaymentMethodScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [selectedType, setSelectedType] = useState<PaymentMethodType>('credit_card');
    const [loading, setLoading] = useState(false);

    // Card fields
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardBrand, setCardBrand] = useState('');

    // UPI fields
    const [upiId, setUpiId] = useState('');

    // Bank fields
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [bankName, setBankName] = useState('');

    // PayPal fields
    const [paypalEmail, setPaypalEmail] = useState('');

    // Common fields
    const [nickname, setNickname] = useState('');
    const [setAsDefault, setSetAsDefault] = useState(false);

    const paymentTypes = [
        { id: 'credit_card' as const, label: 'Credit Card', icon: '💳' },
        { id: 'debit_card' as const, label: 'Debit Card', icon: '💳' },
        { id: 'upi' as const, label: 'UPI', icon: '📱' },
        { id: 'bank_account' as const, label: 'Bank Account', icon: '🏦' },
        { id: 'paypal' as const, label: 'PayPal', icon: '🅿️' },
    ];

    const detectCardBrand = (number: string) => {
        const cleanNumber = number.replace(/\s/g, '');

        if (/^4/.test(cleanNumber)) return 'Visa';
        if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
        if (/^3[47]/.test(cleanNumber)) return 'American Express';
        if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
        if (/^35/.test(cleanNumber)) return 'JCB';
        if (/^(?:2131|1800|35)/.test(cleanNumber)) return 'JCB';

        return '';
    };

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\s/g, '');
        const chunks = cleaned.match(/.{1,4}/g);
        return chunks ? chunks.join(' ') : cleaned;
    };

    const handleCardNumberChange = (text: string) => {
        const cleaned = text.replace(/\s/g, '');
        if (cleaned.length <= 16) {
            setCardNumber(formatCardNumber(cleaned));
            setCardBrand(detectCardBrand(cleaned));
        }
    };

    const handleExpiryMonthChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 2) {
            const month = parseInt(cleaned);
            if (cleaned === '' || (month >= 1 && month <= 12)) {
                setExpiryMonth(cleaned);
            }
        }
    };

    const handleExpiryYearChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 4) {
            setExpiryYear(cleaned);
        }
    };

    const validateCard = () => {
        const cleanNumber = cardNumber.replace(/\s/g, '');

        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            Alert.alert('Invalid Card', 'Card number must be between 13-19 digits');
            return false;
        }

        if (!cardHolderName.trim()) {
            Alert.alert('Invalid Card', 'Please enter card holder name');
            return false;
        }

        if (!expiryMonth || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
            Alert.alert('Invalid Expiry', 'Please enter valid expiry month (01-12)');
            return false;
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const expYear = parseInt(expiryYear);
        const expMonth = parseInt(expiryMonth);

        if (!expiryYear || expiryYear.length !== 4) {
            Alert.alert('Invalid Expiry', 'Please enter valid 4-digit year');
            return false;
        }

        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            Alert.alert('Card Expired', 'This card has already expired');
            return false;
        }

        if (!cvv || cvv.length < 3 || cvv.length > 4) {
            Alert.alert('Invalid CVV', 'CVV must be 3-4 digits');
            return false;
        }

        return true;
    };

    const validateUPI = () => {
        const upiRegex = /^[\w.-]+@[\w.-]+$/;

        if (!upiId.trim()) {
            Alert.alert('Invalid UPI', 'Please enter UPI ID');
            return false;
        }

        if (!upiRegex.test(upiId)) {
            Alert.alert('Invalid UPI', 'Please enter valid UPI ID (e.g., name@upi)');
            return false;
        }

        return true;
    };

    const validateBank = () => {
        if (!accountNumber.trim() || accountNumber.length < 8) {
            Alert.alert('Invalid Account', 'Please enter valid account number');
            return false;
        }

        if (!ifscCode.trim() || ifscCode.length !== 11) {
            Alert.alert('Invalid IFSC', 'IFSC code must be 11 characters');
            return false;
        }

        if (!accountHolderName.trim()) {
            Alert.alert('Invalid Name', 'Please enter account holder name');
            return false;
        }

        if (!bankName.trim()) {
            Alert.alert('Invalid Bank', 'Please enter bank name');
            return false;
        }

        return true;
    };

    const validatePayPal = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!paypalEmail.trim()) {
            Alert.alert('Invalid Email', 'Please enter PayPal email');
            return false;
        }

        if (!emailRegex.test(paypalEmail)) {
            Alert.alert('Invalid Email', 'Please enter valid email address');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!user?.id) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        // Validate based on type
        let isValid = false;

        switch (selectedType) {
            case 'credit_card':
            case 'debit_card':
                isValid = validateCard();
                break;
            case 'upi':
                isValid = validateUPI();
                break;
            case 'bank_account':
                isValid = validateBank();
                break;
            case 'paypal':
                isValid = validatePayPal();
                break;
        }

        if (!isValid) return;

        try {
            setLoading(true);

            // Prepare payment method data
            const paymentMethodData: any = {
                user_id: user.id,
                method_type: selectedType,
                is_default: setAsDefault,
                is_verified: false,
                is_active: true,
                nickname: nickname.trim() || null,
            };

            if (selectedType === 'credit_card' || selectedType === 'debit_card') {
                const cleanNumber = cardNumber.replace(/\s/g, '');
                paymentMethodData.card_last_four = cleanNumber.slice(-4);
                paymentMethodData.card_brand = cardBrand || 'Unknown';
                paymentMethodData.card_expiry_month = parseInt(expiryMonth);
                paymentMethodData.card_expiry_year = parseInt(expiryYear);
                paymentMethodData.card_holder_name = cardHolderName.trim();
                // In production, send full card details to payment gateway for tokenization
                // Never store full card number or CVV in your database
            } else if (selectedType === 'upi') {
                paymentMethodData.upi_id = upiId.trim();
            } else if (selectedType === 'bank_account') {
                paymentMethodData.account_last_four = accountNumber.slice(-4);
                paymentMethodData.bank_name = bankName.trim();
                paymentMethodData.card_holder_name = accountHolderName.trim();
                // In production, verify bank account with small deposit
            } else if (selectedType === 'paypal') {
                paymentMethodData.paypal_email = paypalEmail.trim();
            }

            const result = await addPaymentMethod(user.id, paymentMethodData);

            if (result.error) {
                throw new Error(result.error.message || 'Failed to add payment method');
            }

            Alert.alert(
                'Success!',
                'Payment method added successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error adding payment method:', error);
            Alert.alert('Error', error.message || 'Failed to add payment method');
        } finally {
            setLoading(false);
        }
    };

    const renderCardForm = () => (
        <>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Card Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={palette.textTertiary}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="number-pad"
                    maxLength={19}
                />
                {cardBrand && (
                    <Text style={styles.detectedBrand}>Detected: {cardBrand}</Text>
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Card Holder Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="JOHN DOE"
                    placeholderTextColor={palette.textTertiary}
                    value={cardHolderName}
                    onChangeText={setCardHolderName}
                    autoCapitalize="characters"
                />
            </View>

            <View style={styles.rowGroup}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Expiry Month *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="MM"
                        placeholderTextColor={palette.textTertiary}
                        value={expiryMonth}
                        onChangeText={handleExpiryMonthChange}
                        keyboardType="number-pad"
                        maxLength={2}
                    />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={styles.label}>Expiry Year *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY"
                        placeholderTextColor={palette.textTertiary}
                        value={expiryYear}
                        onChangeText={handleExpiryYearChange}
                        keyboardType="number-pad"
                        maxLength={4}
                    />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={styles.label}>CVV *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor={palette.textTertiary}
                        value={cvv}
                        onChangeText={(text) => {
                            const cleaned = text.replace(/\D/g, '');
                            if (cleaned.length <= 4) setCvv(cleaned);
                        }}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                    />
                </View>
            </View>
        </>
    );

    const renderUPIForm = () => (
        <View style={styles.formGroup}>
            <Text style={styles.label}>UPI ID *</Text>
            <TextInput
                style={styles.input}
                placeholder="yourname@upi"
                placeholderTextColor={palette.textTertiary}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Text style={styles.hint}>
                Enter your UPI ID (e.g., 9876543210@paytm, john@oksbi)
            </Text>
        </View>
    );

    const renderBankForm = () => (
        <>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Account Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="1234567890"
                    placeholderTextColor={palette.textTertiary}
                    value={accountNumber}
                    onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '');
                        setAccountNumber(cleaned);
                    }}
                    keyboardType="number-pad"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>IFSC Code *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="SBIN0001234"
                    placeholderTextColor={palette.textTertiary}
                    value={ifscCode}
                    onChangeText={(text) => setIfscCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={11}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Account Holder Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor={palette.textTertiary}
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Bank Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="State Bank of India"
                    placeholderTextColor={palette.textTertiary}
                    value={bankName}
                    onChangeText={setBankName}
                />
            </View>
        </>
    );

    const renderPayPalForm = () => (
        <View style={styles.formGroup}>
            <Text style={styles.label}>PayPal Email *</Text>
            <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={palette.textTertiary}
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Text style={styles.hint}>
                Enter the email associated with your PayPal account
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Payment Method</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Payment Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Payment Type</Text>
                    <View style={styles.typeGrid}>
                        {paymentTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeCard,
                                    selectedType === type.id && styles.typeCardSelected,
                                ]}
                                onPress={() => setSelectedType(type.id)}
                            >
                                <Text style={styles.typeIcon}>{type.icon}</Text>
                                <Text style={styles.typeLabel}>{type.label}</Text>
                                {selectedType === type.id && (
                                    <View style={styles.selectedBadge}>
                                        <Text style={styles.selectedText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Payment Details Form */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>
                    <View style={styles.formCard}>
                        {(selectedType === 'credit_card' || selectedType === 'debit_card') && renderCardForm()}
                        {selectedType === 'upi' && renderUPIForm()}
                        {selectedType === 'bank_account' && renderBankForm()}
                        {selectedType === 'paypal' && renderPayPalForm()}

                        {/* Nickname */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nickname (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Personal Card, Work Card"
                                placeholderTextColor={palette.textTertiary}
                                value={nickname}
                                onChangeText={setNickname}
                            />
                        </View>

                        {/* Set as Default */}
                        <View style={styles.switchRow}>
                            <View style={styles.switchLeft}>
                                <Text style={styles.switchLabel}>Set as Default</Text>
                                <Text style={styles.switchHint}>Use this for all payments</Text>
                            </View>
                            <Switch
                                value={setAsDefault}
                                onValueChange={setSetAsDefault}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>
                </View>

                {/* Security Note */}
                <View style={styles.securityNote}>
                    <Text style={styles.securityIcon}>🔒</Text>
                    <View style={styles.securityContent}>
                        <Text style={styles.securityTitle}>Your Data is Secure</Text>
                        <Text style={styles.securityText}>
                            All payment information is encrypted and securely stored. We never store your CVV.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Payment Method</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    scrollView: {
        flex: 1,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    typeCard: {
        backgroundColor: palette.surface,
        borderWidth: 2,
        borderColor: palette.border,
        borderRadius: 12,
        padding: spacing.md,
        width: '48%',
        alignItems: 'center',
        position: 'relative',
    },
    typeCardSelected: {
        borderColor: palette.brandPrimary,
        backgroundColor: `${palette.brandPrimary}10`,
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: palette.brandPrimary,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    formCard: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        padding: spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    formGroup: {
        marginBottom: spacing.md,
    },
    rowGroup: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: palette.background,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 16,
        color: palette.textPrimary,
    },
    hint: {
        fontSize: 12,
        color: palette.textSecondary,
        marginTop: spacing.xs / 2,
        lineHeight: 16,
    },
    detectedBrand: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.success,
        marginTop: spacing.xs / 2,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    switchLeft: {
        flex: 1,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 4,
    },
    switchHint: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    securityNote: {
        flexDirection: 'row',
        backgroundColor: `${palette.brandPrimary}10`,
        marginHorizontal: spacing.md,
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${palette.brandPrimary}30`,
        gap: spacing.sm,
    },
    securityIcon: {
        fontSize: 24,
    },
    securityContent: {
        flex: 1,
    },
    securityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    securityText: {
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    footer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        backgroundColor: palette.surface,
    },
    saveButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
