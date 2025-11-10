import { StyleSheet, Text, View } from 'react-native';

export const WorkoutScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout</Text>
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
