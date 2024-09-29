import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from '../stores/AppStore';

const StepIndicator = observer(() => {
  const steps = [1, 2, 3, 4]; // 改为只有4个步骤

  const handleStepPress = (step: number) => {
    if (step <= appStore.currentStep) {
      appStore.setCurrentStep(step);
    }
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <TouchableOpacity
            style={[styles.step, appStore.currentStep >= step && styles.activeStep]}
            onPress={() => handleStepPress(step)}
          >
            <Text style={[styles.stepText, appStore.currentStep >= step && styles.activeStepText]}>
              {step}
            </Text>
          </TouchableOpacity>
          {index < steps.length - 1 && (
            <View style={[styles.connector, appStore.currentStep > step && styles.activeConnector]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#4A90E2',
  },
  stepText: {
    color: '#fff',
    fontSize: 16,
  },
  activeStepText: {
    fontWeight: 'bold',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#d0d0d0',
    marginHorizontal: 5,
  },
  activeConnector: {
    backgroundColor: '#4A90E2',
  },
});

export default StepIndicator;