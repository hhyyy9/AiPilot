import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Button, Modal, Text, ActivityIndicator } from '@ant-design/react-native';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';
import StepIndicator from './components/StepIndicator';
import { startRecording, stopRecording, playAudioFromPath, deleteAudioFile } from './utils/AudioHelper';
import Header from './components/Header';
import { useNavigation } from '@react-navigation/native';

const PageTwo = observer(() => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasTestedMic, setHasTestedMic] = useState(false);
  const [recordedFilePath, setRecordedFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleRecording = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        await stopRecording();
        setHasTestedMic(true);
      } catch (error) {
        console.error('停止录音错误:', error);
        Modal.alert('录音错误', '无法停止录音，请重试。');
      }
    } else {
      setIsRecording(true);
      try {
        const filePath = await startRecording();
        setRecordedFilePath(filePath);
      } catch (error) {
        console.error('开始录音错误:', error);
        Modal.alert('录音错误', '无法开始录音，请重试。');
        setIsRecording(false);
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(async () => {
    if (recordedFilePath) {
      setIsLoading(true);
      try {
        await playAudioFromPath(recordedFilePath);
        if (__DEV__) {
          console.log('当前为开发环境，播放录音后不删除文件');
        } else {
          console.log('当前为生产环境，播放录音后将删除文件');
          await deleteAudioFile(recordedFilePath);
        }
      } catch (error) {
        console.error('播放录音时出错：', error);
        Modal.alert('播放错误', '无法播放录音，请重试。');
      } finally {
        setIsLoading(false);
      }
    } else {
      Modal.alert('提示', '没有可用的录音');
    }
  }, [recordedFilePath]);

  const handleNextStep = useCallback(() => {
    if (hasTestedMic) {
      console.log('麦克风测试完成，进入下一步');
      appStore.nextStep();
      navigation.navigate('PageThree' as never);
    } else {
      console.warn('尝试进入下一步，但麦克风未测试');
      Modal.alert('提示', '请先测试录音设备');
    }
  }, [hasTestedMic]);

  const handleMenuPress = () => {
    console.log('Menu button pressed2');
  };

  const handleBackPress = () => {
    console.log('Back button pressed');
    appStore.setCurrentStep(1);
    navigation.goBack();
  };

  const renderFooter = () => (
    <Button type="primary" onPress={handleNextStep}>
      下一步
    </Button>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Header title="录音设备测试" onMenuPress={handleMenuPress} isShowBackButton={true} onBackPress={handleBackPress} />
      <StepIndicator />
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleRecording}
          style={[
            styles.circleButton,
            isRecording ? styles.recordingButton : styles.notRecordingButton
          ]}
        >
          <Text style={styles.buttonText}>
            {isRecording ? '停止录音' : '开始录音'}
          </Text>
        </TouchableOpacity>
        {recordedFilePath && !isRecording && (
          <Button onPress={playRecording} style={styles.buttonContainer}>
            播放录音
          </Button>
        )}
      </View>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
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
    alignItems: 'center',
    paddingTop: 40,
  },
  circleButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notRecordingButton: {
    backgroundColor: '#94c5fc',
  },
  recordingButton: {
    backgroundColor: '#FF4136',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    width: '30%',
    marginTop: 40,
    backgroundColor: '#94c5fc',
  },
});

export default PageTwo;
