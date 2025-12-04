import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '@/theme';

export const TrainersListScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Trainers List Screen</Text>
            <Text style={styles.subtext}>Coming Soon</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: palette.textPrimary,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtext: {
        color: palette.textSecondary,
        fontSize: 16,
    },
});
