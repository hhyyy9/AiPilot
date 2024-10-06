import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';
import { startRecording, stopRecording, playAudioFromPath, deleteAudioFile } from './utils/AudioHelper';

const Page2 = observer(() => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasTestedMic, setHasTestedMic] = useState(false);
  const [recordedFilePath, setRecordedFilePath] = useState<string | null>(null);

  const handleRecording = useCallback(async () => {
    if (isRecording) {
      // 停止录音
      setIsRecording(false);
      try {
        await stopRecording();
        setHasTestedMic(true);
      } catch (error) {
        console.error('停止录音错误:', error);
        Alert.alert('录音错误', '无法停止录音，请重试。');
      }
    } else {
      // 开始录音
      setIsRecording(true);
      try {
        const filePath = await startRecording();
        setRecordedFilePath(filePath);
      } catch (error) {
        console.error('开始录音错误:', error);
        Alert.alert('录音错误', '无法开始录音，请重试。');
        setIsRecording(false);
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(async () => {
    if (recordedFilePath) {
      try {
        await playAudioFromPath(recordedFilePath);
        await deleteAudioFile(recordedFilePath);
      } catch (error) {
        console.error('播放录音时出错：', error);
        Alert.alert('播放错误', '无法播放录音，请重试。');
      }
    } else {
      Alert.alert('提示', '没有可用的录音');
    }
  }, [recordedFilePath]);

  const handleNextStep = useCallback(() => {
    if (hasTestedMic) {
      console.log('麦克风测试完成，进入下一步');
      appStore.nextStep();
    } else {
      console.warn('尝试进入下一步，但麦克风未测试');
      Alert.alert('提示', '请先测试录音设备');
    }
  }, [hasTestedMic]);

  const renderFooter = () => (
    <TouchableOpacity style={styles.button} onPress={handleNextStep}>
      <Text style={styles.buttonText}>下一步</Text>
    </TouchableOpacity>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.pageTitle}>录音设备测试</Text>
      <View style={styles.testContainer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPress={handleRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? '停止录音' : '开始录音'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.instruction}>
          {isRecording ? '正在录音...' : hasTestedMic ? '麦克风测试完成' : '点击按钮开始录音'}
        </Text>
        {recordedFilePath && !isRecording && (
          <TouchableOpacity style={styles.playButton} onPress={playRecording}>
            <Text style={styles.playButtonText}>播放录音</Text>
          </TouchableOpacity>
        )}
      </View>
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
  testContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingButton: {
    backgroundColor: '#FF4136',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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

export default Page2;