import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography } from '@/theme';

export const MoreScreen = () => {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
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
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading1,
    color: palette.textPrimary,
    marginBottom: spacing.xl,
    marginTop: spacing.xxl,
  },
  section: {
    backgroundColor: palette.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.textSecondary,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: palette.textPrimary,
  },
  signOutButton: {
    backgroundColor: palette.danger,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signOutText: {
    ...typography.subtitle,
    color: palette.textPrimary,
    fontWeight: '700',
  },
});
