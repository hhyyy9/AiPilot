import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from './stores/AppStore';

const Page5 = observer(() => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>第 {appStore.currentStep} 页</Text>
      <Text style={styles.description}>这里是第 {appStore.currentStep} 页的内容</Text>
    </View>
  );
});

export default Page5;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
});