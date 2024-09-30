import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Audio } from 'expo-av';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';
import * as FileSystem from 'expo-file-system';
import { Picker } from "@react-native-picker/picker";
import DropDownPicker from 'react-native-dropdown-picker';

const Page2 = observer(() => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasTestedMic, setHasTestedMic] = useState(false);
  const [hasRecordedFile, setHasRecordedFile] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isRecordingPrepared = useRef(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [open, setOpen] = useState(false);


  const languageOptions = [
    { label: "英语", value: "en-US" },
    { label: "中文", value: "zh-CN" },
    { label: "日语", value: "ja-JP" },
  ];

  const checkPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('未获得录音权限');
      return false;
    }
    return true;
  };

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

      console.log('开始录音...');
      await recording.startAsync();
      console.log('录音已开始');

      setIsRecording(true);
      setHasTestedMic(true);
      setHasRecordedFile(false);
    } catch (error) {
      console.error('录音错误:', error);
      Alert.alert('录音错误', '无法开始录音，请重试。');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    console.log('停止录音...');
    if (recordingRef.current && isRecordingPrepared.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        console.log('录音已停止');

        await checkFileSize();

        setRecording(recordingRef.current);
        setHasRecordedFile(true);
      } catch (error) {
        console.error('停止录音时出错：', error);
      }
      recordingRef.current = null;
      isRecordingPrepared.current = false;
    }
    setIsRecording(false);
  }, []);

  const checkFileSize = useCallback(async () => {
    if (recordingRef.current) {
      const uri = recordingRef.current.getURI();
      if (uri) {
        console.log('检查文件大小...');
        const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
        if (fileInfo.exists && 'size' in fileInfo) {
          console.log('文件大小:', fileInfo.size, '字节');
          setHasRecordedFile(fileInfo.size > 0);
        } else {
          console.warn('文件不存在或无法获取大小信息');
          setHasRecordedFile(false);
        }
      } else {
        console.warn('无法获取录音文件 URI');
        setHasRecordedFile(false);
      }
    } else {
      console.warn('没有可用的录音');
      setHasRecordedFile(false);
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

  const playRecording = async () => {
    if (recording) {
      try {
        const { sound } = await recording.createNewLoadedSoundAsync();
        setSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.error('播放录音时出错：', error);
        Alert.alert('播放错误', '无法播放录音，请重试。');
      }
    }
  };

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.pageTitle}>第 2 页：录音设备测试</Text>
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>选择录音语言：</Text>
        {/* <Picker
          selectedValue={appStore.recordingLanguage}
          onValueChange={(itemValue) => appStore.setRecordingLanguage(itemValue)}
          style={styles.picker}
        >
          {languageOptions.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker> */}
        <DropDownPicker
          open={open}
          value={appStore.recordingLanguage}
          items={languageOptions}
          setOpen={setOpen}
          setValue={(callback) => {
            if (typeof callback === 'function') {
              const value = callback(appStore.recordingLanguage);
              appStore.setRecordingLanguage(value);
            } else {
              appStore.setRecordingLanguage(callback);
            }
          }}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
        />
      </View>
      <View style={styles.testContainer}>
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
        {hasRecordedFile && (
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
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  // picker: {
  //   width: "100%",
  //   height: 50,
  // },
  pickerContainer: {
    marginBottom: 20,
  },
  dropdown: {
    marginBottom: 20,
  },
  dropdownContainer: {
    borderColor: '#ccc',
  },
});

export default Page2;