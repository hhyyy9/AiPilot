import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from './stores/AppStore';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PageLayout from './components/PageLayout';
import StepIndicator from './components/StepIndicator'; // 确保导入 StepIndicator
// 定义 ResumeFile 类型
type ResumeFile = {
  uri: string;
  name: string;
  mimeType: string;
  savedName?: string;
} | null;

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
      }
    } catch (error) {
      console.error('加载简历文件信息失败:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/rtf'
        ],
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const currentDate = new Date();
        const dateSuffix = `_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}`;
        const savedName = `${file.name.split('.').slice(0, -1).join('.')}${dateSuffix}.${file.name.split('.').pop()}`;
        
        const newResumeFile = {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          savedName: savedName,
        };

        setResumeFile(newResumeFile);

        // 保存到本地存储
        await AsyncStorage.setItem('resumeFile', JSON.stringify(newResumeFile));
      }
    } catch (err) {
      console.error('文件选择错误:', err);
    }
  };

  const handleNextStep = () => {
    if (position && resumeFile) {
      appStore.setPosition(position);
      appStore.setResumeFile(resumeFile);
      appStore.nextStep();
    } else {
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
      <Text style={styles.title}>第 1 页：职位信息</Text>
      <TextInput
        style={styles.input}
        placeholder="请输入面试职位"
        value={position}
        onChangeText={setPosition}
      />
      <TouchableOpacity style={styles.button} onPress={pickDocument}>
        <Text style={styles.buttonText}>
          {resumeFile ? '更新简历' : '上传简历 (支持 PDF, Word, TXT)'}
        </Text>
      </TouchableOpacity>
      {resumeFile && (
        <Text style={styles.fileName}>已选择文件: {resumeFile.savedName || resumeFile.name}</Text>
      )}
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
});

export default Page1;