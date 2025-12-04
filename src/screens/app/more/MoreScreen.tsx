import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography } from '@/theme';
import { getUserProfile } from '@/services/profileService';
import { getWalletBalance } from '@/services/walletService';
import { getRewardWallet } from '@/services/referralService';
import { getUnreadCount } from '@/services/notificationService';
import { getSupportStats } from '@/services/supportService';

interface ProfileData {
  full_name: string | null;
  email: string;
  profile_picture: string | null;
  bio: string | null;
}

interface StatsData {
  walletBalance: number;
  rewardPoints: number;
  unreadNotifications: number;
  openTickets: number;
}

export const MoreScreen = () => {
  const { signOut, user } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData>({
    walletBalance: 0,
    rewardPoints: 0,
    unreadNotifications: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load profile
      const { data: profileData } = await getUserProfile(user.id);

      // Load wallet balance
      const { data: walletData } = await getWalletBalance(user.id);

      // Load reward points
      const { data: rewardData } = await getRewardWallet(user.id);

      // Load unread notifications count
      const { data: unreadCount } = await getUnreadCount(user.id);

      // Load support stats
      const { data: supportData } = await getSupportStats(user.id);

      setProfile({
        full_name: profileData?.full_name || null,
        email: user.email || '',
        profile_picture: profileData?.profile_picture || null,
        bio: profileData?.bio || null,
      });

      setStats({
        walletBalance: walletData?.balance || 0,
        rewardPoints: rewardData?.current_balance || 0,
        unreadNotifications: unreadCount || 0,
        openTickets: supportData?.openTickets || 0,
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    badge,
    onPress,
    showChevron = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    badge?: number;
    onPress: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        {showChevron && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={palette.brandPrimary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => navigation.navigate('EditProfile' as never)}
      >
        <View style={styles.profileLeft}>
          <View style={styles.avatarContainer}>
            {profile?.profile_picture ? (
              <Image
                source={{ uri: profile.profile_picture }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {profile?.full_name?.charAt(0).toUpperCase() ||
                    profile?.email?.charAt(0).toUpperCase() ||
                    '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || 'Set your name'}
            </Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
            {profile?.bio && (
              <Text style={styles.profileBio} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.walletBalance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Wallet Balance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.rewardPoints}</Text>
          <Text style={styles.statLabel}>Reward Points</Text>
        </View>
      </View>

      {/* Progress & Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress & Stats</Text>
        <MenuItem
          icon=""
          title="Body Stats"
          subtitle="Track your measurements"
          onPress={() => navigation.navigate('BodyStats' as never)}
        />
        <MenuItem
          icon=""
          title="Fitness Goals"
          subtitle="Set and track your goals"
          onPress={() => navigation.navigate('FitnessGoals' as never)}
        />
        <MenuItem
          icon=""
          title="Achievements"
          subtitle="View your badges"
          onPress={() => navigation.navigate('Achievements' as never)}
        />
        <MenuItem
          icon=""
          title="Wearable Devices"
          subtitle="Connect fitness devices"
          onPress={() => navigation.navigate('WearableDevices' as never)}
        />
      </View>

      {/* Wallet & Payments Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet & Payments</Text>

        {/* TEST BUTTON - for testing */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => {
            (navigation as any).navigate('PaymentCheckout', {
              bookingDetails: {
                bookingId: '00000000-0000-0000-0000-000000000001',
                gymName: 'PowerGym Downtown',
                trainerName: 'John Fitness',
                sessionDate: '2025-11-15',
                sessionTime: '10:00 AM - 11:00 AM',
                duration: 60,
                baseFee: 500,
                discount: 50,
                tax: 45,
                finalAmount: 495,
                bookingType: 'gym' as const,
              }
            });
          }}
        >
          <Text style={styles.testButtonText}> TEST PAYMENT CHECKOUT</Text>
        </TouchableOpacity>

        <MenuItem
          icon=""
          title="My Wallet"
          subtitle={`Balance: $${stats.walletBalance.toFixed(2)}`}
          onPress={() => navigation.navigate('Wallet' as never)}
        />
        <MenuItem
          icon=""
          title="Transaction History"
          subtitle="View all transactions"
          onPress={() => navigation.navigate('TransactionHistory' as never)}
        />
        <MenuItem
          icon=""
          title="Payment Methods"
          subtitle="Manage payment methods"
          onPress={() => navigation.navigate('PaymentMethods' as never)}
        />
      </View>

      {/* Bookings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bookings</Text>
        <MenuItem
          icon=""
          title="My Bookings"
          subtitle="View and manage bookings"
          onPress={() => navigation.navigate('Bookings' as never)}
        />
      </View>

      {/* Referrals & Rewards Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Referrals & Rewards</Text>
        <MenuItem
          icon=""
          title="Referral Program"
          subtitle="Invite friends & earn rewards"
          onPress={() => navigation.navigate('Referrals' as never)}
        />
        <MenuItem
          icon=""
          title="My Rewards"
          subtitle={`${stats.rewardPoints} points available`}
          onPress={() => navigation.navigate('Rewards' as never)}
        />
        <MenuItem
          icon=""
          title="Offers & Deals"
          subtitle="View exclusive offers"
          onPress={() => navigation.navigate('Offers' as never)}
        />
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <MenuItem
          icon=""
          title="Notifications"
          subtitle="View all notifications"
          badge={stats.unreadNotifications}
          onPress={() => navigation.navigate('Notifications' as never)}
        />
        <MenuItem
          icon=""
          title="Notification Settings"
          subtitle="Manage preferences"
          onPress={() => navigation.navigate('NotificationSettings' as never)}
        />
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <MenuItem
          icon=""
          title="App Settings"
          subtitle="Preferences & configurations"
          onPress={() => navigation.navigate('Settings' as never)}
        />
      </View>

      {/* Help & Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <MenuItem
          icon="❓"
          title="Help Center"
          subtitle="FAQs and support"
          badge={stats.openTickets}
          onPress={() => navigation.navigate('HelpSupport' as never)}
        />
        <MenuItem
          icon=""
          title="Contact Us"
          subtitle="Get in touch"
          onPress={() => navigation.navigate('HelpSupport' as never)}
        />
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutIcon}></Text>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SIXFINITY v1.0.0</Text>
        <Text style={styles.footerSubtext}></Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.heading1,
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  // Profile Section
  profileSection: {
    backgroundColor: palette.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    backgroundColor: palette.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.heading2,
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.heading3,
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 14,
  },
  profileBio: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  editButton: {
    backgroundColor: palette.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  editButtonText: {
    ...typography.subtitle,
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading2,
    color: palette.neonGreen,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  // Section
  section: {
    backgroundColor: palette.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body,
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 13,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: palette.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: palette.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    ...typography.heading2,
    color: palette.textTertiary,
    fontSize: 28,
    fontWeight: '300',
  },
  // Test Button - REMOVE AFTER TESTING
  testButton: {
    backgroundColor: palette.brandPrimary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Sign Out Button
  signOutButton: {
    backgroundColor: palette.danger,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  signOutText: {
    ...typography.subtitle,
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: palette.textTertiary,
    fontSize: 12,
    marginBottom: 4,
  },
  footerSubtext: {
    ...typography.caption,
    color: palette.textTertiary,
    fontSize: 11,
  },
});
