import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Button, Text, Modal } from '@ant-design/react-native';
import { appStore, LANGUAGE_MAP } from './stores/AppStore';
import PageLayout from './components/PageLayout';
import StepIndicator from './components/StepIndicator';
import Header from './components/Header';
import { useNavigation } from '@react-navigation/native';

const PageThree = observer(() => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const scrollToEnglish = () => {
      const languageKeys = Object.keys(LANGUAGE_MAP);
      const englishIndex = languageKeys.indexOf('en');
      if (englishIndex !== -1 && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: englishIndex * 50, animated: true });
      }
    };

    setTimeout(scrollToEnglish, 100);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
    appStore.setLanguage(LANGUAGE_MAP[langCode].name);
    const selectedRecordingLanguageCode = LANGUAGE_MAP[langCode].code;
    appStore.setRecordingLanguage(selectedRecordingLanguageCode);
    console.log('selectedLanguage:', appStore.language);
    console.log('selectedRecordingLanguageCode:', appStore.recordingLanguage);
  };

  const handleNextStep = () => {
    if (selectedLanguage) {
      appStore.nextStep();
      navigation.navigate('PageFour' as never);
    } else {
      Modal.alert('错误', '请选择一种语言');
    }
  };

  const handleMenuPress = () => {
    console.log('Menu button pressed');
  };

  const handleBackPress = () => {
    appStore.setCurrentStep(2);
    navigation.goBack();
  };

  const renderFooter = () => (
    <Button type="primary" onPress={handleNextStep}>
      下一步
    </Button>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Header title="设置面试语言" onMenuPress={handleMenuPress} isShowBackButton={true} onBackPress={handleBackPress} />
      <StepIndicator />
      <View style={styles.container}>
        <ScrollView ref={scrollViewRef} style={styles.languageContainer}>
          {Object.entries(LANGUAGE_MAP).map(([code, { name, code: langCode }]) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.languageButton,
                selectedLanguage === code && styles.selectedLanguageButton
              ]}
              onPress={() => handleLanguageSelect(code)}
            >
              <Text style={[
                styles.languageButtonText,
                selectedLanguage === code && styles.selectedLanguageButtonText
              ]}>
                {`${name} (${langCode})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  languageContainer: {
    flex: 1,
    width: '100%',
  },
  languageButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedLanguageButton: {
    backgroundColor: '#e6f3ff',
  },
  languageButtonText: {
    fontSize: 16,
  },
  selectedLanguageButtonText: {
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});

export default PageThree;
