import { StyleSheet, Text, View } from 'react-native';

export const VerifyEmailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
