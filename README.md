# 💪 SIXFINITY - Smart Gym & Fitness App

<div align="center">

![SIXFINITY Logo](./assets/images/icon.png)

**A comprehensive fitness companion app built with React Native & Expo**

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Screenshots](#-screenshots) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📱 About

SIXFINITY is a modern, feature-rich fitness application that helps users discover gyms, track workouts, manage nutrition, and achieve their fitness goals. Built with cutting-edge technologies and designed with user experience in mind.

### 🎯 Key Highlights

- 🏋️ **Smart Gym Discovery** - Find gyms near you with advanced filters
- 📊 **Real-time Equipment Tracking** - Check equipment availability before you go
- 👨‍🏫 **Personal Trainers** - Browse and book sessions with certified trainers
- 📅 **Class Scheduling** - Reserve spots in your favorite fitness classes
- 🍎 **Nutrition Tracking** - AI-powered meal logging with barcode scanning
- 🎯 **Goal Management** - Set and track your fitness objectives
- ⭐ **Reviews & Ratings** - Community-driven gym and trainer reviews

---

## ✨ Features

### 🏋️ Gyms Tab

#### 🔍 **Find Gyms**
- **Location-based Search** - GPS integration with high accuracy positioning
- **Advanced Filters** - Distance, facilities, price range, ratings, opening hours
- **Interactive Maps** - View gyms on map with distance calculations
- **Photo Galleries** - Swipeable photos with fullscreen view
- **Detailed Info** - Hours, amenities, contact, pricing

#### 🏢 **Gym Details**
- **Equipment Showcase** - Categorized equipment with specs and availability
- **Live Status** - Real-time equipment availability tracking
- **Trainer Profiles** - Browse trainers with expertise and ratings
- **Class Schedule** - Weekly timetable with booking capability
- **Reviews System** - Rating breakdown charts, helpful votes, user photos

#### 💼 **My Gyms**
- **Membership Management** - Track all your gym memberships
- **Visit History** - Last visited dates and activity frequency
- **Quick Stats** - Member since, total visits, distance from current location
- **Recent Badge** - Highlights gyms visited within 3 days

#### ⚡ **Live Equipment Status**
- **Real-time Tracking** - See what's available right now
- **Category Filters** - Filter by equipment type
- **Usage Indicators** - Visual status (Available/In Use/Busy)
- **Queue System** - Join virtual queues for busy equipment

#### ✅ **Check-In**
- **QR Code Scanning** - Quick check-in with gym QR codes
- **Biometric Auth** - Fingerprint/Face ID verification
- **Session Tracking** - Track check-in/check-out times
- **Duration Monitoring** - See how long you've been at the gym

---

### 🍎 Meals Tab

#### 🔍 **Food Search**
- **AI Food Recognition** - Snap photos to identify food
- **Barcode Scanner** - Scan packaged foods for instant nutrition data
- **Manual Search** - Search from extensive food database
- **Custom Foods** - Add your own recipes and meals

#### 📊 **Nutrition Tracking**
- **Daily Goals** - Calorie and macro targets
- **Meal Logging** - Track breakfast, lunch, dinner, snacks
- **Progress Charts** - Visual representation of your nutrition
- **Macro Breakdown** - Protein, carbs, fats tracking

#### 🤖 **AI Meal Suggestions**
- **Personalized Recommendations** - Based on your goals and preferences
- **Balanced Meals** - Suggested meals that meet your macro targets
- **Quick Add** - One-tap meal logging

#### 📅 **Meal Planning**
- **Weekly Planner** - Plan your meals in advance
- **Recurring Meals** - Save and reuse favorite meals
- **Shopping Lists** - Auto-generated from meal plans

---

### 🏃 Workout Tab

- **Custom Workouts** - Create personalized workout routines
- **Exercise Library** - Hundreds of exercises with instructions
- **Progress Tracking** - Log sets, reps, and weight
- **Workout History** - View past workouts and progress

---

### 📈 Progress Tab

- **Body Metrics** - Track weight, body fat, measurements
- **Progress Photos** - Compare transformation photos
- **Goal Tracking** - Monitor progress toward fitness goals
- **Charts & Analytics** - Visualize your fitness journey

---

### 👤 More Tab

- **Profile Management** - Update personal information
- **Settings** - App preferences and customization
- **Notifications** - Manage alerts and reminders
- **Help & Support** - FAQ and contact support

---

## 📸 Screenshots

### Gyms Tab
<div align="center">
  <img src="./docs/screenshots/gyms-find.png" width="200" alt="Find Gyms" />
  <img src="./docs/screenshots/gyms-detail.png" width="200" alt="Gym Details" />
  <img src="./docs/screenshots/gyms-live-status.png" width="200" alt="Live Status" />
  <img src="./docs/screenshots/gyms-my-gyms.png" width="200" alt="My Gyms" />
</div>

### Meals Tab
<div align="center">
  <img src="./docs/screenshots/meals-log.png" width="200" alt="Meal Logging" />
  <img src="./docs/screenshots/meals-ai.png" width="200" alt="AI Recognition" />
  <img src="./docs/screenshots/meals-search.png" width="200" alt="Food Search" />
  <img src="./docs/screenshots/meals-planner.png" width="200" alt="Meal Planner" />
</div>

*Note: Screenshots coming soon!*

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Expo CLI** (install globally: `npm install -g expo-cli`)
- **iOS Simulator** (Mac only) or **Android Studio** (for emulator)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sixfinity-app.git
   cd sixfinity-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_nutritionix_app_id
   EXPO_PUBLIC_NUTRITIONIX_APP_KEY=your_nutritionix_app_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the app**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Choose a platform**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

---

## 🛠️ Tech Stack

### Frontend
- **[React Native](https://reactnative.dev/)** - Cross-platform mobile framework
- **[Expo](https://expo.dev/)** - Development platform and tooling
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[React Navigation 7](https://reactnavigation.org/)** - Navigation library
- **[Expo Vector Icons](https://icons.expo.fyi/)** - Icon library

### Backend & Services
- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, storage
- **[PostGIS](https://postgis.net/)** - Geospatial database extension
- **[Nutritionix API](https://www.nutritionix.com/business/api)** - Food & nutrition data
- **[Google Gemini AI](https://ai.google.dev/)** - AI meal recognition
- **[Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)** - GPS services

### State Management & Tools
- **React Hooks** - Built-in state management
- **Context API** - Global state (auth, user profile)
- **Async Storage** - Local data persistence

### Testing
- **[Jest](https://jestjs.io/)** - Unit testing framework
- **[React Native Testing Library](https://callstack.github.io/react-native-testing-library/)** - Component testing

---

## 📁 Project Structure

```
sixfinity-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── TextField.tsx
│   │   ├── Screen.tsx
│   │   └── ...
│   ├── config/              # Configuration files
│   │   ├── env.ts           # Environment variables
│   │   ├── supabaseClient.ts
│   │   └── nutritionix.ts
│   ├── context/             # React Context providers
│   │   └── AuthContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useUserProfile.ts
│   │   └── useNutritionixSearch.ts
│   ├── navigation/          # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── AppTabsNavigator.tsx
│   │   └── types.ts
│   ├── screens/             # Screen components
│   │   ├── app/             # Main app screens
│   │   │   ├── gyms/        # Gym-related screens
│   │   │   ├── meals/       # Meal-related screens
│   │   │   └── ...
│   │   ├── auth/            # Authentication screens
│   │   └── onboarding/      # Onboarding flow
│   ├── services/            # API services & business logic
│   │   ├── gymService.ts
│   │   ├── mealService.ts
│   │   ├── nutritionixService.ts
│   │   └── geminiService.ts
│   ├── theme/               # Theming & styles
│   │   └── index.ts
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── docs/                    # Documentation
│   ├── database/            # Database schemas
│   └── screenshots/         # App screenshots
├── assets/                  # Static assets (images, fonts)
├── ios/                     # iOS native code
├── android/                 # Android native code
├── app.config.ts            # Expo configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── README.md                # This file
```

---

## 🗄️ Database Schema

The app uses **Supabase (PostgreSQL)** with the following main tables:

### Gyms Module
- `gyms` - Gym locations and details
- `gym_memberships` - User memberships
- `check_ins` - Check-in history
- `equipment` - Gym equipment inventory
- `equipment_usage` - Usage tracking
- `equipment_queue` - Virtual queues
- `trainers` - Personal trainers
- `training_sessions` - Booked sessions
- `classes` - Class schedules
- `class_bookings` - Class reservations
- `gym_reviews` - Gym ratings & reviews
- `trainer_reviews` - Trainer ratings

### Meals Module
- `meals` - Logged meals
- `foods` - Food database
- `meal_plans` - Meal planning
- `nutrition_goals` - User targets

### Users & Auth
- `users` - User profiles (Supabase Auth)
- `user_settings` - App preferences

**Full schema documentation:** [docs/database/GYMS_SCHEMA_README.md](./docs/database/GYMS_SCHEMA_README.md)

---

## 🔧 Configuration

### API Keys Required

| Service | Purpose | Get Keys |
|---------|---------|----------|
| Supabase | Database & Auth | [supabase.com](https://supabase.com) |
| Nutritionix | Food data | [nutritionix.com/business/api](https://www.nutritionix.com/business/api) |
| Google Gemini | AI recognition | [ai.google.dev](https://ai.google.dev/) |

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Nutritionix
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_app_id
EXPO_PUBLIC_NUTRITIONIX_APP_KEY=your_app_key

# Google Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key

# Optional
EXPO_PUBLIC_USDA_API_KEY=DEMO_KEY
EXPO_PUBLIC_FATSECRET_CLIENT_ID=your_client_id
EXPO_PUBLIC_FATSECRET_CLIENT_SECRET=your_client_secret
```

---

## 🧪 Testing

Run unit tests:
```bash
npm test
# or
yarn test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Test coverage:
```bash
npm test -- --coverage
```

---

## 🏗️ Building for Production

### iOS Build
```bash
eas build --platform ios
```

### Android Build
```bash
eas build --platform android
```

*Note: Requires [EAS CLI](https://docs.expo.dev/build/setup/) setup*

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Keep PRs focused and small

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**SIXFINITY Development Team**

- Lead Developer - [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- **Expo Team** - For the amazing development platform
- **Supabase** - For the backend infrastructure
- **Nutritionix** - For nutrition data API
- **Google** - For Gemini AI
- **React Native Community** - For continuous support

---

## 📞 Support

- **Email**: support@sixfinity.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/sixfinity-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sixfinity-app/discussions)

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Authentication system
- [x] Gym discovery with location
- [x] Equipment tracking system
- [x] Meal logging with AI
- [x] Reviews & ratings
- [x] Database schema

### 🚧 In Progress
- [ ] Real-time equipment status
- [ ] Push notifications
- [ ] Social features
- [ ] Workout tracking

### 📋 Planned
- [ ] Wearable device integration
- [ ] Gamification & achievements
- [ ] Social workout challenges
- [ ] Video workout tutorials
- [ ] Marketplace for gear

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/sixfinity-app?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/sixfinity-app?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/sixfinity-app?style=social)

---

<div align="center">

**Made with ❤️ by the SIXFINITY Team**

⭐ Star us on GitHub — it helps!

[Report Bug](https://github.com/yourusername/sixfinity-app/issues) • [Request Feature](https://github.com/yourusername/sixfinity-app/issues)

</div>
