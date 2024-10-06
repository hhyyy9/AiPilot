import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore, LANGUAGE_MAP } from './stores/AppStore';
import PageLayout from './components/PageLayout';



const Page3 = observer(() => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // 在组件加载后，滚动到英语选项的位置
    const scrollToEnglish = () => {
      const languageKeys = Object.keys(LANGUAGE_MAP);
      const englishIndex = languageKeys.indexOf('en');
      if (englishIndex !== -1 && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: englishIndex * 50, animated: true });
      }
    };

    // 使用 setTimeout 确保在布局完成后执行滚动
    setTimeout(scrollToEnglish, 100);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    console.log('handleLanguageSelect', langCode);
    setSelectedLanguage(langCode);
    appStore.setLanguage(LANGUAGE_MAP[langCode].name);
    // 设置 recordingLanguage
    const selectedRecordingLanguageCode = LANGUAGE_MAP[langCode].code;
    appStore.setRecordingLanguage(selectedRecordingLanguageCode);
  };

  const handleNextStep = () => {
    if (selectedLanguage) {
      appStore.nextStep();
    } else {
      alert('请选择一种语言');
    }
  };

  const renderFooter = () => (
    <TouchableOpacity style={styles.button} onPress={handleNextStep}>
      <Text style={styles.buttonText}>下一步</Text>
    </TouchableOpacity>
  );

  const handleLanguageChange = () => {
    const languageKeys = Object.keys(LANGUAGE_MAP);
    const currentIndex = languageKeys.indexOf(appStore.language);
    const englishIndex = languageKeys.indexOf('en');
    
    let nextIndex = (currentIndex + 1) % languageKeys.length;
    if (nextIndex === englishIndex) {
      nextIndex = (nextIndex + 1) % languageKeys.length;
    }
    
    const nextLanguage = languageKeys[nextIndex];
    appStore.setLanguage(nextLanguage);
  };

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.pageTitle}>设置面试语言</Text>
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
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
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
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  settingValue: {
    fontSize: 16,
  },
});

export default Page3;