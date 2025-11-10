import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions } from 'react-native';

import { palette, spacing, typography } from '@/theme';

const { width } = Dimensions.get('window');

export const SplashScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: false, // width animation needs false
            }),
        ]).start();
    }, [fadeAnim, scaleAnim, slideAnim, progressAnim]);

    return (
        <View style={styles.container}>
            {/* Background gradient effect */}
            <View style={styles.gradientCircle1} />
            <View style={styles.gradientCircle2} />

            {/* Welcome text - moved to top */}
            <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
                <Text style={styles.welcomeText}>Welcome to</Text>
            </Animated.View>

            {/* Logo and brand */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Sixfinity Logo */}
                <View style={styles.logoIcon}>
                    <Text style={styles.logoText}>♾️</Text>
                </View>

                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }],
                        opacity: fadeAnim,
                    }}
                >
                    <Text style={styles.appName}>SIXFINITY</Text>
                    <Text style={styles.tagline}>Transform Your Fitness Journey</Text>
                </Animated.View>
            </Animated.View>

            {/* Loading indicator */}
            <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
                <View style={styles.loadingBar}>
                    <Animated.View
                        style={[
                            styles.loadingProgress,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    gradientCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: palette.brandPrimary,
        opacity: 0.1,
    },
    gradientCircle2: {
        position: 'absolute',
        bottom: -150,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: palette.brandSecondary,
        opacity: 0.08,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoIcon: {
        width: 120,
        height: 110,
        borderRadius: 30,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 2,
        borderColor: palette.brandPrimary,
        shadowColor: palette.brandPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    logoText: {
        fontSize: 64,
        color: palette.brandPrimary,
        fontWeight: '700',
    },
    appName: {
        ...typography.heading1,
        fontSize: 48,
        color: palette.textPrimary,
        textAlign: 'center',
        letterSpacing: 2,
        fontWeight: '800',
    },
    tagline: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    welcomeContainer: {
        position: 'absolute',
        top: '20%',
        alignItems: 'center',
    },
    welcomeText: {
        ...typography.subtitle,
        color: palette.textSecondary,
        fontSize: 18,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 80,
        width: width * 0.6,
    },
    loadingBar: {
        height: 4,
        backgroundColor: palette.surface,
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingProgress: {
        height: '100%',
        backgroundColor: palette.brandPrimary,
        borderRadius: 2,
    },
});
