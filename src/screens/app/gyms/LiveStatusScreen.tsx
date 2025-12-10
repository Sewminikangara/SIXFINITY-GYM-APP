import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUserGyms, getEquipmentStatus, type Gym } from '@/services/gymService';

type Props = NativeStackScreenProps<AppStackParamList, 'LiveStatus'>;

// Equipment status types
type EquipmentStatus = 'available' | 'in-use' | 'occupied';

interface Equipment {
    id: string;
    name: string;
    category: 'Cardio' | 'Strength' | 'Free Weights' | 'Functional' | 'Other';
    image: string;
    status: EquipmentStatus;
    remainingTime?: number; // in minutes
    waitCount?: number;
    currentUser?: string;
}

interface GymStatus {
    currentCount: number;
    capacity: number;
    status: 'quiet' | 'moderate' | 'busy';
    peakHours: { hour: number; count: number }[];
    bestTimeToVisit: string;
}

interface QueueItem {
    equipmentId: string;
    equipmentName: string;
    position: number;
    estimatedWaitTime: number;
}

interface ActiveUsage {
    equipmentId: string;
    equipmentName: string;
    equipmentImage: string;
    startTime: Date;
    estimatedDuration: number; // in minutes
}

// Sample equipment data when database is empty
function getSampleEquipment(): Equipment[] {
    return [
        {
            id: 'eq-1',
            name: 'Treadmill 1',
            category: 'Cardio',
            image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&h=200&fit=crop',
            status: 'available',
        },
        {
            id: 'eq-2',
            name: 'Treadmill 2',
            category: 'Cardio',
            image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&h=200&fit=crop',
            status: 'in-use',
            remainingTime: 15,
            currentUser: 'User #12',
        },
        {
            id: 'eq-3',
            name: 'Bench Press',
            category: 'Strength',
            image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=300&h=200&fit=crop',
            status: 'available',
        },
        {
            id: 'eq-4',
            name: 'Squat Rack',
            category: 'Strength',
            image: 'https://images.unsplash.com/photo-1574680088814-a40e8938e8e0?w=300&h=200&fit=crop',
            status: 'occupied',
            waitCount: 2,
        },
        {
            id: 'eq-5',
            name: 'Dumbbells 10kg',
            category: 'Free Weights',
            image: 'https://images.unsplash.com/photo-1593476123561-2c4d7c63e1ef?w=300&h=200&fit=crop',
            status: 'available',
        },
        {
            id: 'eq-6',
            name: 'Cable Machine',
            category: 'Functional',
            image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=200&fit=crop',
            status: 'in-use',
            remainingTime: 8,
            currentUser: 'User #5',
        },
    ];
}

export const LiveStatusScreen: React.FC<Props> = ({ route, navigation }) => {
    const { gymId } = route.params || {};
    const [selectedGymId, setSelectedGymId] = useState<string>(gymId || 'sl-001');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showGymSelectorModal, setShowGymSelectorModal] = useState(false);
    const [selectedEquipmentForUse, setSelectedEquipmentForUse] = useState<Equipment | null>(null);
    const [customDuration, setCustomDuration] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [myGyms, setMyGyms] = useState<Gym[]>([]);

    const userId = 'user-123';

    useEffect(() => {
        loadMyGyms();
    }, []);

    useEffect(() => {
        if (selectedGymId) {
            loadEquipment();
            // Auto-refresh every 30 seconds
            const interval = setInterval(() => {
                loadEquipment();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [selectedGymId]);

    const loadMyGyms = async () => {
        try {
            const { data, error } = await getUserGyms(userId);
            if (error) {
                console.error('Error loading gyms:', error);
            } else {
                setMyGyms(data || []);
                // If no gym selected and user has gyms, select first one
                if (!selectedGymId && data && data.length > 0) {
                    setSelectedGymId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Unexpected error loading gyms:', error);
        }
    };

    const loadEquipment = async () => {
        try {
            setLoading(true);
            const { data, error } = await getEquipmentStatus(selectedGymId);

            if (error) {
                console.error('Error loading equipment:', error);
                // Use sample data if database fails
                const sampleEquipment = getSampleEquipment();
                setEquipment(sampleEquipment);
            } else if (!data || data.length === 0) {
                // Use sample data if no equipment in database
                const sampleEquipment = getSampleEquipment();
                setEquipment(sampleEquipment);
            } else {
                // Transform database equipment to UI equipment format
                const uiEquipment: Equipment[] = (data || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    category: item.category as any,
                    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400',
                    status: item.isAvailable ? 'available' : item.queueCount && item.queueCount > 0 ? 'occupied' : 'in-use',
                    remainingTime: item.estimatedWaitTime,
                    waitCount: item.queueCount,
                    currentUser: item.inUseBy ? 'User' : undefined,
                }));
                setEquipment(uiEquipment);
            }
        } catch (error) {
            console.error('Unexpected error loading equipment:', error);
            setEquipment([]);
        } finally {
            setLoading(false);
        }
    };

    const [gymStatus, setGymStatus] = useState<GymStatus>({
        currentCount: 35,
        capacity: 50,
        status: 'moderate',
        peakHours: [
            { hour: 6, count: 15 },
            { hour: 7, count: 25 },
            { hour: 8, count: 35 },
            { hour: 9, count: 28 },
            { hour: 10, count: 20 },
            { hour: 17, count: 30 },
            { hour: 18, count: 45 },
            { hour: 19, count: 48 },
            { hour: 20, count: 35 },
            { hour: 21, count: 25 },
        ],
        bestTimeToVisit: 'Come after 7 PM - usually quiet',
    });

    const [myQueue, setMyQueue] = useState<QueueItem[]>([
        {
            equipmentId: 'eq-3',
            equipmentName: 'Bench Press #1',
            position: 2,
            estimatedWaitTime: 20,
        },
    ]);

    const [activeUsage, setActiveUsage] = useState<ActiveUsage | null>({
        equipmentId: 'eq-2',
        equipmentName: 'Treadmill #2',
        equipmentImage: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400',
        startTime: new Date(Date.now() - 10 * 60 * 1000), // Started 10 minutes ago
        estimatedDuration: 30,
    });

    const categories = ['All', 'Cardio', 'Strength', 'Free Weights', 'Functional', 'Other'];

    // Get icon for each category
    const getCategoryIcon = (category: string): string => {
        switch (category) {
            case 'All':
                return 'view-grid';
            case 'Cardio':
                return 'run';
            case 'Strength':
                return 'dumbbell';
            case 'Free Weights':
                return 'weight-lifter';
            case 'Functional':
                return 'basketball';
            case 'Other':
                return 'dots-horizontal';
            default:
                return 'help-circle';
        }
    };

    // Get equipment count per category
    const getCategoryCount = (category: string): number => {
        if (category === 'All') return equipment.length;
        return equipment.filter((eq) => eq.category === category).length;
    };

    const filteredEquipment =
        selectedCategory === 'All'
            ? equipment
            : equipment.filter((eq) => eq.category === selectedCategory);

    const selectedGym = myGyms.find((g) => g.id === selectedGymId);

    useEffect(() => {
        // Simulate real-time updates
        const interval = setInterval(() => {
            // Update remaining times
            setEquipment((prev) =>
                prev.map((eq) => {
                    if (eq.status === 'in-use' && eq.remainingTime && eq.remainingTime > 0) {
                        return { ...eq, remainingTime: eq.remainingTime - 1 };
                    }
                    return eq;
                })
            );
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: 'quiet' | 'moderate' | 'busy') => {
        switch (status) {
            case 'quiet':
                return '#32D74B';
            case 'moderate':
                return '#FFB347';
            case 'busy':
                return '#FF453A';
        }
    };

    const getEquipmentStatusColor = (status: EquipmentStatus) => {
        switch (status) {
            case 'available':
                return '#32D74B';
            case 'in-use':
                return '#FFB347';
            case 'occupied':
                return '#FF453A';
        }
    };

    const getEquipmentStatusText = (eq: Equipment) => {
        switch (eq.status) {
            case 'available':
                return 'Available';
            case 'in-use':
                return `${eq.remainingTime} min remaining`;
            case 'occupied':
                return `${eq.waitCount} waiting`;
        }
    };

    const handleRequestToUse = (eq: Equipment) => {
        if (eq.status === 'available') {
            setSelectedEquipmentForUse(eq);
            setShowDurationModal(true);
        } else {
            // Join queue
            Alert.alert(
                'Join Queue',
                `Join the wait queue for ${eq.name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Join Queue',
                        onPress: () => {
                            const newQueue: QueueItem = {
                                equipmentId: eq.id,
                                equipmentName: eq.name,
                                position: (eq.waitCount || 0) + 1,
                                estimatedWaitTime: ((eq.waitCount || 0) + 1) * 15,
                            };
                            setMyQueue([...myQueue, newQueue]);
                            Alert.alert('Success', `You are #${newQueue.position} in line for ${eq.name}`);
                        },
                    },
                ]
            );
        }
    };

    const handleStartUsage = (duration: number) => {
        if (!selectedEquipmentForUse) return;

        const newUsage: ActiveUsage = {
            equipmentId: selectedEquipmentForUse.id,
            equipmentName: selectedEquipmentForUse.name,
            equipmentImage: selectedEquipmentForUse.image,
            startTime: new Date(),
            estimatedDuration: duration,
        };

        setActiveUsage(newUsage);
        setEquipment((prev) =>
            prev.map((eq) =>
                eq.id === selectedEquipmentForUse.id
                    ? { ...eq, status: 'in-use', remainingTime: duration, currentUser: 'You' }
                    : eq
            )
        );
        setShowDurationModal(false);
        setSelectedEquipmentForUse(null);
        Alert.alert('Success', `Started using ${newUsage.equipmentName}`);
    };

    const handleStopUsage = () => {
        if (!activeUsage) return;

        Alert.alert(
            'Stop Usage',
            'Are you sure you want to stop using this equipment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Stop',
                    onPress: () => {
                        setEquipment((prev) =>
                            prev.map((eq) =>
                                eq.id === activeUsage.equipmentId ? { ...eq, status: 'available' } : eq
                            )
                        );
                        setActiveUsage(null);
                        Alert.alert('Success', 'Equipment usage ended');
                    },
                },
            ]
        );
    };

    const handleExtendTime = () => {
        if (!activeUsage) return;

        const hasQueue = myQueue.some((q) => q.equipmentId === activeUsage.equipmentId);
        if (hasQueue) {
            Alert.alert('Cannot Extend', 'Others are waiting for this equipment');
            return;
        }

        Alert.alert('Extend Time', 'How much time do you need?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: '+15 min',
                onPress: () => {
                    setActiveUsage({ ...activeUsage, estimatedDuration: activeUsage.estimatedDuration + 15 });
                    Alert.alert('Success', 'Extended by 15 minutes');
                },
            },
            {
                text: '+30 min',
                onPress: () => {
                    setActiveUsage({ ...activeUsage, estimatedDuration: activeUsage.estimatedDuration + 30 });
                    Alert.alert('Success', 'Extended by 30 minutes');
                },
            },
        ]);
    };

    const handleReportIssue = () => {
        Alert.alert('Report Issue', 'What issue are you experiencing?');
    };

    const handleCancelQueue = (item: QueueItem) => {
        Alert.alert(
            'Cancel Request',
            `Remove yourself from the queue for ${item.equipmentName}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: () => {
                        setMyQueue(myQueue.filter((q) => q.equipmentId !== item.equipmentId));
                        Alert.alert('Success', 'Removed from queue');
                    },
                },
            ]
        );
    };

    const getElapsedTime = () => {
        if (!activeUsage) return '0:00';
        const elapsed = Math.floor((Date.now() - activeUsage.startTime.getTime()) / 1000 / 60);
        const minutes = elapsed % 60;
        const hours = Math.floor(elapsed / 60);
        return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}:00`;
    };

    const maxPeakCount = Math.max(...gymStatus.peakHours.map((p) => p.count));

    return (
        <Screen>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Gym Selector Dropdown */}
                <View style={styles.gymSelectorCard}>
                    <Text style={styles.selectorLabel}>Current Gym</Text>
                    <TouchableOpacity
                        style={styles.gymDropdownButton}
                        onPress={() => setShowGymSelectorModal(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.gymDropdownContent}>
                            <View style={styles.gymDropdownLeft}>
                                <Ionicons name="location" size={20} color={palette.neonGreen} />
                                <View style={styles.gymDropdownTextContainer}>
                                    <Text style={styles.gymDropdownName}>{selectedGym?.name}</Text>
                                    <Text style={styles.gymDropdownLocation}>
                                        {selectedGym?.location.city}, {selectedGym?.location.country}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-down" size={20} color={palette.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    {myGyms.length > 1 && (
                        <Text style={styles.gymSelectorHint}>
                            Tap to switch between your {myGyms.length} gyms
                        </Text>
                    )}
                </View>

                {/* Live Status Dashboard */}
                <View style={styles.statusCard}>
                    <Text style={styles.sectionTitle}>Live Status</Text>

                    <View style={styles.statusRow}>
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Current Count</Text>
                            <Text style={styles.statusValue}>{gymStatus.currentCount} people</Text>
                        </View>
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Capacity</Text>
                            <Text style={styles.statusValue}>{gymStatus.capacity} max</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(gymStatus.status) }]}>
                        <Text style={styles.statusBadgeText}>
                            {gymStatus.status.toUpperCase()}
                        </Text>
                    </View>

                    {/* Peak Hours Graph */}
                    <View style={styles.graphContainer}>
                        <Text style={styles.graphTitle}>Peak Hours</Text>
                        <View style={styles.graph}>
                            {gymStatus.peakHours.map((data) => {
                                const height = (data.count / maxPeakCount) * 100;
                                return (
                                    <View key={data.hour} style={styles.barContainer}>
                                        <View style={[styles.bar, { height: `${height}%` }]} />
                                        <Text style={styles.barLabel}>
                                            {data.hour > 12 ? data.hour - 12 : data.hour}
                                            {data.hour >= 12 ? 'pm' : 'am'}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.recommendationCard}>
                        <Ionicons name="bulb" size={20} color="#FFB347" />
                        <Text style={styles.recommendationText}>{gymStatus.bestTimeToVisit}</Text>
                    </View>
                </View>

                {/* Active Equipment Usage */}
                {activeUsage && (
                    <View style={styles.activeUsageCard}>
                        <Text style={styles.sectionTitle}>Active Equipment Usage</Text>
                        <Image source={{ uri: activeUsage.equipmentImage }} style={styles.activeEquipmentImage} />
                        <Text style={styles.activeEquipmentName}>{activeUsage.equipmentName}</Text>
                        <Text style={styles.activeTimer}>{getElapsedTime()}</Text>
                        <Text style={styles.activeEstimate}>
                            Estimated: {activeUsage.estimatedDuration} min
                        </Text>

                        <View style={styles.activeButtonsRow}>
                            <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
                                <Ionicons name="warning" size={20} color="#fff" />
                                <Text style={styles.reportButtonText}>Report Issue</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.extendButton} onPress={handleExtendTime}>
                                <Ionicons name="time" size={20} color="#000" />
                                <Text style={styles.extendButtonText}>Extend</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.stopButton} onPress={handleStopUsage}>
                            <Text style={styles.stopButtonText}>Stop</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* My Equipment Queue */}
                {myQueue.length > 0 && (
                    <View style={styles.queueCard}>
                        <Text style={styles.sectionTitle}>My Equipment Queue</Text>
                        {myQueue.map((item) => (
                            <View key={item.equipmentId} style={styles.queueItem}>
                                <View style={styles.queueInfo}>
                                    <Text style={styles.queueEquipmentName}>{item.equipmentName}</Text>
                                    <Text style={styles.queuePosition}>Position #{item.position}</Text>
                                    <Text style={styles.queueWaitTime}>~{item.estimatedWaitTime} min wait</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.cancelQueueButton}
                                    onPress={() => handleCancelQueue(item)}
                                >
                                    <Text style={styles.cancelQueueText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Equipment Categories Filter */}
                <View style={styles.categoriesCard}>
                    <Text style={styles.categoriesTitle}>Equipment Categories</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesScrollContent}
                    >
                        {categories.map((category) => {
                            const count = getCategoryCount(category);
                            const isActive = selectedCategory === category;

                            return (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.categoryChip,
                                        isActive && styles.activeCategoryChip,
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <Icon
                                        name={getCategoryIcon(category)}
                                        size={20}
                                        color={isActive ? '#000' : palette.textSecondary}
                                        style={styles.categoryIcon}
                                    />
                                    <View style={styles.categoryTextContainer}>
                                        <Text
                                            style={[
                                                styles.categoryChipText,
                                                isActive && styles.activeCategoryChipText,
                                            ]}
                                        >
                                            {category}
                                        </Text>
                                        <View style={[
                                            styles.categoryCountBadge,
                                            isActive && styles.activeCategoryCountBadge,
                                        ]}>
                                            <Text style={[
                                                styles.categoryCountText,
                                                isActive && styles.activeCategoryCountText,
                                            ]}>
                                                {count}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Live Equipment Grid */}
                <View style={styles.equipmentGrid}>
                    {filteredEquipment.map((eq) => (
                        <View key={eq.id} style={styles.equipmentCard}>
                            <Image source={{ uri: eq.image }} style={styles.equipmentImage} />
                            <View style={styles.equipmentInfo}>
                                <Text style={styles.equipmentName}>{eq.name}</Text>
                                <View
                                    style={[
                                        styles.equipmentStatusBadge,
                                        { backgroundColor: getEquipmentStatusColor(eq.status) },
                                    ]}
                                >
                                    <Text style={styles.equipmentStatusText}>{getEquipmentStatusText(eq)}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.requestButton,
                                    eq.status === 'available' && styles.requestButtonAvailable,
                                ]}
                                onPress={() => handleRequestToUse(eq)}
                            >
                                <Text style={styles.requestButtonText}>
                                    {eq.status === 'available' ? 'Use Now' : 'Join Queue'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Gym Selector Modal */}
            <Modal
                visible={showGymSelectorModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowGymSelectorModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Gym</Text>
                        <Text style={styles.modalSubtitle}>
                            Choose which gym's live status to view
                        </Text>

                        {myGyms.map((gym) => (
                            <TouchableOpacity
                                key={gym.id}
                                style={[
                                    styles.gymOptionButton,
                                    selectedGymId === gym.id && styles.gymOptionButtonActive,
                                ]}
                                onPress={() => {
                                    setSelectedGymId(gym.id);
                                    setShowGymSelectorModal(false);
                                }}
                            >
                                <View style={styles.gymOptionContent}>
                                    <Ionicons
                                        name="location"
                                        size={24}
                                        color={selectedGymId === gym.id ? '#000' : palette.neonGreen}
                                    />
                                    <View style={styles.gymOptionTextContainer}>
                                        <Text
                                            style={[
                                                styles.gymOptionName,
                                                selectedGymId === gym.id && styles.gymOptionNameActive,
                                            ]}
                                        >
                                            {gym.name}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.gymOptionLocation,
                                                selectedGymId === gym.id && styles.gymOptionLocationActive,
                                            ]}
                                        >
                                            {gym.location.address}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.gymOptionCity,
                                                selectedGymId === gym.id && styles.gymOptionCityActive,
                                            ]}
                                        >
                                            {gym.location.city}, {gym.location.country}
                                        </Text>
                                    </View>
                                    {selectedGymId === gym.id && (
                                        <Ionicons name="checkmark-circle" size={24} color="#000" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.cancelModalButton}
                            onPress={() => setShowGymSelectorModal(false)}
                        >
                            <Text style={styles.cancelModalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Duration Selection Modal */}
            <Modal
                visible={showDurationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDurationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Duration</Text>
                        <Text style={styles.modalSubtitle}>
                            How long do you plan to use {selectedEquipmentForUse?.name}?
                        </Text>

                        <TouchableOpacity
                            style={styles.durationOption}
                            onPress={() => handleStartUsage(15)}
                        >
                            <Text style={styles.durationOptionText}>15 minutes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.durationOption}
                            onPress={() => handleStartUsage(30)}
                        >
                            <Text style={styles.durationOptionText}>30 minutes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.durationOption}
                            onPress={() => handleStartUsage(45)}
                        >
                            <Text style={styles.durationOptionText}>45 minutes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelModalButton}
                            onPress={() => setShowDurationModal(false)}
                        >
                            <Text style={styles.cancelModalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    gymSelectorCard: {
        backgroundColor: '#1E1E1E',
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: radii.lg,
    },
    selectorLabel: {
        ...typography.captionBold,
        color: palette.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    gymDropdownButton: {
        backgroundColor: '#2A2A2A',
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 127, 0.3)',
        overflow: 'hidden',
    },
    gymDropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    gymDropdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    gymDropdownTextContainer: {
        flex: 1,
    },
    gymDropdownName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: 2,
        fontWeight: '600',
    },
    gymDropdownLocation: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
    },
    gymSelectorHint: {
        ...typography.caption,
        color: palette.textSecondary,
        marginTop: spacing.xs,
        fontSize: 11,
        fontStyle: 'italic',
    },
    gymChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.round,
        backgroundColor: '#2A2A2A',
        marginRight: spacing.sm,
    },
    activeGymChip: {
        backgroundColor: '#00FF7F',
    },
    gymChipText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
    },
    activeGymChipText: {
        color: '#000',
        fontWeight: '600',
    },
    statusCard: {
        backgroundColor: '#1E1E1E',
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: radii.lg,
    },
    sectionTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.md,
    },
    statusItem: {
        alignItems: 'center',
    },
    statusLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: 4,
    },
    statusValue: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    statusBadge: {
        alignSelf: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.round,
        marginBottom: spacing.md,
    },
    statusBadgeText: {
        ...typography.bodyBold,
        color: '#000',
        fontWeight: '700',
    },
    graphContainer: {
        marginTop: spacing.md,
    },
    graphTitle: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    graph: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        marginBottom: spacing.sm,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '70%',
        backgroundColor: '#00FF7F',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 9,
        marginTop: 4,
    },
    recommendationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        padding: spacing.md,
        borderRadius: radii.md,
        marginTop: spacing.md,
    },
    recommendationText: {
        ...typography.body,
        color: palette.textPrimary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    activeUsageCard: {
        backgroundColor: '#1E1E1E',
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: radii.lg,
        alignItems: 'center',
    },
    activeEquipmentImage: {
        width: 120,
        height: 120,
        borderRadius: radii.md,
        marginBottom: spacing.md,
    },
    activeEquipmentName: {
        ...typography.heading2,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    activeTimer: {
        ...typography.display,
        color: '#00FF7F',
        marginBottom: 4,
    },
    activeEstimate: {
        ...typography.body,
        color: palette.textSecondary,
        marginBottom: spacing.lg,
    },
    activeButtonsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
        width: '100%',
    },
    reportButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF453A',
        padding: spacing.sm,
        borderRadius: radii.md,
        gap: spacing.xs,
    },
    reportButtonText: {
        ...typography.bodyBold,
        color: '#fff',
        fontSize: 14,
    },
    extendButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFB347',
        padding: spacing.sm,
        borderRadius: radii.md,
        gap: spacing.xs,
    },
    extendButtonText: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 14,
    },
    stopButton: {
        width: '100%',
        backgroundColor: '#2A2A2A',
        padding: spacing.md,
        borderRadius: radii.md,
        alignItems: 'center',
    },
    stopButtonText: {
        ...typography.bodyBold,
        color: palette.textPrimary,
    },
    queueCard: {
        backgroundColor: '#1E1E1E',
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: radii.lg,
    },
    queueItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        padding: spacing.md,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    queueInfo: {
        flex: 1,
    },
    queueEquipmentName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: 4,
    },
    queuePosition: {
        ...typography.body,
        color: '#00FF7F',
        fontSize: 14,
    },
    queueWaitTime: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    cancelQueueButton: {
        backgroundColor: '#FF453A',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
    },
    cancelQueueText: {
        ...typography.bodyBold,
        color: '#fff',
        fontSize: 14,
    },
    categoriesCard: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    categoriesTitle: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
        fontWeight: '600',
    },
    categoriesScrollContent: {
        paddingRight: spacing.md,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.round,
        backgroundColor: '#2A2A2A',
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeCategoryChip: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    categoryIcon: {
        marginRight: spacing.xs,
    },
    categoryTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    categoryChipText: {
        ...typography.body,
        color: palette.textSecondary,
        fontWeight: '500',
    },
    activeCategoryChipText: {
        color: '#000',
        fontWeight: '700',
    },
    categoryCountBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeCategoryCountBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    categoryCountText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    activeCategoryCountText: {
        color: '#000',
        fontWeight: '700',
    },
    equipmentGrid: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },
    equipmentCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    equipmentImage: {
        width: '100%',
        height: 150,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    equipmentInfo: {
        marginBottom: spacing.sm,
    },
    equipmentName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: 4,
    },
    equipmentStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    equipmentStatusText: {
        ...typography.caption,
        color: '#000',
        fontWeight: '600',
        fontSize: 12,
    },
    requestButton: {
        backgroundColor: '#2A2A2A',
        padding: spacing.sm,
        borderRadius: radii.md,
        alignItems: 'center',
    },
    requestButtonAvailable: {
        backgroundColor: '#00FF7F',
    },
    requestButtonText: {
        ...typography.bodyBold,
        color: palette.textPrimary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: radii.lg,
        padding: spacing.xl,
        width: '100%',
    },
    modalTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    modalSubtitle: {
        ...typography.body,
        color: palette.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    durationOption: {
        backgroundColor: '#00FF7F',
        padding: spacing.md,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
        alignItems: 'center',
    },
    durationOptionText: {
        ...typography.bodyBold,
        color: '#000',
    },
    gymOptionButton: {
        backgroundColor: '#2A2A2A',
        borderRadius: radii.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    gymOptionButtonActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    gymOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    gymOptionTextContainer: {
        flex: 1,
    },
    gymOptionName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: 4,
        fontWeight: '600',
    },
    gymOptionNameActive: {
        color: '#000',
    },
    gymOptionLocation: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: 2,
    },
    gymOptionLocationActive: {
        color: 'rgba(0, 0, 0, 0.7)',
    },
    gymOptionCity: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
    },
    gymOptionCityActive: {
        color: 'rgba(0, 0, 0, 0.6)',
    },
    cancelModalButton: {
        backgroundColor: '#2A2A2A',
        padding: spacing.md,
        borderRadius: radii.md,
        marginTop: spacing.sm,
        alignItems: 'center',
    },
    cancelModalButtonText: {
        ...typography.bodyBold,
        color: palette.textPrimary,
    },
});
