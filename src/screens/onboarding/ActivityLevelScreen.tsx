import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Screen } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography } from '@/theme';

type ActivityLevelNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'ActivityLevel'>;
type ActivityLevelRoute = RouteProp<OnboardingStackParamList, 'ActivityLevel'>;

const levels = [
  { id: 'sedentary', label: 'Sedentary', emoji: '' },
  { id: 'lightly_active', label: 'Lightly Active', emoji: '' },
  { id: 'very_active', label: 'Very Active', emoji: '' },
];

export const ActivityLevelScreen = () => {
  const navigation = useNavigation<ActivityLevelNavigation>();
  const route = useRoute<ActivityLevelRoute>();
  const [selected, setSelected] = useState<string | null>(null);

  const previousData = route.params?.profile || {};

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Level</Text>
      </View>
      <ScrollView>
        {levels.map(l => (
          <TouchableOpacity key={l.id} style={[styles.card, selected === l.id && styles.cardSelected]} onPress={() => setSelected(l.id)}>
            <Text style={styles.emoji}>{l.emoji}</Text>
            <Text style={styles.label}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Button
        label="Continue"
        onPress={() => navigation.navigate('Summary', {
          profile: {
            ...previousData,
            activityLevel: selected as 'sedentary' | 'lightly_active' | 'very_active',
          },
        })}
        disabled={!selected}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  title: { ...typography.heading1, color: palette.textPrimary },
  card: { padding: spacing.md, marginBottom: spacing.md, backgroundColor: palette.surface, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  cardSelected: { backgroundColor: palette.brandPrimary + '20' },
  emoji: { fontSize: 32, marginRight: spacing.md },
  label: { ...typography.subtitle, color: palette.textPrimary },
});
