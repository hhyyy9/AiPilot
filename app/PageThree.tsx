import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';

const LANGUAGE_MAP = {
  'en': 'English', 'zh': '中文', 'es': 'Español', 'ja': '日本語',
  'fr': 'Français', 'de': 'Deutsch', 'pt': 'Português', 'ru': 'Русский',
  'ar': 'العربية', 'hi': 'हिन्दी', 'ko': '한국어',
  'af': 'Afrikaans', 'az': 'Azərbaycan', 'be': 'Беларуская', 'bg': 'Български',
  'bs': 'Bosanski', 'ca': 'Català', 'cs': 'Čeština', 'cy': 'Cymraeg',
  'da': 'Dansk', 'el': 'Ελληνικά', 'et': 'Eesti', 'fa': 'فارسی',
  'fi': 'Suomi', 'gl': 'Galego', 'he': 'עברית', 'hr': 'Hrvatski',
  'hu': 'Magyar', 'hy': 'Հայերեն', 'id': 'Bahasa Indonesia', 'is': 'Íslenska',
  'it': 'Italiano', 'kk': 'Қазақ', 'kn': 'ಕನ್ನಡ', 'lt': 'Lietuvių',
  'lv': 'Latviešu', 'mi': 'Māori', 'mk': 'Македонски', 'mr': 'मराठी',
  'ms': 'Bahasa Melayu', 'ne': 'नेपाली', 'nl': 'Nederlands', 'no': 'Norsk',
  'pl': 'Polski', 'ro': 'Română', 'sk': 'Slovenčina', 'sl': 'Slovenščina',
  'sr': 'Српски', 'sv': 'Svenska', 'sw': 'Kiswahili', 'ta': 'தமிழ்',
  'th': 'ไทย', 'tl': 'Tagalog', 'tr': 'Türkçe', 'uk': 'Українська',
  'ur': 'اردو', 'vi': 'Tiếng Việt'
};

const Page3 = observer(() => {
  const [selectedLanguage, setSelectedLanguage] = useState(appStore.language || 'en');
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
    setSelectedLanguage(langCode);
    appStore.setLanguage(langCode);
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

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.pageTitle}>第 3 页：播放语言设置</Text>
      <ScrollView ref={scrollViewRef} style={styles.languageContainer}>
        {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
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
              {name} ({code})
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
});

export default Page3;