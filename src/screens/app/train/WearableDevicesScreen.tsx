import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Switch,
    SafeAreaView,
} from 'react-native';
import { palette, spacing, typography } from '@/theme';

interface WearableDevice {
    id: string;
    name: string;
    platform: 'apple_health' | 'google_fit' | 'fitbit' | 'samsung_health' | 'garmin' | 'whoop' | 'oura';
    icon: string;
    isConnected: boolean;
    isSupported: boolean;
    connectedAt?: string;
    lastSyncAt?: string;
    syncEnabled: boolean;
    dataTypes: string[];
}

const DEVICE_PLATFORMS: WearableDevice[] = [
    {
        id: '1',
        name: 'Apple Health',
        platform: 'apple_health',
        icon: '',
        isConnected: false,
        isSupported: true,
        syncEnabled: true,
        dataTypes: ['steps', 'heart_rate', 'sleep', 'workouts', 'calories'],
    },
    {
        id: '2',
        name: 'Google Fit',
        platform: 'google_fit',
        icon: '',
        isConnected: false,
        isSupported: true,
        syncEnabled: true,
        dataTypes: ['steps', 'heart_rate', 'distance', 'workouts', 'calories'],
    },
    {
        id: '3',
        name: 'Fitbit',
        platform: 'fitbit',
        icon: '',
        isConnected: false,
        isSupported: true,
        syncEnabled: true,
        dataTypes: ['steps', 'heart_rate', 'sleep', 'active_minutes', 'floors'],
    },
    {
        id: '4',
        name: 'Samsung Health',
        platform: 'samsung_health',
        icon: '',
        isConnected: false,
        isSupported: true,
        syncEnabled: true,
        dataTypes: ['steps', 'heart_rate', 'sleep', 'workouts', 'stress'],
    },
    {
        id: '5',
        name: 'Garmin',
        platform: 'garmin',
        icon: '⚡',
        isConnected: false,
        isSupported: true,
        syncEnabled: true,
        dataTypes: ['steps', 'heart_rate', 'vo2_max', 'training_load', 'recovery'],
    },
    {
        id: '6',
        name: 'WHOOP',
        platform: 'whoop',
        icon: '',
        isConnected: false,
        isSupported: true,
        syncEnabled: true,
        dataTypes: ['strain', 'recovery', 'sleep', 'heart_rate', 'hrv'],
    },
    {
        id: '7',
        name: 'Oura Ring',
        platform: 'oura',
        icon: '💍',
        isConnected: false,
        isSupported: true,
        syncEnabled: true,
        dataTypes: ['sleep', 'readiness', 'activity', 'heart_rate', 'hrv'],
    },
];

interface SyncStats {
    lastSyncTime: string;
    totalSyncs: number;
    dataPoints: number;
    syncStatus: 'success' | 'pending' | 'error';
}

export const WearableDevicesScreen: React.FC = () => {
    const [devices, setDevices] = useState<WearableDevice[]>(DEVICE_PLATFORMS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncStats, setSyncStats] = useState<SyncStats>({
        lastSyncTime: new Date().toISOString(),
        totalSyncs: 42,
        dataPoints: 15240,
        syncStatus: 'success',
    });

    useEffect(() => {
        loadConnectedDevices();
    }, []);

    const loadConnectedDevices = async () => {
        try {
            // const result = await profileService.getConnectedDevices(userId);

            // Simulate loading
            setTimeout(() => {
                setLoading(false);
                setRefreshing(false);
            }, 500);
        } catch (error) {
            console.error('Error loading devices:', error);
            Alert.alert('Error', 'Failed to load connected devices');
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadConnectedDevices();
    }, []);

    const handleConnect = async (device: WearableDevice) => {
        if (!device.isSupported) {
            Alert.alert('Coming Soon', `${device.name} integration is coming soon!`);
            return;
        }

        if (device.isConnected) {
            // Show disconnect confirmation
            Alert.alert(
                'Disconnect Device',
                `Are you sure you want to disconnect ${device.name}? Your sync history will be preserved.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disconnect',
                        style: 'destructive',
                        onPress: () => handleDisconnect(device),
                    },
                ]
            );
        } else {
            // Connect device
            try {
                Alert.alert(
                    'Connect Device',
                    `Connecting to ${device.name}...\n\nYou'll be redirected to authorize SIXFINITY to access your ${device.name} data.`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Continue',
                            onPress: () => {
                                // Simulate connection
                                const updatedDevices = devices.map(d =>
                                    d.id === device.id
                                        ? {
                                            ...d,
                                            isConnected: true,
                                            connectedAt: new Date().toISOString(),
                                            lastSyncAt: new Date().toISOString(),
                                        }
                                        : d
                                );
                                setDevices(updatedDevices);
                                Alert.alert('Success', `${device.name} connected successfully!`);
                            },
                        },
                    ]
                );
            } catch (error) {
                console.error('Error connecting device:', error);
                Alert.alert('Error', `Failed to connect ${device.name}`);
            }
        }
    };

    const handleDisconnect = async (device: WearableDevice) => {
        try {
            const updatedDevices = devices.map(d =>
                d.id === device.id
                    ? {
                        ...d,
                        isConnected: false,
                        connectedAt: undefined,
                        lastSyncAt: undefined,
                    }
                    : d
            );
            setDevices(updatedDevices);
            Alert.alert('Disconnected', `${device.name} has been disconnected`);
        } catch (error) {
            console.error('Error disconnecting device:', error);
            Alert.alert('Error', `Failed to disconnect ${device.name}`);
        }
    };

    const handleToggleSync = async (device: WearableDevice) => {
        if (!device.isConnected) {
            Alert.alert('Not Connected', 'Please connect this device first');
            return;
        }

        try {
            const updatedDevices = devices.map(d =>
                d.id === device.id ? { ...d, syncEnabled: !d.syncEnabled } : d
            );
            setDevices(updatedDevices);
        } catch (error) {
            console.error('Error toggling sync:', error);
            Alert.alert('Error', 'Failed to update sync settings');
        }
    };

    const handleSyncNow = async () => {
        const connectedDevices = devices.filter(d => d.isConnected && d.syncEnabled);

        if (connectedDevices.length === 0) {
            Alert.alert('No Devices', 'Connect and enable sync for at least one device');
            return;
        }

        try {
            Alert.alert(
                'Syncing...',
                `Syncing data from ${connectedDevices.length} device(s)...`,
                [{ text: 'OK' }]
            );

            setTimeout(() => {
                setSyncStats({
                    ...syncStats,
                    lastSyncTime: new Date().toISOString(),
                    syncStatus: 'success',
                });
                Alert.alert('Success', 'Sync completed successfully!');
            }, 2000);
        } catch (error) {
            console.error('Error syncing:', error);
            Alert.alert('Error', 'Failed to sync devices');
        }
    };

    const formatLastSync = (dateString?: string) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const renderSyncStats = () => (
        <View style={styles.syncStatsContainer}>
            <Text style={styles.sectionTitle}>Sync Status</Text>
            <View style={styles.syncStatsCard}>
                <View style={styles.syncStatRow}>
                    <View style={styles.syncStatItem}>
                        <Text style={styles.syncStatLabel}>Last Sync</Text>
                        <Text style={styles.syncStatValue}>{formatLastSync(syncStats.lastSyncTime)}</Text>
                    </View>
                    <View style={styles.syncStatDivider} />
                    <View style={styles.syncStatItem}>
                        <Text style={styles.syncStatLabel}>Total Syncs</Text>
                        <Text style={styles.syncStatValue}>{syncStats.totalSyncs}</Text>
                    </View>
                    <View style={styles.syncStatDivider} />
                    <View style={styles.syncStatItem}>
                        <Text style={styles.syncStatLabel}>Data Points</Text>
                        <Text style={styles.syncStatValue}>{syncStats.dataPoints.toLocaleString()}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.syncButton} onPress={handleSyncNow}>
                    <Text style={styles.syncButtonText}>🔄 Sync Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderDeviceCard = (device: WearableDevice) => {
        const isConnected = device.isConnected;
        const isSyncEnabled = device.syncEnabled && isConnected;

        return (
            <View key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                    <View style={styles.deviceInfo}>
                        <View style={styles.deviceIconContainer}>
                            <Text style={styles.deviceIcon}>{device.icon}</Text>
                            {isConnected && <View style={styles.connectedIndicator} />}
                        </View>
                        <View style={styles.deviceDetails}>
                            <Text style={styles.deviceName}>{device.name}</Text>
                            {isConnected ? (
                                <Text style={styles.deviceStatus}>
                                    Connected · Last sync: {formatLastSync(device.lastSyncAt)}
                                </Text>
                            ) : (
                                <Text style={[styles.deviceStatus, styles.deviceStatusDisconnected]}>
                                    Not connected
                                </Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.connectButton,
                            isConnected && styles.connectButtonConnected,
                        ]}
                        onPress={() => handleConnect(device)}
                    >
                        <Text
                            style={[
                                styles.connectButtonText,
                                isConnected && styles.connectButtonTextConnected,
                            ]}
                        >
                            {isConnected ? 'Disconnect' : 'Connect'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isConnected && (
                    <>
                        <View style={styles.divider} />

                        <View style={styles.deviceSettings}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Auto-sync</Text>
                                    <Text style={styles.settingDescription}>
                                        Automatically sync data from {device.name}
                                    </Text>
                                </View>
                                <Switch
                                    value={isSyncEnabled}
                                    onValueChange={() => handleToggleSync(device)}
                                    trackColor={{ false: palette.border, true: palette.brandPrimary + '60' }}
                                    thumbColor={isSyncEnabled ? palette.brandPrimary : palette.textTertiary}
                                    ios_backgroundColor={palette.border}
                                />
                            </View>

                            <View style={styles.dataTypesContainer}>
                                <Text style={styles.dataTypesLabel}>Data types:</Text>
                                <View style={styles.dataTypesGrid}>
                                    {device.dataTypes.map((type, index) => (
                                        <View key={index} style={styles.dataTypeChip}>
                                            <Text style={styles.dataTypeText}>{type.replace('_', ' ')}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </View>
        );
    };

    const connectedCount = devices.filter(d => d.isConnected).length;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading devices...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.brandPrimary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Wearable Devices</Text>
                    <Text style={styles.subtitle}>
                        {connectedCount} of {devices.length} devices connected
                    </Text>
                </View>

                {/* Sync Stats */}
                {connectedCount > 0 && renderSyncStats()}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Why connect devices?</Text>
                        <Text style={styles.infoText}>
                            Connecting your wearable devices allows SIXFINITY to automatically track your activity, heart rate, sleep, and more for a complete fitness picture.
                        </Text>
                    </View>
                </View>

                {/* Devices List */}
                <View style={styles.devicesContainer}>
                    <Text style={styles.sectionTitle}>Available Devices</Text>
                    {devices.map(renderDeviceCard)}
                </View>

                {/* Privacy Notice */}
                <View style={styles.privacyNotice}>
                    <Text style={styles.privacyTitle}>🔒 Your Privacy Matters</Text>
                    <Text style={styles.privacyText}>
                        Your health data is encrypted and never shared with third parties. You can disconnect any device at any time.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        fontSize: 18,
        color: palette.textSecondary,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    title: {
        ...typography.heading1,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        fontSize: 18,
        color: palette.textSecondary,
    },
    syncStatsContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    syncStatsCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
    },
    syncStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    syncStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    syncStatLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    syncStatValue: {
        ...typography.heading3,
        color: palette.brandPrimary,
    },
    syncStatDivider: {
        width: 1,
        height: 30,
        backgroundColor: palette.border,
    },
    syncButton: {
        backgroundColor: palette.brandPrimary,
        borderRadius: 8,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    syncButtonText: {
        ...typography.bodyBold,
        color: palette.background,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: palette.accentBlue + '15',
        borderRadius: 12,
        padding: spacing.md,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: palette.accentBlue + '30',
    },
    infoIcon: {
        fontSize: 24,
        marginRight: spacing.sm,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    infoText: {
        ...typography.caption,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    devicesContainer: {
        paddingHorizontal: spacing.lg,
    },
    deviceCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deviceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: palette.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        position: 'relative',
    },
    deviceIcon: {
        fontSize: 24,
    },
    connectedIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: palette.success,
        borderWidth: 2,
        borderColor: palette.surface,
    },
    deviceDetails: {
        flex: 1,
    },
    deviceName: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: 2,
    },
    deviceStatus: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    deviceStatusDisconnected: {
        color: palette.textTertiary,
    },
    connectButton: {
        backgroundColor: palette.brandPrimary,
        borderRadius: 8,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    connectButtonConnected: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: palette.danger,
    },
    connectButtonText: {
        ...typography.bodyBold,
        fontSize: 14,
        color: palette.background,
    },
    connectButtonTextConnected: {
        color: palette.danger,
    },
    divider: {
        height: 1,
        backgroundColor: palette.border,
        marginVertical: spacing.md,
    },
    deviceSettings: {
        gap: spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    settingLabel: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: 2,
    },
    settingDescription: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    dataTypesContainer: {
        marginTop: spacing.xs,
    },
    dataTypesLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    dataTypesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    dataTypeChip: {
        backgroundColor: palette.background,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    dataTypeText: {
        ...typography.caption,
        fontSize: 11,
        color: palette.textSecondary,
        textTransform: 'capitalize',
    },
    privacyNotice: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
    },
    privacyTitle: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    privacyText: {
        ...typography.caption,
        color: palette.textSecondary,
        lineHeight: 18,
    },
});
