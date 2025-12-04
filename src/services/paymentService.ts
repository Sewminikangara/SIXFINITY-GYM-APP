/**
 * Unified Payment Service
 * Handles both Stripe and PayHere payment gateways
 * Auto-selects gateway based on currency and region
 */

import { useStripe } from '@stripe/stripe-react-native';
import {
    PaymentGateway,
    Currency,
    PaymentResult,
    BookingPaymentData,
    Transaction,
    RefundRequest,
    RefundResult,
    PaymentStatus,
} from '@/types/payment';
import {
    processPayHerePayment,
    verifyPayHerePayment,
    processPayHereRefund,
    getPayHereTransactions,
    calculatePayHereFees,
} from './payHereService';
import {
    processStripePayment,
    processStripeRefund,
    getStripeTransactions,
    calculateStripeFees,
} from './stripeService';

/**
 * Determine which payment gateway to use based on currency
 */
export const selectPaymentGateway = (currency: Currency): PaymentGateway => {
    switch (currency) {
        case Currency.LKR:
            return PaymentGateway.PAYHERE;
        case Currency.USD:
        default:
            return PaymentGateway.STRIPE;
    }
};

/**
 * Process payment using appropriate gateway
 */
export const processPayment = async (
    bookingData: BookingPaymentData,
    userDetails: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
    },
    stripe?: ReturnType<typeof useStripe>
): Promise<PaymentResult> => {
    const gateway = selectPaymentGateway(bookingData.currency);

    try {
        if (gateway === PaymentGateway.PAYHERE) {
            return await processPayHerePayment(bookingData, userDetails);
        } else if (gateway === PaymentGateway.STRIPE) {
            if (!stripe) {
                throw new Error('Stripe is required for USD payments');
            }
            return await processStripePayment(bookingData, stripe);
        } else {
            throw new Error('Unsupported payment gateway');
        }
    } catch (error) {
        return {
            success: false,
            status: PaymentStatus.FAILED,
            error: error instanceof Error ? error.message : 'Payment failed',
        };
    }
};

/**
 * Verify payment status
 */
export const verifyPayment = async (
    orderId: string,
    gateway: PaymentGateway
): Promise<PaymentResult> => {
    try {
        if (gateway === PaymentGateway.PAYHERE) {
            return await verifyPayHerePayment(orderId);
        } else {
            // For Stripe, verification is done during payment processing
            // You can implement webhook verification here if needed
            return {
                success: true,
                status: PaymentStatus.COMPLETED,
                transactionId: orderId,
            };
        }
    } catch (error) {
        return {
            success: false,
            status: PaymentStatus.FAILED,
            error: 'Payment verification failed',
        };
    }
};

/**
 * Process refund
 */
export const processRefund = async (
    request: RefundRequest,
    gateway: PaymentGateway
): Promise<RefundResult> => {
    try {
        if (gateway === PaymentGateway.PAYHERE) {
            const result = await processPayHereRefund(
                request.transactionId,
                request.amount,
                request.reason
            );
            return {
                success: result.success,
                refundId: result.refundId,
                amount: request.amount,
                status: result.success ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
                error: result.error,
            };
        } else if (gateway === PaymentGateway.STRIPE) {
            const result = await processStripeRefund(
                request.transactionId,
                Math.round(request.amount * 100), // Convert to cents
                request.reason
            );
            return {
                success: result.success,
                refundId: result.refundId,
                amount: request.amount,
                status: result.success ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
                error: result.error,
            };
        } else {
            throw new Error('Unsupported payment gateway');
        }
    } catch (error) {
        return {
            success: false,
            status: PaymentStatus.FAILED,
            error: error instanceof Error ? error.message : 'Refund failed',
        };
    }
};

/**
 * Get transaction history for a user
 */
export const getTransactionHistory = async (
    userId: string,
    gateway?: PaymentGateway
): Promise<Transaction[]> => {
    try {
        if (gateway === PaymentGateway.PAYHERE) {
            return await getPayHereTransactions(userId);
        } else if (gateway === PaymentGateway.STRIPE) {
            return await getStripeTransactions(userId);
        } else {
            // Get transactions from both gateways
            const [payHereTransactions, stripeTransactions] = await Promise.all([
                getPayHereTransactions(userId),
                getStripeTransactions(userId),
            ]);
            return [...payHereTransactions, ...stripeTransactions].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );
        }
    } catch (error) {
        return [];
    }
};

/**
 * Calculate processing fees
 */
export const calculateProcessingFees = (
    amount: number,
    currency: Currency,
    isInternationalCard: boolean = false
): number => {
    const gateway = selectPaymentGateway(currency);

    if (gateway === PaymentGateway.PAYHERE) {
        return calculatePayHereFees(amount);
    } else {
        return calculateStripeFees(amount, isInternationalCard);
    }
};

/**
 * Calculate total amount including fees
 */
export const calculateTotalAmount = (
    amount: number,
    currency: Currency,
    isInternationalCard: boolean = false
): { subtotal: number; fees: number; total: number } => {
    const fees = calculateProcessingFees(amount, currency, isInternationalCard);
    const total = amount + fees;

    return {
        subtotal: amount,
        fees,
        total,
    };
};

/**
 * Convert currency
 * This is a simple implementation - use a real currency conversion API in production
 */
export const convertCurrency = (
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
): number => {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    // Approximate conversion rates (as of Dec 2024)
    const USD_TO_LKR = 325;
    const LKR_TO_USD = 1 / USD_TO_LKR;

    if (fromCurrency === Currency.USD && toCurrency === Currency.LKR) {
        return amount * USD_TO_LKR;
    } else if (fromCurrency === Currency.LKR && toCurrency === Currency.USD) {
        return amount * LKR_TO_USD;
    }

    return amount;
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency: Currency): string => {
    if (currency === Currency.LKR) {
        return `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === Currency.USD) {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
};

/**
 * Calculate refund amount based on cancellation policy
 */
export const calculateRefundAmount = (
    originalAmount: number,
    sessionDate: string,
    cancellationDate: Date = new Date()
): { refundAmount: number; refundPercentage: number; deductedAmount: number } => {
    const session = new Date(sessionDate);
    const hoursUntilSession = (session.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;

    if (hoursUntilSession >= 48) {
        // 48+ hours: Full refund
        refundPercentage = 100;
    } else if (hoursUntilSession >= 24) {
        // 24-48 hours: 50% refund
        refundPercentage = 50;
    } else if (hoursUntilSession >= 12) {
        // 12-24 hours: 25% refund
        refundPercentage = 25;
    } else {
        // Less than 12 hours: No refund
        refundPercentage = 0;
    }

    const refundAmount = (originalAmount * refundPercentage) / 100;
    const deductedAmount = originalAmount - refundAmount;

    return {
        refundAmount,
        refundPercentage,
        deductedAmount,
    };
};

/**
 * Check if refund is allowed
 */
export const isRefundAllowed = (
    sessionDate: string,
    sessionTime: string,
    status: PaymentStatus
): boolean => {
    // Can only refund completed or processing payments
    if (status !== PaymentStatus.COMPLETED && status !== PaymentStatus.PROCESSING) {
        return false;
    }

    // Parse session date and time
    const [hours, minutes] = sessionTime.split(':');
    const isPM = sessionTime.toLowerCase().includes('pm');
    let hour = parseInt(hours);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hour, parseInt(minutes), 0, 0);

    // Cannot refund if session has already passed
    const now = new Date();
    if (sessionDateTime < now) {
        return false;
    }

    return true;
};

/**
 * Get payment gateway display name
 */
export const getGatewayDisplayName = (gateway: PaymentGateway): string => {
    switch (gateway) {
        case PaymentGateway.STRIPE:
            return 'Stripe';
        case PaymentGateway.PAYHERE:
            return 'PayHere';
        default:
            return 'Unknown';
    }
};

/**
 * Get payment status display info
 */
export const getPaymentStatusInfo = (status: PaymentStatus): {
    label: string;
    color: string;
    icon: string
} => {
    switch (status) {
        case PaymentStatus.COMPLETED:
            return { label: 'Completed', color: '#32D74B', icon: 'check-circle' };
        case PaymentStatus.PROCESSING:
            return { label: 'Processing', color: '#FFB347', icon: 'clock-outline' };
        case PaymentStatus.PENDING:
            return { label: 'Pending', color: '#FFB347', icon: 'clock-alert-outline' };
        case PaymentStatus.FAILED:
            return { label: 'Failed', color: '#FF453A', icon: 'close-circle' };
        case PaymentStatus.CANCELLED:
            return { label: 'Cancelled', color: '#6B6B6B', icon: 'cancel' };
        case PaymentStatus.REFUNDED:
            return { label: 'Refunded', color: '#0A84FF', icon: 'cash-refund' };
        case PaymentStatus.PARTIALLY_REFUNDED:
            return { label: 'Partially Refunded', color: '#0A84FF', icon: 'cash-minus' };
        default:
            return { label: 'Unknown', color: '#6B6B6B', icon: 'help-circle' };
    }
};

/**
 * Save transaction to database
 * This should be implemented with your actual database (Supabase)
 */
export const saveTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
    try {
        // In a real implementation:
        // const { data, error } = await supabase
        //   .from('transactions')
        //   .insert(transaction)
        //   .select('id')
        //   .single();

        // For now, generate mock ID
        const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        return transactionId;
    } catch (error) {
        throw new Error('Failed to save transaction');
    }
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (
    transactionId: string,
    status: PaymentStatus,
    gatewayTransactionId?: string
): Promise<boolean> => {
    try {
        // In a real implementation:
        // const { error } = await supabase
        //   .from('transactions')
        //   .update({ status, gatewayTransactionId, updatedAt: new Date() })
        //   .eq('id', transactionId);

        return true;
    } catch (error) {
        return false;
    }
};
