import '@testing-library/jest-native/extend-expect';

try {
    jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch (error) {
    // Optional dependency for older React Native versions; safe to ignore if missing.
}

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');

    Reanimated.default.call = () => undefined;

    return Reanimated;
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
