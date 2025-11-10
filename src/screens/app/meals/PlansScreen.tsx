import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components';
import { palette, typography, spacing } from '@/theme';

export const PlansScreen = () => {
    return (
        <Screen>
            <View style={styles.container}>
                <Text style={styles.title}>PLANS - Coming Soon</Text>
                <Text style={styles.subtitle}>
                    Weekly Meal Plans, Recipe Library, Shopping List
                </Text>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...typography.heading2,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.caption,
        color: palette.textSecondary,
        textAlign: 'center',
    },
});
