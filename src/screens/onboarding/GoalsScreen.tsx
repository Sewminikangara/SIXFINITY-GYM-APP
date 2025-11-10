import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Screen } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography } from '@/theme';

type GoalsNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'Goals'>;
type GoalsRoute = RouteProp<OnboardingStackParamList, 'Goals'>;

const goals = [
  { id: 'lose_weight', label: 'Lose Weight', emoji: '' },
  { id: 'build_muscle', label: 'Build Muscle', emoji: '' },
  { id: 'general_fitness', label: 'General Fitness', emoji: '' },
];

export const GoalsScreen = () => {
  const navigation = useNavigation<GoalsNavigation>();
  const route = useRoute<GoalsRoute>();
  const [selected, setSelected] = useState<string | null>(null);

  const previousData = route.params?.profile || {};

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>What's your goal?</Text>
      </View>
      <ScrollView>
        {goals.map(g => (
          <TouchableOpacity key={g.id} style={[styles.card, selected === g.id && styles.cardSelected]} onPress={() => setSelected(g.id)}>
            <Text style={styles.emoji}>{g.emoji}</Text>
            <Text style={styles.label}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Button
        label="Continue"
        onPress={() => navigation.navigate('ActivityLevel', {
          profile: {
            ...previousData,
            primaryGoal: selected as 'lose_weight' | 'build_muscle' | 'general_fitness',
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
