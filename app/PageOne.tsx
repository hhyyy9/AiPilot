import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Input, Button, Modal, Text, ActivityIndicator } from '@ant-design/react-native';
import { appStore } from './stores/AppStore';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import PageLayout from './components/PageLayout';
import StepIndicator from './components/StepIndicator';
import { useNavigation } from '@react-navigation/native';
import Header from './components/Header';
import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const PageOne = observer(() => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [postionTitle, setPostionTitle] = useState('');
  const { t } = useTranslation();

  const pickDocument = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // 检查文件大小
        const fileInfo = await FileSystem.getInfoAsync(file.uri, { size: true });
        if ('size' in fileInfo && fileInfo.size > MAX_FILE_SIZE) {
          Modal.alert(t('errorTitle'), t('fileSizeLimit'));
          return;
        }

        // 创建一个 FormData 对象来上传文件
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name || 'document'
        } as any);

        const uploadResult = await appStore.uploadCV(formData);        
        // appStore.setResumeFile(uploadResult.data);
        console.log('完整的简历文件对象:', uploadResult);
      }
    } catch (error) {
      console.error('文件选择或上传错误:', error);
      Modal.alert(t('errorTitle'), t('errorSelectingOrUploadingFile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    appStore.setPosition(postionTitle);
    console.log('appStore.position:', appStore.position);
    console.log('appStore.resumeFile:', appStore.resumeFile);
    if (appStore.position && appStore.resumeFile) {
      appStore.setCurrentStep(2);
      navigation.navigate('PageTwo' as never);
    } else {
      Modal.alert(t('errorTitle'), t('errorFillPositionAndResume'));
    }
  };

  const handleMenuPress = () => {
    console.log('Menu button pressed1');
    navigation.navigate('Main' as never);
  };

  const renderFooter = () => (
    <Button
    type="primary"
    onPress={handleNextStep}
  >
    {t('nextStep')}
  </Button>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Header title={t('fillApplicationInfo')} menuType={1} onMenuPress={handleMenuPress} isShowBackButton={false} onBackPress={() => {}} />
      <StepIndicator />
      <View style={styles.container}>
        <Input
          placeholder={t('enterInterviewPosition')}
          value={postionTitle}
          onChangeText={(text) => setPostionTitle(text)}
          style={styles.input}
        />
        <Button onPress={pickDocument} style={styles.buttonContainer}>
          {appStore.resumeFile ? t('updateResume') : t('uploadResume')}
        </Button>
        <Text style={styles.note}>{t('resumeUploadNote')}</Text>
        {appStore.resumeFile && (
          <Text style={styles.fileName}>{t('resumeUploadSuccess')}</Text>
        )}
      </View>
      <Modal
          transparent
          visible={isLoading}
          animationType="fade"
          style={styles.modalContainer}
        >
            <View style={styles.modalContent}>
              <ActivityIndicator size="large"/>
              <Text style={styles.loadingText}>{t('uploading')}</Text>
            </View>
        </Modal>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    position: 'relative',    
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  menuButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    // alignItems: 'center',
    paddingTop: 40,
  },
  input: {
    width: '100%',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
    backgroundColor: '#94c5fc',
  },
  fileName: {
    marginTop: 20,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    paddingTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)', // 半透明背景
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5, // 用于 Android 的阴影
    shadowColor: '#000', // 以下四行用于 iOS 的阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default PageOne;
