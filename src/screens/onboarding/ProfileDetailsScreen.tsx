import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Screen, TextField } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography } from '@/theme';

const schema = z.object({
  age: z.string().min(1, 'Age required'),
  height: z.string().min(1, 'Height required'),
  weight: z.string().min(1, 'Weight required'),
});

type ProfileDetailsNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'ProfileDetails'>;

export const ProfileDetailsScreen = () => {
  const navigation = useNavigation<ProfileDetailsNavigation>();
  const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: { age: '', height: '', weight: '' }, resolver: zodResolver(schema) });

  const onSubmit = (data: { age: string; height: string; weight: string }) => {
    // Pass collected data to next screen
    navigation.navigate('Goals', {
      profile: {
        age: parseInt(data.age, 10),
        heightCm: parseFloat(data.height),
        weightKg: parseFloat(data.weight),
      },
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Tell us about yourself</Text>
      </View>
      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Age"
            keyboardType="numeric"
            placeholder="24"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.age?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="height"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Height (cm)"
            keyboardType="numeric"
            placeholder="165"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.height?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="weight"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Weight (kg)"
            keyboardType="numeric"
            placeholder="75"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.weight?.message}
          />
        )}
      />
      <Button label="Continue" onPress={handleSubmit(onSubmit)} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: spacing.xl },
  title: { ...typography.heading1, color: palette.textPrimary },
});
