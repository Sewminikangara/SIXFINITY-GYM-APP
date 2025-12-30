# SIXFINITY Gym App

A fitness and gym management mobile application built with React Native , featuring AI-powered meal planning, real-time gym tracking, and integrated payment solutions.

##  Features

###  Gym Management
- **Location-Based Gym Finder** - GPS-powered search with distance calculation
- **Advanced Filters** - Search by facilities, price range, ratings, and distance
- **Live Equipment Status** - Real-time tracking of gym equipment availability
- **QR Code Check-in** - Seamless gym entry with QR scanning
- **Multiple View Modes** - List, grid, and map views for gym browsing

###  Nutrition & Meals
- **AI Meal Analysis** - Google Gemini AI-powered food recognition from photos
- **Calorie Tracking** - Daily calorie intake monitoring with goals
- **Meal Planning** - AI-generated weekly meal plans
- **Recipe Generator** - Custom recipe creation based on preferences

###  Training & Workouts
- **Trainer Booking** - Schedule sessions with certified trainers
- **Workout Plans** - AI-generated personalized workout routines
- **Progress Tracking** - Monitor fitness goals and achievements
- **Body Analysis** - AI-powered body composition analysis
- **Session Management** - Book, reschedule, and manage training sessions

###  Payments & Wallet
- **Multi-Gateway Support** - PayHere, Stripe, and Razorpay integration
- **Digital Wallet** - Top-up and manage wallet balance
- **Secure Transactions** - PCI-compliant payment processing
- **Payment Methods** - Credit/debit cards, UPI, mobile banking, bank transfers
- **Transaction History** - Complete audit trail with invoices

###  Rewards & Referrals
- **Points System** - Earn rewards for activities and referrals
- **Referral Program** - Invite friends and earn bonus points
- **Tier System** - Bronze, Silver, Gold, Platinum membership levels
- **Redemption** - Convert points to wallet balance or discounts

###  Notifications
- **Push Notifications** - Real-time alerts for bookings and updates
- **Email Notifications** - Transaction confirmations and receipts
- **Customizable Settings** - Control notification preferences
- **Quiet Hours** - Schedule notification-free time periods

###  User Profile
- **Profile Management** - Edit personal information and preferences
- **Biometric Authentication** - Fingerprint/Face ID login
- **Activity Tracking** - View workout history and progress
- **Settings** - Customize app appearance and behavior

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo SDK 54** - Development framework and tooling
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Screen navigation and routing
- **Expo Location** - GPS and geolocation services
- **Expo Camera** - QR code scanning and photo capture

### Backend & Database
- **Supabase** - PostgreSQL database and authentication
- **Supabase Edge Functions** - Serverless backend functions
- **Real-time Subscriptions** - Live data updates


### Payment Integration
- **PayHere** 
- **Stripe**


##  Supported Platforms

- iOS (13.0+)
- Android (6.0+)

## Supported Regions

- Sri Lanka 
- Dubai, UAE 
- Australia 
- International 

## Installation

### Prerequisites
- Node.js 16+ and npm
- Expo CLI
- iOS Simulator (macOS) or Android Studio

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Sewminikangara/SIXFINITY-GYM-APP.git
cd SIXFINITY-APP-main
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Base URL
EXPO_PUBLIC_API_BASE_URL=your_api_base_url

# AI Services
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_nutritionix_app_id
EXPO_PUBLIC_NUTRITIONIX_APP_KEY=your_nutritionix_app_key
EXPO_PUBLIC_USDA_API_KEY=your_usda_api_key

# Payment Gateways
EXPO_PUBLIC_PAYHERE_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_PAYHERE_MERCHANT_SECRET=your_merchant_secret
EXPO_PUBLIC_PAYHERE_SANDBOX=true
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
EXPO_PUBLIC_STRIPE_SECRET_KEY=your_stripe_secret_key
EXPO_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
EXPO_PUBLIC_RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Currency & Payments
EXPO_PUBLIC_DEFAULT_CURRENCY=LKR
EXPO_PUBLIC_PAYMENT_SUCCESS_URL=gymapp://payment/success
EXPO_PUBLIC_PAYMENT_CANCEL_URL=gymapp://payment/cancel
```

4. **Set up Supabase database**
Run the SQL scripts in `docs/database/` folder in order:
```bash
00-extensions-setup.sql
01-profiles-and-auth.sql
02-meals-and-nutrition.sql
03-gyms-facilities.sql
04-wallet-payments.sql
05-workouts-progress.sql
06-bookings-sessions.sql
07-referrals-rewards.sql
08-notifications-support.sql
```

5. **Start the development server**
```bash
npm start
```

6. **Run on device/emulator**
- Scan QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser


##  Key Features Implementation

### Authentication Flow
```typescript
1. User signup → Create JWT token
2. Create Supabase profile
3. Onboarding (goals, preferences)
4. Biometric setup (optional)
5. Dashboard access
```

### Payment Processing
```typescript
1. User selects payment method
2. Generate secure payment hash (MD5)
3. Call payment gateway API
4. Process webhook response
5. Update transaction status
6. Confirm booking/top-up
7. Send receipt
```

### Gym Search Algorithm
```typescript
1. Get GPS location (±5-10m accuracy)
2. Auto-detect country
3. Query database with filters
4. Calculate distances (Haversine formula)
5. Sort by distance (nearest first)
6. Display results
```

### AI Meal Analysis
```typescript
1. Capture food photo
2. Convert to base64
3. Send to Gemini AI
4. Parse AI response (JSON)
6. Display results with macros
```


##  Security

- JWT authentication with refresh tokens
- Biometric authentication (Face ID/Fingerprint)
- Secure payment processing (PCI compliant)
- API key encryption
- HTTPS-only communications
- Input validation and sanitization

 
