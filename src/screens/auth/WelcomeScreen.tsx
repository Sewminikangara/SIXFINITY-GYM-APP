import { useState, useRef, useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Animated, Dimensions, ImageBackground, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Screen } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography, shadows } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

type WelcomeScreenNavigation = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

export const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigation>();
  const { signInWithProvider, biometricsAvailable, biometricsEnabled, signInWithBiometrics } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | 'biometric' | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleProviderSignIn = async (provider: 'google' | 'apple') => {
    setLoadingProvider(provider);
    const result = await signInWithProvider(provider);
    setLoadingProvider(null);

    if (!result.success && result.error) {
      Alert.alert('Sign in failed', result.error);
    }
  };

  const handleBiometricSignIn = async () => {
    setLoadingProvider('biometric');
    const result = await signInWithBiometrics();
    setLoadingProvider(null);

    if (!result.success && result.error) {
      Alert.alert('Biometric login', result.error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Image Background with Gradient Overlay */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&h=1200&fit=crop' }}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(18, 18, 18, 0.4)', 'rgba(18, 18, 18, 0.95)', '#121212']}
          locations={[0, 0.5, 0.85]}
          style={styles.gradientOverlay}
        />
      </ImageBackground>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo & Brand */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>S</Text>
          </View>
          <Text style={styles.brandName}>SIXFINITY</Text>
        </View>

        {/* Hero Text */}
        <View style={styles.heroTextSection}>
          <Text style={styles.heroTitle}>Transform Your{'\n'}Fitness Journey</Text>
          <Text style={styles.heroSubtitle}>
            Your body can stand almost anything.{'\n'}It's your mind you have to convince.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[palette.neonGreen, palette.neonGreenDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.primaryButtonText}>Get started</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>Already have account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    width: '100%',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl + 20 : spacing.xxxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(197, 255, 74, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.neonGreen,
    ...shadows.neonGlowSoft,
  },
  logoIcon: {
    fontSize: 40,
    color: palette.neonGreen,
    fontWeight: '800',
  },
  brandName: {
    ...typography.heading1,
    fontSize: 28,
    color: palette.textPrimary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTextSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  heroTitle: {
    ...typography.display,
    fontSize: 44,
    color: palette.textPrimary,
    fontWeight: '800',
    lineHeight: 52,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 24,
  },
  actions: {
    gap: spacing.lg,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.neonGlow,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.subtitle,
    fontSize: 18,
    color: palette.background,
    fontWeight: '700',
  },
  arrowIcon: {
    fontSize: 20,
    color: palette.background,
    fontWeight: '700',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  loginText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  loginLink: {
    ...typography.body,
    color: palette.neonGreen,
    fontWeight: '700',
  },
});
