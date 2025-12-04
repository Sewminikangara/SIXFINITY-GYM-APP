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

export default function SettingsScreen() {
    const navigation = useNavigation();

    const [settings, setSettings] = useState({
        darkMode: false,
        biometricAuth: true,
        autoBackup: true,
        wifiOnly: false,
        showProfilePhoto: true,
        shareActivity: false,
        allowTagging: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => Alert.alert('Logged Out', 'You have been logged out successfully'),
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () =>
                        Alert.prompt(
                            'Confirm Deletion',
                            'Type "DELETE" to confirm account deletion',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Confirm',
                                    onPress: (text) => {
                                        if (text === 'DELETE') {
                                            Alert.alert('Account Deleted', 'Your account has been deleted');
                                        } else {
                                            Alert.alert('Error', 'Please type DELETE to confirm');
                                        }
                                    },
                                },
                            ]
                        ),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}>👤</Text>
                            <Text style={styles.settingLabel}>Edit Profile</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}>🔒</Text>
                            <Text style={styles.settingLabel}>Change Password</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}>📧</Text>
                            <Text style={styles.settingLabel}>Email Preferences</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security & Privacy</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Biometric Authentication</Text>
                        </View>
                        <Switch
                            value={settings.biometricAuth}
                            onValueChange={() => toggleSetting('biometricAuth')}
                            trackColor={{ false: palette.border, true: palette.brandPrimary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Privacy Settings</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Connected Devices</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Appearance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={settings.darkMode}
                            onValueChange={() => toggleSetting('darkMode')}
                            trackColor={{ false: palette.border, true: palette.brandPrimary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Theme Color</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <View style={[styles.colorDot, { backgroundColor: palette.brandPrimary }]} />
                            <Text style={styles.settingArrow}>→</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* App Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Preferences</Text>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Language</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>English</Text>
                            <Text style={styles.settingArrow}>→</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Region</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>India</Text>
                            <Text style={styles.settingArrow}>→</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}>⚖️</Text>
                            <Text style={styles.settingLabel}>Units</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>Metric</Text>
                            <Text style={styles.settingArrow}>→</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Auto Backup</Text>
                        </View>
                        <Switch
                            value={settings.autoBackup}
                            onValueChange={() => toggleSetting('autoBackup')}
                            trackColor={{ false: palette.border, true: palette.brandPrimary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Download Over WiFi Only</Text>
                        </View>
                        <Switch
                            value={settings.wifiOnly}
                            onValueChange={() => toggleSetting('wifiOnly')}
                            trackColor={{ false: palette.border, true: palette.brandPrimary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Social */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Social</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Show Profile Photo</Text>
                        </View>
                        <Switch
                            value={settings.showProfilePhoto}
                            onValueChange={() => toggleSetting('showProfilePhoto')}
                            trackColor={{ false: palette.border, true: palette.brandPrimary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Share Activity</Text>
                        </View>
                        <Switch
                            value={settings.shareActivity}
                            onValueChange={() => toggleSetting('shareActivity')}
                            trackColor={{ false: palette.border, true: palette.brandPrimary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Allow Tagging</Text>
                        </View>
                        <Switch
                            value={settings.allowTagging}
                            onValueChange={() => toggleSetting('allowTagging')}
                            trackColor={{ false: palette.border, true: palette.brandPrimary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}>ℹ</Text>
                            <Text style={styles.settingLabel}>About SIXFINITY</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Terms of Service</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>Privacy Policy</Text>
                        </View>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingIcon}></Text>
                            <Text style={styles.settingLabel}>App Version</Text>
                        </View>
                        <Text style={styles.settingValue}>2.0.1</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                        <Text style={styles.deleteButtonText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Made with ❤️ by SIXFINITY Team
                    </Text>
                    <Text style={styles.footerText}>© 2024 SIXFINITY. All rights reserved.</Text>
                </View>
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
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: palette.surface,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        fontSize: 20,
        marginRight: spacing.md,
        width: 24,
    },
    settingLabel: {
        fontSize: 15,
        color: palette.textPrimary,
        fontWeight: '500',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    settingValue: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    settingArrow: {
        fontSize: 18,
        color: palette.textTertiary,
    },
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: palette.border,
    },
    logoutButton: {
        backgroundColor: palette.brandPrimary,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    deleteButton: {
        backgroundColor: 'transparent',
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.error,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.error,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    footerText: {
        fontSize: 12,
        color: palette.textTertiary,
        marginBottom: spacing.xs,
    },
});
