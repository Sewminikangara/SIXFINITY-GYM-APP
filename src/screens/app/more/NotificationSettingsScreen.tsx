import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

interface NotificationPreferences {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    bookingReminders: boolean;
    paymentAlerts: boolean;
    rewardsUpdates: boolean;
    promotionalOffers: boolean;
    workoutReminders: boolean;
    achievementAlerts: boolean;
    socialUpdates: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
}

export default function NotificationSettingsScreen() {
    const navigation = useNavigation();

    const [preferences, setPreferences] = useState<NotificationPreferences>({
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        bookingReminders: true,
        paymentAlerts: true,
        rewardsUpdates: true,
        promotionalOffers: false,
        workoutReminders: true,
        achievementAlerts: true,
        socialUpdates: false,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
    });

    const togglePreference = (key: keyof NotificationPreferences) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = () => {
        Alert.alert('Success', 'Notification settings saved successfully!');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Settings</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Notification Channels */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notification Channels</Text>
                    <Text style={styles.sectionDescription}>
                        Choose how you want to receive notifications
                    </Text>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingIcon}>📱</Text>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Push Notifications</Text>
                                    <Text style={styles.settingSubtext}>
                                        Receive notifications in the app
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.pushEnabled}
                                onValueChange={() => togglePreference('pushEnabled')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingIcon}>📧</Text>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Email Notifications</Text>
                                    <Text style={styles.settingSubtext}>Get updates via email</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.emailEnabled}
                                onValueChange={() => togglePreference('emailEnabled')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingIcon}>💬</Text>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>SMS Notifications</Text>
                                    <Text style={styles.settingSubtext}>Receive text messages</Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.smsEnabled}
                                onValueChange={() => togglePreference('smsEnabled')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>
                </View>

                {/* Notification Types */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notification Types</Text>
                    <Text style={styles.sectionDescription}>
                        Select which notifications you want to receive
                    </Text>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Booking Reminders</Text>
                                    <Text style={styles.settingSubtext}>
                                        Upcoming sessions and check-in alerts
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.bookingReminders}
                                onValueChange={() => togglePreference('bookingReminders')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Payment Alerts</Text>
                                    <Text style={styles.settingSubtext}>
                                        Transaction confirmations and receipts
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.paymentAlerts}
                                onValueChange={() => togglePreference('paymentAlerts')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Rewards & Points</Text>
                                    <Text style={styles.settingSubtext}>
                                        Points earned, tier upgrades, expiry alerts
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.rewardsUpdates}
                                onValueChange={() => togglePreference('rewardsUpdates')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Promotional Offers</Text>
                                    <Text style={styles.settingSubtext}>
                                        Special deals and discounts
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.promotionalOffers}
                                onValueChange={() => togglePreference('promotionalOffers')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Workout Reminders</Text>
                                    <Text style={styles.settingSubtext}>
                                        Daily motivation and goal tracking
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.workoutReminders}
                                onValueChange={() => togglePreference('workoutReminders')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Achievement Alerts</Text>
                                    <Text style={styles.settingSubtext}>
                                        Milestones and badges earned
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.achievementAlerts}
                                onValueChange={() => togglePreference('achievementAlerts')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Social Updates</Text>
                                    <Text style={styles.settingSubtext}>
                                        Friend activity and challenges
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.socialUpdates}
                                onValueChange={() => togglePreference('socialUpdates')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>
                </View>

                {/* Quiet Hours */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quiet Hours</Text>
                    <Text style={styles.sectionDescription}>
                        Pause notifications during specific hours
                    </Text>

                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingIcon}>🌙</Text>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                                    <Text style={styles.settingSubtext}>
                                        No notifications during these hours
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={preferences.quietHoursEnabled}
                                onValueChange={() => togglePreference('quietHoursEnabled')}
                                trackColor={{ false: palette.border, true: palette.brandPrimary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    {preferences.quietHoursEnabled && (
                        <View style={styles.quietHoursCard}>
                            <View style={styles.quietHoursRow}>
                                <Text style={styles.quietHoursLabel}>From:</Text>
                                <TouchableOpacity style={styles.timePicker}>
                                    <Text style={styles.timeText}>{preferences.quietHoursStart}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.quietHoursRow}>
                                <Text style={styles.quietHoursLabel}>To:</Text>
                                <TouchableOpacity style={styles.timePicker}>
                                    <Text style={styles.timeText}>{preferences.quietHoursEnd}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={styles.infoText}>
                        Important notifications like booking confirmations and payment alerts will
                        always be delivered regardless of these settings.
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Settings</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    backButton: {
        fontSize: 16,
        color: palette.brandPrimary,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    sectionDescription: {
        fontSize: 13,
        color: palette.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    settingCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: spacing.md,
    },
    settingIcon: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    settingText: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    settingSubtext: {
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 16,
    },
    quietHoursCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    quietHoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    quietHoursLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    timePicker: {
        backgroundColor: palette.background,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.border,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.brandPrimary,
    },
    infoCard: {
        backgroundColor: `${palette.brandPrimary}10`,
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: `${palette.brandPrimary}30`,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    saveButton: {
        backgroundColor: palette.brandPrimary,
        marginHorizontal: spacing.md,
        marginVertical: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
