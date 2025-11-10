/**
 * CameraScreen - Real Camera Photo Capture
 * 
 * Allows users to:
 * - Take a photo of their meal
 * - Upload from gallery
 * - Send photo to MealAnalysis for AI nutrition tracking
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Camera'>;

export const CameraScreen: React.FC<Props> = ({ navigation }) => {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        (async () => {
            if (!permission?.granted) {
                await requestPermission();
            }
        })();
    }, []);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });

                if (photo?.uri) {
                    // Navigate to MealAnalysis with the captured photo
                    navigation.replace('MealAnalysis', {
                        imageUri: photo.uri,
                        scanType: 'camera',
                    });
                }
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
        }
    };

    const pickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                // Navigate to MealAnalysis with the selected photo
                navigation.replace('MealAnalysis', {
                    imageUri: result.assets[0].uri,
                    scanType: 'camera',
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select photo. Please try again.');
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    if (!permission) {
        return (
            <Screen>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Loading camera...</Text>
                </View>
            </Screen>
        );
    }

    if (!permission.granted) {
        return (
            <Screen>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={80} color={palette.textSecondary} />
                    <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                    <Text style={styles.permissionText}>
                        We need access to your camera to take photos of your meals for nutrition tracking.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </Screen>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={32} color={palette.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Take Photo of Your Meal</Text>
                    <View style={{ width: 32 }} />
                </View>

                {/* Guide Frame */}
                <View style={styles.guideFrame}>
                    <View style={styles.guideBorder} />
                    <Text style={styles.guideText}>Position your meal in the frame</Text>
                </View>

                {/* Bottom Controls */}
                <View style={styles.controls}>
                    {/* Gallery Button */}
                    <TouchableOpacity style={styles.controlButton} onPress={pickFromGallery}>
                        <Ionicons name="images" size={32} color={palette.textPrimary} />
                        <Text style={styles.controlButtonText}>Gallery</Text>
                    </TouchableOpacity>

                    {/* Capture Button */}
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>

                    {/* Flip Camera Button */}
                    <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={32} color={palette.textPrimary} />
                        <Text style={styles.controlButtonText}>Flip</Text>
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    camera: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        gap: spacing.lg,
    },
    permissionTitle: {
        ...typography.heading1,
        color: palette.textPrimary,
        textAlign: 'center',
    },
    permissionText: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: 'center',
        fontSize: 16,
    },
    permissionButton: {
        backgroundColor: palette.neonGreen,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radii.round,
        marginTop: spacing.lg,
    },
    permissionButtonText: {
        ...typography.body,
        color: palette.background,
        fontWeight: '700',
        fontSize: 16,
    },
    backButton: {
        paddingVertical: spacing.md,
    },
    backButtonText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    guideFrame: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    guideBorder: {
        width: 280,
        height: 280,
        borderWidth: 3,
        borderColor: palette.neonGreen,
        borderRadius: radii.lg,
        backgroundColor: 'transparent',
    },
    guideText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        marginTop: spacing.lg,
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.round,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    controlButton: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    controlButtonText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: palette.textPrimary,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: palette.textPrimary,
    },
});
