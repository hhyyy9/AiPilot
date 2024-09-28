import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Audio } from 'expo-av';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';

const Page2 = observer(() => {
  const [isRecording, setIsRecording] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const [hasTestedMic, setHasTestedMic] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isRecordingPrepared = useRef(false);

  useEffect(() => {
    (async () => {
      console.log('请求音频录制权限...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('音频录制权限状态:', status);
      if (status !== 'granted') {
        console.warn('未获得音频录制权限');
        Alert.alert('权限不足', '请允许应用访问麦克风以进行录音测试。');
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('开始录音流程...');
      await stopRecording();

      console.log('设置音频模式...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('音频模式设置完成');

      console.log('创建新的录音实例...');
      const recording = new Audio.Recording();
      recordingRef.current = recording;

      console.log('准备录音...');
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      isRecordingPrepared.current = true;
      console.log('录音准备完成');

      console.log('设置录音状态更新回调...');
      recording.setOnRecordingStatusUpdate(updateSoundLevel);
      console.log('开始录音...');
      await recording.startAsync();
      console.log('录音已开始');

      setIsRecording(true);
      setHasTestedMic(true);
    } catch (err) {
      console.error('录音失败：', err);
      Alert.alert('录音失败', '请检查麦克风权限并重试。');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    console.log('停止录音...');
    if (recordingRef.current && isRecordingPrepared.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('停止录音时出错：', error);
      }
      recordingRef.current = null;
      isRecordingPrepared.current = false;
    }
    setIsRecording(false);
    setSoundLevel(0);
    console.log('录音已停止，音量级别重置为0');
  }, []);

  const updateSoundLevel = useCallback((status: Audio.RecordingStatus) => {
    if (status.isRecording) {
      const metering = status.metering;
      console.log('当前音量级别:', metering !== undefined ? metering : 'undefined');
      setSoundLevel(metering !== undefined ? metering : 0);
    }
  }, []);

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
      <Text style={styles.title}>第 2 页：录音设备测试</Text>
      <View style={styles.waveformContainer}>
        <View style={[styles.waveform, { height: `${Math.max(soundLevel * 100, 1)}%` }]} />
      </View>
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPressIn={startRecording}
        onPressOut={stopRecording}
      >
        <Text style={styles.recordButtonText}>
          {isRecording ? '正在录音' : '按住测试麦克风'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.instruction}>
        {hasTestedMic ? '麦克风测试完成' : '请按住按钮进行麦克风测试'}
      </Text>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  waveformContainer: {
    height: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  waveform: {
    backgroundColor: '#4A90E2',
    width: '100%',
  },
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  recordingButton: {
    backgroundColor: '#FF4136',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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