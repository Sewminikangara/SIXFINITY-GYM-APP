import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components';
import { palette, typography, spacing } from '@/theme';

export const InsightsScreen = () => {
    return (
        <Screen>
            <View style={styles.container}>
                <Text style={styles.title}>INSIGHTS - Coming Soon</Text>
                <Text style={styles.subtitle}>
                    Monthly Summaries, Macro Trends, Calories Charts, AI Insights
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
