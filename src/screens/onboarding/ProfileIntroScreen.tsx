import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Screen } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography } from '@/theme';

type ProfileIntroNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'ProfileIntro'>;

export const ProfileIntroScreen = () => {
  const navigation = useNavigation<ProfileIntroNavigation>();
  
  return (
    <Screen centered>
      <View style={styles.header}>
        <Text style={styles.emoji}></Text>
        <Text style={styles.title}>Welcome to SIXFINITY!</Text>
        <Text style={styles.subtitle}>Let's personalize your fitness journey.</Text>
      </View>
      <Button label="Get Started" onPress={() => navigation.navigate('ProfileDetails')} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  emoji: { fontSize: 64 },
  title: { ...typography.heading1, color: palette.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.body, color: palette.textSecondary, textAlign: 'center' },
});
