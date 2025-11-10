import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { palette, typography, shadows } from '@/theme';

interface ProgressCircleProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    label?: string;
    value?: string;
    unit?: string;
    showGlow?: boolean;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
    progress,
    size = 140,
    strokeWidth = 12,
    label,
    value,
    unit,
    showGlow = true,
}) => {
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 1200,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Background Circle */}
            <Svg width={size} height={size} style={styles.svg}>
                <Defs>
                    <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={palette.neonGreen} stopOpacity="1" />
                        <Stop offset="100%" stopColor={palette.neonGreenDim} stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Background track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={palette.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress arc */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            {/* Center Content */}
            <View style={[styles.content, showGlow && styles.contentGlow]}>
                {value && (
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{value}</Text>
                        {unit && unit.trim() !== '' && <Text style={styles.unit}>{unit}</Text>}
                    </View>
                )}
                {label && label.trim() !== '' && <Text style={styles.label}>{label}</Text>}
            </View>
        </View>
    );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    svg: {
        position: 'absolute',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentGlow: {
        ...shadows.neonGlowSoft,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    value: {
        ...typography.heading1,
        color: palette.neonGreen,
        fontWeight: '800',
    },
    unit: {
        ...typography.caption,
        color: palette.textSecondary,
        marginLeft: 4,
    },
    label: {
        ...typography.caption,
        color: palette.textSecondary,
        textAlign: 'center',
    },
});
