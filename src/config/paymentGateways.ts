/**
 * PAYMENT GATEWAYS CONFIGURATION
 * Sri Lankan Context - Razorpay, PayHere, Stripe
 * Production-Ready Implementation
 */

export const PAYMENT_GATEWAYS = {
    // PayHere - Primary for Sri Lanka
    PAYHERE: {
        merchantId: process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_ID || '',
        merchantSecret: process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_SECRET || '',
        sandbox: process.env.EXPO_PUBLIC_PAYHERE_SANDBOX === 'true',
        baseUrl: process.env.EXPO_PUBLIC_PAYHERE_SANDBOX === 'true'
            ? 'https://sandbox.payhere.lk'
            : 'https://www.payhere.lk',
        currency: 'LKR', // Sri Lankan Rupees
        country: 'LK',
    },

    // Stripe - International payments
    STRIPE: {
        publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51QvhI5GUVSYBBdMXaEWUMLnFnHvhYxuQvJIKyBgHkr1IaCEoVFnhDmh6johfDhfCJRsmD5a9fRR195me1SiUeK5600S8H44Mck',
        secretKey: process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY || '',
        currency: 'LKR', // Support LKR
        country: 'LK',
    },

    // Razorpay - Alternative for India/Sri Lanka
    RAZORPAY: {
        keyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
        keySecret: process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || '',
        currency: 'INR', // Indian Rupees (can convert from LKR)
        country: 'IN',
    },
};

// Currency Configuration - Sri Lankan Rupees
export const CURRENCY_CONFIG = {
    LKR: {
        symbol: 'Rs.',
        code: 'LKR',
        name: 'Sri Lankan Rupee',
        decimals: 2,
        conversionRates: {
            USD: 0.0031, // 1 LKR = 0.0031 USD (approx)
            INR: 0.26,   // 1 LKR = 0.26 INR (approx)
            EUR: 0.0028,
            GBP: 0.0024,
        },
    },
    INR: {
        symbol: '₹',
        code: 'INR',
        name: 'Indian Rupee',
        decimals: 2,
    },
    USD: {
        symbol: '$',
        code: 'USD',
        name: 'US Dollar',
        decimals: 2,
    },
};

// Sri Lankan Context - Payment Methods
export const SRI_LANKAN_PAYMENT_METHODS = [
    {
        id: 'payhere_card',
        name: 'Credit/Debit Card (Visa, Master)',
        gateway: 'payhere',
        type: 'card',
        icon: 'card',
        description: 'Pay securely with your card',
        popular: true,
    },
    {
        id: 'payhere_mobile',
        name: 'Mobile Banking',
        gateway: 'payhere',
        type: 'mobile_banking',
        icon: 'phone',
        description: 'Pay using mobile banking apps',
        popular: true,
    },
    {
        id: 'payhere_bank_transfer',
        name: 'Bank Transfer',
        gateway: 'payhere',
        type: 'bank_transfer',
        icon: 'bank',
        description: 'Direct bank account transfer',
        popular: false,
    },
    {
        id: 'stripe_card',
        name: 'International Card',
        gateway: 'stripe',
        type: 'card',
        icon: 'card',
        description: 'Visa, Mastercard, Amex',
        popular: false,
    },
    {
        id: 'wallet',
        name: 'Wallet Balance',
        gateway: 'internal',
        type: 'wallet',
        icon: 'wallet',
        description: 'Use your wallet balance',
        popular: true,
    },
];

// Sri Lankan Banks for PayHere
export const SRI_LANKAN_BANKS = [
    { id: 'boc', name: 'Bank of Ceylon', code: '7010' },
    { id: 'peoples', name: "People's Bank", code: '7038' },
    { id: 'commercial', name: 'Commercial Bank', code: '7056' },
    { id: 'sampath', name: 'Sampath Bank', code: '7278' },
    { id: 'hsbc', name: 'HSBC', code: '7083' },
    { id: 'hnb', name: 'Hatton National Bank', code: '7092' },
    { id: 'ndb', name: 'National Development Bank', code: '7135' },
    { id: 'seylan', name: 'Seylan Bank', code: '7287' },
    { id: 'dfcc', name: 'DFCC Bank', code: '7454' },
    { id: 'nations_trust', name: 'Nations Trust Bank', code: '7234' },
];

// Format currency for Sri Lankan context
export const formatLKR = (amount: number): string => {
    return `Rs. ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

// Convert LKR to other currencies
export const convertCurrency = (
    amount: number,
    from: keyof typeof CURRENCY_CONFIG,
    to: keyof typeof CURRENCY_CONFIG
): number => {
    if (from === to) return amount;

    const fromConfig = CURRENCY_CONFIG[from];
    const toConfig = CURRENCY_CONFIG[to];

    if (from === 'LKR' && 'conversionRates' in fromConfig && fromConfig.conversionRates) {
        const rate = fromConfig.conversionRates[to as keyof typeof fromConfig.conversionRates];
        return rate ? amount * rate : amount;
    }

    return amount;
};

// Get recommended gateway for Sri Lankan users
export const getRecommendedGateway = (
    userLocation: string = 'LK'
): 'payhere' | 'stripe' | 'razorpay' => {
    if (userLocation === 'LK') return 'payhere';
    if (userLocation === 'IN') return 'razorpay';
    return 'stripe';
};

export default {
    PAYMENT_GATEWAYS,
    CURRENCY_CONFIG,
    SRI_LANKAN_PAYMENT_METHODS,
    SRI_LANKAN_BANKS,
    formatLKR,
    convertCurrency,
    getRecommendedGateway,
};
