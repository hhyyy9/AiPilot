import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from './stores/AppStore';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PageLayout from './components/PageLayout';
import StepIndicator from './components/StepIndicator'; // 确保导入 StepIndicator
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Alert } from 'react-native'; // Added import for Alert
// 定义 ResumeFile 类型
type ResumeFile = {
  uri: string;
  name: string;
  mimeType: string;
  savedName?: string;
} | null;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const Page1 = observer(() => {
  const [position, setPosition] = useState('');
  const [resumeFile, setResumeFile] = useState<ResumeFile>(null);
  const router = useRouter();

  useEffect(() => {
    // 组件加载时从本地存储加载简历文件信息
    loadResumeFile();
  }, []);

  const loadResumeFile = async () => {
    try {
      const savedResumeFile = await AsyncStorage.getItem('resumeFile');
      if (savedResumeFile) {
        setResumeFile(JSON.parse(savedResumeFile));
      }else{
        setResumeFile(null);
      }
    } catch (error) {
      console.error('加载简历文件信息失败:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // 检查文件大小
        const fileInfo = await FileSystem.getInfoAsync(file.uri, { size: true });
        if ('size' in fileInfo && fileInfo.size > MAX_FILE_SIZE) {
          Alert.alert("文件过大", "请选择小于 ${MAX_FILE_SIZE / (1024 * 1024)}MB 的文件。");
          return;
        }

        const currentDate = new Date();
        const dateSuffix = `_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}`;
        const savedName = `${file.name.split('.').slice(0, -1).join('.')}${dateSuffix}.txt`;
        
        let newUri;
        if (Platform.OS === 'web') {
          newUri = file.uri; // Web 平台直接使用原始 URI
        } else {
          newUri = FileSystem.documentDirectory + savedName;
          await FileSystem.copyAsync({
            from: file.uri,
            to: newUri
          });
        }

        const newResumeFile = {
          uri: newUri,
          name: file.name,
          mimeType: 'text/plain',
          savedName: savedName,
        };

        setResumeFile(newResumeFile);
        await AsyncStorage.setItem('resumeFile', JSON.stringify(newResumeFile));
        appStore.setResumeFile(newResumeFile);

        console.log('存储的简历文件路径:', newUri);
        console.log('完整的简历文件对象:', newResumeFile);
      }
    } catch (error) {
      console.error('文件选择错误:', error);
      Alert.alert("错误", "选择文件时发生错误。");
    }
  };

  const handleNextStep = () => {
    console.log('handleNextStep called');
    console.log('Current position:', position);
    console.log('Current resumeFile:', resumeFile);

    if (position && resumeFile) {
      console.log('Conditions met, proceeding to next step');
      appStore.setPosition(position);
      appStore.setResumeFile(resumeFile);
      appStore.nextStep();
      console.log('Current step after nextStep:', appStore.currentStep);
      
    } else {
      console.log('Conditions not met');
      alert('请填写职位并上传简历');
    }
  };

  const renderFooter = () => (
    <TouchableOpacity style={styles.button} onPress={handleNextStep}>
      <Text style={styles.buttonText}>下一步</Text>
    </TouchableOpacity>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.title}>填写应聘的职位信息</Text>
      <TextInput
        style={styles.input}
        placeholder="请输入面试职位"
        value={position}
        onChangeText={setPosition}
      />
      <TouchableOpacity style={styles.button} onPress={pickDocument}>
        <Text style={styles.buttonText}>
          {resumeFile ? '更新简历' : '上传简历 (仅支持 TXT 文件)'}
        </Text>
      </TouchableOpacity>
      {resumeFile && (
        <Text style={styles.fileName}>已选择文件: {resumeFile.savedName || resumeFile.name}</Text>
      )}
      <Text style={styles.note}>注意：只支持上传 TXT 文本文件</Text>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F0F0',
  },
  stepIndicator: {
    marginBottom: 20,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fileName: {
    marginTop: 10,
    fontSize: 16,
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
});

export default Page1;