/**
 * Payment Types and Interfaces
 * Supports both Stripe (International) and PayHere (Sri Lanka)
 */

export enum PaymentGateway {
    STRIPE = 'stripe',
    PAYHERE = 'payhere',
}

export enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    MOBILE_BANKING = 'mobile_banking',
    BANK_TRANSFER = 'bank_transfer',
    DIGITAL_WALLET = 'digital_wallet',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum Currency {
    LKR = 'LKR', // Sri Lankan Rupees
    USD = 'USD', // US Dollars
}

export enum TransactionType {
    BOOKING = 'booking',
    PACKAGE = 'package',
    REFUND = 'refund',
}

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: Currency;
    gateway: PaymentGateway;
    clientSecret?: string; // For Stripe
    orderId?: string; // For PayHere
    createdAt: Date;
}

export interface PaymentCard {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    holderName?: string;
}

export interface Transaction {
    id: string;
    bookingId?: string;
    userId: string;
    trainerId: string;
    trainerName: string;
    amount: number;
    currency: Currency;
    gateway: PaymentGateway;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    type: TransactionType;
    description: string;
    card?: PaymentCard;
    receiptUrl?: string;
    refundAmount?: number;
    refundReason?: string;
    gatewayTransactionId?: string; // Stripe payment ID or PayHere transaction ID
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        sessionDate?: string;
        sessionTime?: string;
        gym?: string;
        numberOfSessions?: number;
        packageType?: string;
    };
}

export interface PaymentConfig {
    stripePublishableKey: string;
    payHereMerchantId: string;
    payHereMerchantSecret: string;
    payHereBusinessAppCode?: string;
    payHereBusinessAppId?: string;
}

export interface BookingPaymentData {
    trainerId: string;
    trainerName: string;
    sessionDate: string;
    sessionTime: string;
    gym: string;
    amount: number;
    currency: Currency;
    numberOfSessions: number;
    packageType?: string;
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    gatewayTransactionId?: string;
    status: PaymentStatus;
    error?: string;
    errorCode?: string;
    receiptUrl?: string;
}

export interface RefundRequest {
    transactionId: string;
    amount: number;
    reason: string;
    bookingId?: string;
}

export interface RefundResult {
    success: boolean;
    refundId?: string;
    amount?: number;
    status: PaymentStatus;
    error?: string;
}

// PayHere specific types
export interface PayHerePaymentObject {
    sandbox: boolean;
    merchant_id: string;
    merchant_secret?: string;
    notify_url: string;
    order_id: string;
    items: string;
    amount: string;
    currency: Currency;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    delivery_address?: string;
    delivery_city?: string;
    delivery_country?: string;
    custom_1?: string;
    custom_2?: string;
}

export interface PayHereResponse {
    status: number;
    status_code: number;
    message: string;
    data?: {
        order_id: string;
        payment_id: string;
        method: string;
        status_code: number;
        status_message: string;
        amount: string;
        currency: Currency;
        card_holder_name?: string;
        card_no?: string;
        card_expiry?: string;
    };
}

// Stripe specific types
export interface StripePaymentIntentParams {
    amount: number; // in cents
    currency: string;
    description: string;
    metadata?: Record<string, string>;
}

export interface StripePaymentMethodParams {
    card: {
        number: string;
        expMonth: number;
        expYear: number;
        cvc: string;
    };
    billingDetails?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: {
            city?: string;
            country?: string;
            line1?: string;
            line2?: string;
            postalCode?: string;
            state?: string;
        };
    };
}
