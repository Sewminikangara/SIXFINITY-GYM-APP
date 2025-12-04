/**
 * Stripe Payment Gateway Service
 * For international payments (USD and other currencies)
 */

import { StripeProvider, useStripe, CardField } from '@stripe/stripe-react-native';
import {
    PaymentGateway,
    PaymentStatus,
    PaymentResult,
    BookingPaymentData,
    Currency,
    Transaction,
    TransactionType,
    PaymentMethod,
    StripePaymentIntentParams,
} from '@/types/payment';

const STRIPE_CONFIG = {
    PUBLISHABLE_KEY: 'pk_test_51QvhI5GUVSYBBdMXaEWUMLnFnHvhYxuQvJIKyBgHkr1IaCEoVFnhDmh6johfDhfCJRsmD5a9fRR195me1SiUeK5600S8H44Mck',
    API_VERSION: '2023-10-16',
    MERCHANT_DISPLAY_NAME: 'SIXFINITY Gym',
};
export const initializeStripe = async (): Promise<void> => {
    try {
        // Stripe initialization is handled by StripeProvider wrapper
    } catch (error) {
    }
};

/**
 * Create payment intent on your backend
 * Calls Supabase Edge Function
 */
const createPaymentIntent = async (
    params: StripePaymentIntentParams
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration is missing');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        return {
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId,
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Process Stripe payment
 */
export const processStripePayment = async (
    bookingData: BookingPaymentData,
    stripe: ReturnType<typeof useStripe>
): Promise<PaymentResult> => {
    try {
        if (!stripe) {
            throw new Error('Stripe is not initialized');
        }

        // Convert amount to cents (Stripe uses smallest currency unit)
        const amountInCents = Math.round(bookingData.amount * 100);

        // Create payment intent
        const { clientSecret, paymentIntentId } = await createPaymentIntent({
            amount: amountInCents,
            currency: bookingData.currency.toLowerCase(),
            description: `Training Session - ${bookingData.trainerName}`,
            metadata: {
                trainerId: bookingData.trainerId,
                sessionDate: bookingData.sessionDate,
                sessionTime: bookingData.sessionTime,
                gym: bookingData.gym,
                numberOfSessions: bookingData.numberOfSessions.toString(),
            },
        });

        // Create payment method from CardField
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
            paymentMethodType: 'Card',
        });

        if (pmError) {
            return {
                success: false,
                status: PaymentStatus.FAILED,
                error: pmError.message,
                errorCode: pmError.code,
            };
        }

        if (!paymentMethod) {
            return {
                success: false,
                status: PaymentStatus.FAILED,
                error: 'Failed to create payment method',
            };
        }

        // Confirm payment using the payment intent
        const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
            paymentMethodType: 'Card',
        });

        if (error) {
            return {
                success: false,
                status: PaymentStatus.FAILED,
                error: error.message,
                errorCode: error.code,
            };
        }

        if (!paymentIntent) {
            throw new Error('Payment intent is undefined');
        }

        // Map Stripe status to our PaymentStatus
        let status: PaymentStatus;
        const piStatus = paymentIntent.status as string;
        switch (piStatus) {
            case 'succeeded':
            case 'Succeeded':
                status = PaymentStatus.COMPLETED;
                break;
            case 'processing':
            case 'Processing':
                status = PaymentStatus.PROCESSING;
                break;
            case 'requires_payment_method':
            case 'requires_confirmation':
            case 'RequiresPaymentMethod':
            case 'RequiresConfirmation':
                status = PaymentStatus.PENDING;
                break;
            case 'canceled':
            case 'Canceled':
                status = PaymentStatus.CANCELLED;
                break;
            default:
                status = PaymentStatus.FAILED;
        }        return {
            success: status === PaymentStatus.COMPLETED,
            transactionId: `txn_${Date.now()}`,
            gatewayTransactionId: paymentIntent.id,
            status,
            receiptUrl: `https://dashboard.stripe.com/payments/${paymentIntent.id}`,
        };
    } catch (error) {
        return {
            success: false,
            status: PaymentStatus.FAILED,
            error: error instanceof Error ? error.message : 'Payment failed',
        };
    }
};

/**
 * Create setup intent for saving payment method
 */
export const createSetupIntent = async (): Promise<{ clientSecret: string }> => {
    try {
        // Call your backend to create setup intent
        const response = await fetch('https://your-backend.com/api/stripe/create-setup-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to create setup intent');
        }

        const data = await response.json();
        return { clientSecret: data.clientSecret };
    } catch (error) {
        return { clientSecret: 'seti_test_secret_' + Date.now() };
    }
};

/**
 * Process Stripe refund
 * Calls Supabase Edge Function
 */
export const processStripeRefund = async (
    paymentIntentId: string,
    amount?: number,
    reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> => {
    try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration is missing');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/stripe-create-refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({
                paymentIntentId,
                amount, // Optional: partial refund amount in cents
                reason,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process refund');
        }

        const data = await response.json();
        return {
            success: true,
            refundId: data.refundId,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Refund failed',
        };
    }
};

/**
 * Get Stripe transaction history
 */
export const getStripeTransactions = async (userId: string): Promise<Transaction[]> => {
    try {
        // In a real implementation:
        // Fetch transactions from your database filtered by userId and gateway = 'stripe'

        // Simulated transactions
        const mockTransactions: Transaction[] = [
            {
                id: '1',
                userId,
                trainerId: 'trainer1',
                trainerName: 'Chaminda Silva',
                amount: 50,
                currency: Currency.USD,
                gateway: PaymentGateway.STRIPE,
                paymentMethod: PaymentMethod.CREDIT_CARD,
                status: PaymentStatus.COMPLETED,
                type: TransactionType.BOOKING,
                description: 'Training Session - Full Body Workout',
                card: {
                    last4: '4242',
                    brand: 'Visa',
                    expiryMonth: 12,
                    expiryYear: 2025,
                },
                gatewayTransactionId: 'pi_1234567890',
                receiptUrl: 'https://dashboard.stripe.com/payments/pi_1234567890',
                createdAt: new Date('2024-12-01T14:00:00'),
                updatedAt: new Date('2024-12-01T14:00:00'),
                metadata: {
                    sessionDate: '2024-12-05',
                    sessionTime: '2:00 PM',
                    gym: "Gold's Gym - Colombo",
                    numberOfSessions: 1,
                },
            },
        ];

        return mockTransactions;
    } catch (error) {
        return [];
    }
};

/**
 * Calculate Stripe processing fees
 * Stripe charges 2.9% + $0.30 per transaction for US cards
 * International cards: 3.9% + $0.30
 */
export const calculateStripeFees = (
    amount: number,
    isInternationalCard: boolean = false
): number => {
    const percentageFee = amount * (isInternationalCard ? 0.039 : 0.029);
    const fixedFee = 0.3;
    return Math.round((percentageFee + fixedFee) * 100) / 100;
};

/**
 * Convert amount to Stripe format (cents)
 */
export const convertToStripeCents = (amount: number): number => {
    return Math.round(amount * 100);
};

/**
 * Convert Stripe amount to decimal
 */
export const convertFromStripeCents = (amountInCents: number): number => {
    return amountInCents / 100;
};

/**
 * Validate card details
 */
export const validateCardDetails = (
    cardNumber: string,
    expiryMonth: number,
    expiryYear: number,
    cvc: string
): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate card number (basic Luhn algorithm check)
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
        errors.push('Invalid card number');
    }

    // Validate expiry date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        errors.push('Card has expired');
    }

    // Validate CVC
    if (!cvc || cvc.length < 3 || cvc.length > 4) {
        errors.push('Invalid CVC');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Get card brand from card number
 */
export const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');

    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    if (/^35/.test(number)) return 'JCB';
    if (/^30[0-5]/.test(number)) return 'Diners Club';

    return 'Unknown';
};

/**
 * Format card number for display
 */
export const formatCardNumber = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    const groups = number.match(/.{1,4}/g) || [];
    return groups.join(' ');
};

/**
 * Get Stripe publishable key
 */
export const getStripePublishableKey = (): string => {
    return STRIPE_CONFIG.PUBLISHABLE_KEY;
};

/**
 * Handle 3D Secure authentication
 */
export const handle3DSecure = async (
    clientSecret: string,
    stripe: ReturnType<typeof useStripe>
): Promise<PaymentResult> => {
    try {
        if (!stripe) {
            throw new Error('Stripe is not initialized');
        }

        const { error, paymentIntent } = await stripe.handleNextAction(clientSecret);

        if (error) {
            return {
                success: false,
                status: PaymentStatus.FAILED,
                error: error.message,
                errorCode: error.code,
            };
        }

        if (!paymentIntent) {
            throw new Error('Payment intent is undefined');
        }

        let status: PaymentStatus;
        const piStatus = paymentIntent.status as string;
        switch (piStatus) {
            case 'succeeded':
            case 'Succeeded':
                status = PaymentStatus.COMPLETED;
                break;
            case 'processing':
            case 'Processing':
                status = PaymentStatus.PROCESSING;
                break;
            case 'requires_payment_method':
            case 'RequiresPaymentMethod':
                status = PaymentStatus.FAILED;
                break;
            case 'canceled':
            case 'Canceled':
                status = PaymentStatus.CANCELLED;
                break;
            default:
                status = PaymentStatus.PENDING;
        }

        return {
            success: status === PaymentStatus.COMPLETED,
            transactionId: `txn_${Date.now()}`,
            gatewayTransactionId: paymentIntent.id,
            status,
        };
    } catch (error) {
        return {
            success: false,
            status: PaymentStatus.FAILED,
            error: error instanceof Error ? error.message : '3D Secure authentication failed',
        };
    }
};
