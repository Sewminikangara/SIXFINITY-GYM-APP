import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Screen, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { AuthStackParamList } from '@/navigation/types';
import { palette, spacing, typography } from '@/theme';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

type ForgotPasswordNavigation = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordNavigation>();
  const { sendOTP } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    defaultValues: { email: '' },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }: ForgotPasswordForm) => {
    setSubmitting(true);
    const result = await sendOTP({ email, type: 'email' });
    setSubmitting(false);

    if (!result.success && result.error) {
      Alert.alert('Unable to send verification code', result.error);
      return;
    }

    // Navigate to OTP verification screen
    navigation.navigate('VerifyOTP', { email, type: 'reset' });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.emoji}></Text>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a verification code to reset your password.
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />

      <Button label="Send verification code" onPress={handleSubmit(onSubmit)} loading={submitting} />

      <TouchableOpacity style={styles.footer} onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to sign in</Text>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading1,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
  },
  footer: {
    marginTop: spacing.lg,
  },
  link: {
    ...typography.caption,
    color: palette.brandSecondary,
    textAlign: 'center',
  },
});
