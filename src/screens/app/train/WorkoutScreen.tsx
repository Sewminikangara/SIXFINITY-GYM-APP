import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { palette, spacing, typography } from '@/theme';
import { WorkoutsTab } from './WorkoutsTab';
import { TrainersTab } from './TrainersTab';

type TabType = 'workouts' | 'trainers';

export const WorkoutScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workouts');
  const [slideAnim] = useState(new Animated.Value(0));

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === 'workouts' ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const indicatorTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180], // Adjust based on tab width
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts & Trainers</Text>
        <Text style={styles.headerSubtitle}>Train smarter, achieve faster</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'workouts' && styles.activeTab]}
            onPress={() => switchTab('workouts')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>
              Workouts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'trainers' && styles.activeTab]}
            onPress={() => switchTab('trainers')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'trainers' && styles.activeTabText]}>
              Trainers
            </Text>
          </TouchableOpacity>

          {/* Animated Indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{ translateX: indicatorTranslate }],
              },
            ]}
          />
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'workouts' ? <WorkoutsTab /> : <TrainersTab />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.heading1,
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 14,
  },
  tabContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    zIndex: 2,
  },
  activeTab: {
    // backgroundColor is handled by indicator
  },
  tabText: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: palette.background,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '48%',
    height: '85%',
    backgroundColor: palette.neonGreen,
    borderRadius: 10,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
});
