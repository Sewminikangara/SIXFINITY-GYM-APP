import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography } from '@/theme';
import { getUserProfile, updateProfile } from '@/services/profileService';
import { Screen } from '@/components/Screen';
import { getSupabaseUserId } from '@/utils/userHelpers';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ProfileFormData {
    full_name: string;
    phone: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    height_cm: string;
    weight_kg: string;
    bio: string;
    profile_picture: string | null;
}

export const EditProfileScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        full_name: '',
        phone: '',
        date_of_birth: '',
        gender: null,
        height_cm: '',
        weight_kg: '',
        bio: '',
        profile_picture: null,
    });

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user?.id) return;

        const supabaseUserId = getSupabaseUserId(user);
        if (!supabaseUserId) {
            Alert.alert('Error', 'User session invalid. Please login again.');
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await getUserProfile(supabaseUserId);

            if (error) {
                console.error('Error loading profile:', error);
                Alert.alert('Error', 'Failed to load profile');
                return;
            }

            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    date_of_birth: data.date_of_birth || '',
                    gender: data.gender || null,
                    height_cm: data.height_cm?.toString() || '',
                    weight_kg: data.weight_kg?.toString() || '',
                    bio: data.bio || '',
                    profile_picture: data.profile_picture || null,
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;

        const supabaseUserId = getSupabaseUserId(user);
        if (!supabaseUserId) {
            Alert.alert('Error', 'User session invalid. Please login again.');
            return;
        }

        // Validation
        if (!formData.full_name.trim()) {
            Alert.alert('Validation Error', 'Please enter your full name');
            return;
        }

        if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
            Alert.alert('Validation Error', 'Please enter a valid phone number');
            return;
        }

        if (formData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
            Alert.alert('Validation Error', 'Please enter date in YYYY-MM-DD format');
            return;
        }

        try {
            setSaving(true);

            const updateData: any = {
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim() || null,
                date_of_birth: formData.date_of_birth || null,
                gender: formData.gender,
                height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
                weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
                bio: formData.bio.trim() || null,
                profile_picture: formData.profile_picture,
            };

            const { error } = await updateProfile(supabaseUserId, updateData);

            if (error) {
                throw error;
            }

            Alert.alert('Success', 'Profile updated successfully', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = () => {
        Alert.alert(
            'Upload Photo',
            'Photo upload feature coming soon! For now, you can use a direct URL.',
            [
                {
                    text: 'Enter URL',
                    onPress: () => {
                        Alert.prompt(
                            'Profile Photo URL',
                            'Enter the URL of your profile photo',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Save',
                                    onPress: (url) => {
                                        if (url) {
                                            setFormData({ ...formData, profile_picture: url });
                                        }
                                    },
                                },
                            ],
                            'plain-text',
                            formData.profile_picture || ''
                        );
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    if (loading) {
        return (
            <Screen>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.brandPrimary} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={palette.textPrimary} />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Profile Picture */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Photo</Text>
                    <View style={styles.photoContainer}>
                        <TouchableOpacity onPress={handleImageUpload} style={styles.photoButton}>
                            {formData.profile_picture ? (
                                <Image source={{ uri: formData.profile_picture }} style={styles.photo} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Text style={styles.photoPlaceholderText}>
                                        {formData.full_name?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.photoEditBadge}>
                                <Icon name="camera" size={18} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.photoHint}>Tap to change photo</Text>
                    </View>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Full Name <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={formData.full_name}
                            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                            placeholder="Enter your full name"
                            placeholderTextColor={palette.textTertiary}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={user?.email || ''}
                            editable={false}
                            placeholderTextColor={palette.textTertiary}
                        />
                        <Text style={styles.helperText}>Email cannot be changed</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            placeholder="+94 76 007 4790"
                            placeholderTextColor={palette.textTertiary}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.date_of_birth}
                            onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={palette.textTertiary}
                        />
                        <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 1990-01-15)</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderContainer}>
                            {[
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                                { value: 'other', label: 'Other' },
                                { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.genderOption,
                                        formData.gender === option.value && styles.genderOptionSelected,
                                    ]}
                                    onPress={() =>
                                        setFormData({
                                            ...formData,
                                            gender: option.value as ProfileFormData['gender'],
                                        })
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.genderLabel,
                                            formData.gender === option.value && styles.genderLabelSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Physical Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Physical Stats</Text>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Height (cm)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.height_cm}
                                onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
                                placeholder="165"
                                placeholderTextColor={palette.textTertiary}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.weight_kg}
                                onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
                                placeholder="75"
                                placeholderTextColor={palette.textTertiary}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>
                </View>

                {/* Bio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Me</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            value={formData.bio}
                            onChangeText={(text) => setFormData({ ...formData, bio: text })}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor={palette.textTertiary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <Text style={styles.helperText}>
                            {formData.bio.length}/200 characters
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
        backgroundColor: palette.background,
    },
    backButton: {
        padding: spacing.sm,
    },
    backButtonText: {
        ...typography.subtitle,
        color: palette.brandPrimary,
        fontSize: 32,
        fontWeight: '300',
    },
    headerTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.subtitle,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    // Photo
    photoContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    photoButton: {
        position: 'relative',
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: palette.surface,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: palette.brandPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 48,
        fontWeight: '700',
    },
    photoEditBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: palette.neonGreen,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: palette.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    photoHint: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
        marginTop: spacing.sm,
        fontWeight: '500',
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: spacing.xs,
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
        alignItems: 'center',
    },
    photoOverlayText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 11,
        fontWeight: '600',
    },
    // Input
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    required: {
        color: palette.danger,
    },
    input: {
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
    },
    inputDisabled: {
        opacity: 0.5,
    },
    bioInput: {
        height: 100,
        paddingTop: spacing.md,
    },
    helperText: {
        ...typography.caption,
        color: palette.textTertiary,
        fontSize: 12,
        marginTop: spacing.xs,
    },
    // Gender
    genderContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    genderOption: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        gap: spacing.xs,
    },
    genderOptionSelected: {
        backgroundColor: palette.brandPrimary,
        borderColor: palette.brandPrimary,
    },
    genderLabel: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    genderLabelSelected: {
        color: palette.textPrimary,
    },
    // Row
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    halfWidth: {
        flex: 1,
    },
    bottomSpacer: {
        height: spacing.xxl,
    },
});
