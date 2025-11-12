/**
 * Wallet Service
 * Handles wallet, payments, transactions, payment methods, and invoices
 */

import { supabase } from '@/config/supabaseClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Wallet {
    wallet_id: string;
    user_id: string;
    balance: number;
    reward_points: number;
    pending_refunds: number;
    currency: string;
    total_spent: number;
    total_topped_up: number;
    total_refunded: number;
    total_rewards_redeemed: number;
    is_active: boolean;
    is_frozen: boolean;
    freeze_reason: string | null;
    last_updated: string;
    created_at: string;
}

export interface Transaction {
    transaction_id: string;
    user_id: string;
    wallet_id: string | null;
    type: 'wallet_topup' | 'gym_payment' | 'trainer_payment' | 'class_payment' | 'subscription' | 'refund' | 'reward_redemption' | 'other';
    amount: number;
    currency: string;
    payment_method_id: string | null;
    payment_method_type: string | null;
    gateway_id: string | null;
    gateway_transaction_id: string | null;
    gateway_response: any;
    split_to_gym: number | null;
    split_to_it_company: number | null;
    split_calculated: boolean;
    gym_id: string | null;
    trainer_id: string | null;
    booking_id: string | null;
    subscription_id: string | null;
    invoice_id: string | null;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed' | 'canceled';
    refund_amount: number;
    refund_reason: string | null;
    refunded_at: string | null;
    description: string | null;
    metadata: any;
    ip_address: string | null;
    user_agent: string | null;
    transaction_date: string;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethod {
    payment_method_id: string;
    user_id: string;
    method_type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'upi' | 'bank_account' | 'wallet' | 'other';
    gateway_id: 'razorpay' | 'stripe' | 'paypal' | 'square' | 'other' | null;
    gateway_customer_id: string | null;
    gateway_payment_method_id: string | null;
    card_last_four: string | null;
    card_brand: string | null;
    card_expiry_month: number | null;
    card_expiry_year: number | null;
    card_holder_name: string | null;
    bank_name: string | null;
    account_last_four: string | null;
    upi_id: string | null;
    paypal_email: string | null;
    is_default: boolean;
    is_verified: boolean;
    is_active: boolean;
    nickname: string | null;
    billing_address: any;
    verified_at: string | null;
    added_on: string;
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    invoice_id: string;
    transaction_id: string | null;
    user_id: string;
    invoice_no: string;
    invoice_type: 'payment' | 'refund' | 'subscription' | 'topup';
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
    split_details: any;
    tax_details: any;
    tax_rate: number | null;
    tax_id: string | null;
    line_items: any;
    pdf_url: string | null;
    pdf_generated: boolean;
    pdf_generated_at: string | null;
    qr_code_data: string | null;
    qr_code_url: string | null;
    gym_id: string | null;
    trainer_id: string | null;
    booking_id: string | null;
    status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'refunded' | 'canceled' | 'overdue';
    payment_method: string | null;
    payment_gateway: string | null;
    paid_at: string | null;
    due_date: string | null;
    notes: string | null;
    terms_conditions: string | null;
    invoice_date: string;
    created_at: string;
    updated_at: string;
}

export interface WalletTopup {
    topup_id: string;
    wallet_id: string;
    user_id: string;
    amount: number;
    currency: string;
    payment_method: string | null;
    gateway_used: string | null;
    gateway_transaction_id: string | null;
    transaction_status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'canceled';
    transaction_ref_no: string;
    payment_details: any;
    failure_reason: string | null;
    notes: string | null;
    initiated_at: string;
    completed_at: string | null;
    created_at: string;
}

// ============================================================================
// WALLET OPERATIONS
// ============================================================================

/**
 * Get wallet balance and details
 */
export const getWalletBalance = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('wallet')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching wallet balance:', error);
        return { data: null, error: error };
    }
};

/**
 * Create wallet (typically called automatically via trigger)
 */
export const createWallet = async (userId: string, currency: string = 'USD') => {
    try {
        const { data, error } = await supabase
            .from('wallet')
            .insert({
                user_id: userId,
                currency: currency,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating wallet:', error);
        return { data: null, error: error };
    }
};

/**
 * Check if user has sufficient balance
 */
export const checkSufficientBalance = async (userId: string, amount: number): Promise<boolean> => {
    try {
        const { data } = await supabase.rpc('has_sufficient_balance', {
            p_user_id: userId,
            p_amount: amount,
        });

        return data === true;
    } catch (error: any) {
        console.error('Error checking balance:', error);
        return false;
    }
};

// ============================================================================
// TOP-UP OPERATIONS
// ============================================================================

/**
 * Initiate wallet top-up
 */
export const addMoney = async (
    userId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    gateway: string
) => {
    try {
        // Get wallet
        const { data: wallet } = await getWalletBalance(userId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Create top-up record
        const { data, error } = await supabase
            .from('wallet_topup')
            .insert({
                wallet_id: wallet.wallet_id,
                user_id: userId,
                amount: amount,
                currency: currency,
                payment_method: paymentMethod,
                gateway_used: gateway,
                transaction_status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error initiating wallet top-up:', error);
        return { data: null, error: error };
    }
};

/**
 * Complete wallet top-up (after payment gateway confirms)
 */
export const completeTopup = async (
    topupId: string,
    gatewayTransactionId: string,
    status: 'success' | 'failed',
    failureReason?: string
) => {
    try {
        const updates: any = {
            transaction_status: status,
            gateway_transaction_id: gatewayTransactionId,
            completed_at: new Date().toISOString(),
        };

        if (failureReason) {
            updates.failure_reason = failureReason;
        }

        const { data, error } = await supabase
            .from('wallet_topup')
            .update(updates)
            .eq('topup_id', topupId)
            .select()
            .single();

        if (error) throw error;

        // If successful, create a transaction record
        if (status === 'success' && data) {
            await createTransaction({
                user_id: data.user_id,
                wallet_id: data.wallet_id,
                type: 'wallet_topup',
                amount: data.amount,
                currency: data.currency,
                payment_method_type: data.payment_method,
                gateway_id: data.gateway_used,
                gateway_transaction_id: gatewayTransactionId,
                status: 'success',
                description: `Wallet top-up of ${data.currency} ${data.amount}`,
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error completing top-up:', error);
        return { data: null, error: error };
    }
};

/**
 * Get top-up history
 */
export const getTopupHistory = async (userId: string, limit: number = 20) => {
    try {
        const { data, error } = await supabase
            .from('wallet_topup')
            .select('*')
            .eq('user_id', userId)
            .order('initiated_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching top-up history:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Get all transactions for a user
 */
export const getTransactions = async (
    userId: string,
    filters?: {
        type?: Transaction['type'];
        status?: Transaction['status'];
        startDate?: string;
        endDate?: string;
        limit?: number;
    }
) => {
    try {
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('transaction_date', { ascending: false });

        if (filters?.type) {
            query = query.eq('type', filters.type);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.startDate) {
            query = query.gte('transaction_date', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('transaction_date', filters.endDate);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single transaction
 */
export const getTransaction = async (transactionId: string) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('transaction_id', transactionId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching transaction:', error);
        return { data: null, error: error };
    }
};

/**
 * Create a transaction
 */
export const createTransaction = async (transaction: Partial<Transaction>) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .insert(transaction)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        return { data: null, error: error };
    }
};

/**
 * Process payment (generic payment processing)
 */
export const processPayment = async (
    userId: string,
    amount: number,
    paymentType: Transaction['type'],
    paymentMethodId: string,
    metadata?: {
        gym_id?: string;
        trainer_id?: string;
        booking_id?: string;
        subscription_id?: string;
        description?: string;
    }
) => {
    try {
        // Get payment method details
        const { data: paymentMethod } = await getPaymentMethod(paymentMethodId);
        if (!paymentMethod) {
            throw new Error('Payment method not found');
        }

        // Check if using wallet
        if (paymentMethod.method_type === 'wallet') {
            const hasFunds = await checkSufficientBalance(userId, amount);
            if (!hasFunds) {
                throw new Error('Insufficient wallet balance');
            }
        }

        // Get wallet
        const { data: wallet } = await getWalletBalance(userId);

        // Create transaction
        const { data, error } = await createTransaction({
            user_id: userId,
            wallet_id: wallet?.wallet_id,
            type: paymentType,
            amount: amount,
            currency: wallet?.currency || 'USD',
            payment_method_id: paymentMethodId,
            payment_method_type: paymentMethod.method_type,
            gateway_id: paymentMethod.gateway_id,
            status: 'pending',
            ...metadata,
        });

        if (error) throw error;

        // Note: Actual payment processing with gateway happens here
        // This is a simplified version - you'll integrate with Razorpay/Stripe

        return { data, error: null };
    } catch (error: any) {
        console.error('Error processing payment:', error);
        return { data: null, error: error };
    }
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (
    transactionId: string,
    status: Transaction['status'],
    gatewayResponse?: any
) => {
    try {
        const updates: any = { status };
        if (gatewayResponse) {
            updates.gateway_response = gatewayResponse;
        }

        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('transaction_id', transactionId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating transaction status:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// REFUND OPERATIONS
// ============================================================================

/**
 * Process refund
 */
export const processRefund = async (
    transactionId: string,
    refundAmount: number,
    reason: string
) => {
    try {
        // Get original transaction
        const { data: transaction } = await getTransaction(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Validate refund amount
        if (refundAmount > transaction.amount) {
            throw new Error('Refund amount cannot exceed transaction amount');
        }

        // Update transaction with refund info
        const { data, error } = await supabase
            .from('transactions')
            .update({
                status: refundAmount === transaction.amount ? 'refunded' : 'partially_refunded',
                refund_amount: refundAmount,
                refund_reason: reason,
                refunded_at: new Date().toISOString(),
            })
            .eq('transaction_id', transactionId)
            .select()
            .single();

        if (error) throw error;

        // Create refund transaction
        await createTransaction({
            user_id: transaction.user_id,
            wallet_id: transaction.wallet_id,
            type: 'refund',
            amount: refundAmount,
            currency: transaction.currency,
            status: 'success',
            description: `Refund for ${reason}`,
            metadata: {
                original_transaction_id: transactionId,
            },
        });

        return { data, error: null };
    } catch (error: any) {
        console.error('Error processing refund:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// PAYMENT METHOD OPERATIONS
// ============================================================================

/**
 * Get all payment methods for a user
 */
export const getPaymentMethods = async (userId: string, activeOnly: boolean = true) => {
    try {
        let query = supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false })
            .order('added_on', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching payment methods:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single payment method
 */
export const getPaymentMethod = async (paymentMethodId: string) => {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('payment_method_id', paymentMethodId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching payment method:', error);
        return { data: null, error: error };
    }
};

/**
 * Get default payment method
 */
export const getDefaultPaymentMethod = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', userId)
            .eq('is_default', true)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching default payment method:', error);
        return { data: null, error: error };
    }
};

/**
 * Add a new payment method
 */
export const addPaymentMethod = async (
    userId: string,
    paymentMethod: Partial<PaymentMethod>
) => {
    try {
        // If setting as default, unset other defaults first
        if (paymentMethod.is_default) {
            await supabase
                .from('payment_methods')
                .update({ is_default: false })
                .eq('user_id', userId);
        }

        const { data, error } = await supabase
            .from('payment_methods')
            .insert({
                user_id: userId,
                ...paymentMethod,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error adding payment method:', error);
        return { data: null, error: error };
    }
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (
    paymentMethodId: string,
    updates: Partial<PaymentMethod>
) => {
    try {
        // If setting as default, unset other defaults first
        if (updates.is_default) {
            const { data: method } = await getPaymentMethod(paymentMethodId);
            if (method) {
                await supabase
                    .from('payment_methods')
                    .update({ is_default: false })
                    .eq('user_id', method.user_id)
                    .neq('payment_method_id', paymentMethodId);
            }
        }

        const { data, error } = await supabase
            .from('payment_methods')
            .update(updates)
            .eq('payment_method_id', paymentMethodId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating payment method:', error);
        return { data: null, error: error };
    }
};

/**
 * Delete payment method
 */
export const deletePaymentMethod = async (paymentMethodId: string) => {
    try {
        // Soft delete by setting is_active to false
        const { data, error } = await supabase
            .from('payment_methods')
            .update({ is_active: false })
            .eq('payment_method_id', paymentMethodId)
            .select()
            .single();

        if (error) throw error;

        return { data: true, error: null };
    } catch (error: any) {
        console.error('Error deleting payment method:', error);
        return { data: false, error: error };
    }
};

/**
 * Set default payment method
 */
export const setDefaultPaymentMethod = async (userId: string, paymentMethodId: string) => {
    try {
        // Unset all defaults
        await supabase
            .from('payment_methods')
            .update({ is_default: false })
            .eq('user_id', userId);

        // Set new default
        const { data, error } = await supabase
            .from('payment_methods')
            .update({ is_default: true })
            .eq('payment_method_id', paymentMethodId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error setting default payment method:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// INVOICE OPERATIONS
// ============================================================================

/**
 * Get all invoices for a user
 */
export const getInvoices = async (userId: string, limit: number = 20) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', userId)
            .order('invoice_date', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single invoice
 */
export const getInvoice = async (invoiceId: string) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('invoice_id', invoiceId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching invoice:', error);
        return { data: null, error: error };
    }
};

/**
 * Get invoice by invoice number
 */
export const getInvoiceByNumber = async (invoiceNo: string) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('invoice_no', invoiceNo)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching invoice by number:', error);
        return { data: null, error: error };
    }
};

/**
 * Generate invoice (typically called after successful payment)
 */
export const generateInvoice = async (
    userId: string,
    transactionId: string,
    invoiceData: Partial<Invoice>
) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .insert({
                user_id: userId,
                transaction_id: transactionId,
                status: 'issued',
                ...invoiceData,
            })
            .select()
            .single();

        if (error) throw error;

        // Note: PDF generation and QR code would be done here
        // This would typically be handled by a background job

        return { data, error: null };
    } catch (error: any) {
        console.error('Error generating invoice:', error);
        return { data: null, error: error };
    }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (
    invoiceId: string,
    status: Invoice['status'],
    paidAt?: string
) => {
    try {
        const updates: any = { status };
        if (paidAt) {
            updates.paid_at = paidAt;
        }

        const { data, error } = await supabase
            .from('invoices')
            .update(updates)
            .eq('invoice_id', invoiceId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating invoice status:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

/**
 * Calculate tax amount
 */
export const calculateTax = (subtotal: number, taxRate: number): number => {
    return parseFloat((subtotal * (taxRate / 100)).toFixed(2));
};

/**
 * Calculate total with tax
 */
export const calculateTotal = (
    subtotal: number,
    taxRate: number,
    discountAmount: number = 0
): number => {
    const afterDiscount = subtotal - discountAmount;
    const tax = calculateTax(afterDiscount, taxRate);
    return parseFloat((afterDiscount + tax).toFixed(2));
};

/**
 * Validate card expiry
 */
export const isCardExpired = (expiryMonth: number, expiryYear: number): boolean => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expiryYear < currentYear) return true;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return true;
    return false;
};

// ============================================================================
// BOOKING CANCELLATION WITH AUTOMATIC REFUND
// ============================================================================

/**
 * Get pending refunds for a user
 */
export const getPendingRefunds = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'refund')
            .in('status', ['pending', 'processing'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching pending refunds:', error);
        return { data: null, error };
    }
};

/**
 * Cancel booking and initiate automatic refund based on cancellation policy
 * - 24+ hours before: 100% refund
 * - 12-24 hours before: 50% refund
 * - <12 hours before: 0% refund
 */
export const cancelBookingWithAutoRefund = async (
    userId: string,
    bookingId: string,
    cancelReason: string = 'User canceled'
) => {
    try {
        // Get booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('booking_id', bookingId)
            .eq('user_id', userId)
            .single();

        if (bookingError) throw bookingError;

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Calculate refund amount based on cancellation policy
        const bookingDate = new Date(booking.booking_date);
        const now = new Date();
        const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        let refundPercentage = 0;
        if (hoursUntilBooking > 24) {
            refundPercentage = 100; // Full refund if canceled 24+ hours before
        } else if (hoursUntilBooking > 12) {
            refundPercentage = 50; // 50% refund if 12-24 hours before
        } else {
            refundPercentage = 0; // No refund if less than 12 hours
        }

        const refundAmount = (booking.total_amount * refundPercentage) / 100;

        // Update booking status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'canceled',
                cancellation_reason: cancelReason,
                canceled_at: new Date().toISOString(),
                refund_amount: refundAmount,
            })
            .eq('booking_id', bookingId);

        if (updateError) throw updateError;

        // Process refund if amount > 0
        if (refundAmount > 0) {
            // Get the original transaction
            const { data: originalTransaction } = await supabase
                .from('transactions')
                .select('transaction_id')
                .eq('booking_id', bookingId)
                .eq('user_id', userId)
                .single();

            if (originalTransaction) {
                // Use existing processRefund function
                await processRefund(
                    originalTransaction.transaction_id,
                    refundAmount,
                    `Booking canceled - ${refundPercentage}% refund policy`
                );
            }
        }

        return {
            data: {
                success: true,
                refundAmount,
                refundPercentage,
                message: refundPercentage > 0
                    ? `Booking canceled. ₹${refundAmount.toFixed(2)} (${refundPercentage}%) will be refunded to your wallet.`
                    : 'Booking canceled. No refund available due to cancellation policy.',
            },
            error: null,
        };
    } catch (error) {
        console.error('Error canceling booking with refund:', error);
        return { data: null, error };
    }
};

