import { StyleSheet, Text, View } from 'react-native';

export const ProgressScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
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
