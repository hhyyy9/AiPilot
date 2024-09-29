import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from './stores/AppStore';
import Page1 from './PageOne';
import Page2 from './PageTwo';
import Page3 from './PageThree';
import Page4 from './PageFour';
import StepIndicator from './components/StepIndicator';

const App = observer(() => {
  const renderPage = () => {
    switch (appStore.currentStep) {
      case 1:
        return <Page1 />;
      case 2:
        return <Page2 />;
      case 3:
        return <Page3 />;
      case 4:
        return <Page4 />;
      default:
        return <Page1 />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator />
      {renderPage()}
    </SafeAreaView>
  );
});

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});