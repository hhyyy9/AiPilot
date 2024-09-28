import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from '../stores/AppStore';

const StepIndicator = observer(() => {
  const steps = [1, 2, 3, 4, 5];

  const handleStepPress = (step: number) => {
    appStore.setCurrentStep(step);
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
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  activeStep: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  stepText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeStepText: {
    color: '#FFFFFF',
  },
  connector: {
    width: 30,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  activeConnector: {
    backgroundColor: '#4A90E2',
  },
});

export default StepIndicator;