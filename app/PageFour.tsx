import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import OpenAI from 'openai';
import { useRouter, useNavigation } from 'expo-router';

const OPENAI_API_KEY = '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';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const SILENCE_THRESHOLD = -40; // 静音阈值，可以根据需要调整
const SILENCE_DURATION = 2; // 静音持续时间（秒）
const CHECK_INTERVAL = 100; // 检查间隔（毫秒）

let hasSpeech = false;

const LANGUAGE_MAP: { [key: string]: string } = {
  'af': 'Afrikaans', 'ar': 'العربية', 'hy': 'Հայերեն', 'az': 'Azərbaycan',
  'be': 'Беларуская', 'bs': 'Bosanski', 'bg': 'Български', 'ca': 'Català',
  'zh': '中文', 'hr': 'Hrvatski', 'cs': 'Čeština', 'da': 'Dansk',
  'nl': 'Nederlands', 'en': 'English', 'et': 'Eesti', 'fi': 'Suomi',
  'fr': 'Français', 'gl': 'Galego', 'de': 'Deutsch', 'el': 'Ελληνικά',
  'he': 'עברית', 'hi': 'हिन्दी', 'hu': 'Magyar', 'is': 'Íslenska',
  'id': 'Bahasa Indonesia', 'it': 'Italiano', 'ja': '日本語', 'kn': 'ಕನ್ನಡ',
  'kk': 'Қазақ', 'ko': '한국어', 'lv': 'Latviešu', 'lt': 'Lietuvių',
  'mk': 'Македонски', 'ms': 'Bahasa Melayu', 'mr': 'मराठी', 'mi': 'Māori',
  'ne': 'नेपाली', 'no': 'Norsk', 'fa': 'فارسی', 'pl': 'Polski',
  'pt': 'Português', 'ro': 'Română', 'ru': 'Русский', 'sr': 'Српски',
  'sk': 'Slovenčina', 'sl': 'Slovenščina', 'es': 'Español', 'sw': 'Kiswahili',
  'sv': 'Svenska', 'tl': 'Tagalog', 'ta': 'தமிழ்', 'th': 'ไทย',
  'tr': 'Türkçe', 'uk': 'Українська', 'ur': 'اردو', 'vi': 'Tiếng Việt',
  'cy': 'Cymraeg'
};

let isRecording = false;
let recordingObj: Audio.Recording | null = null;

const Page4 = observer(() => {
  const [resumeContent, setResumeContent] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const isAssistantActiveRef = useRef(false);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    loadResumeContent();
    return () => {
      if (isRecording && recordingObj) {
        recordingObj.stopAndUnloadAsync();
      }
    };
  }, []);

  const loadResumeContent = () => {
    try {
      const resumeFile = appStore.resumeFile;
      let filePath = '';

      if (typeof resumeFile === 'string') {
        filePath = resumeFile;
      } else if (resumeFile && typeof resumeFile === 'object' && 'uri' in resumeFile) {
        filePath = resumeFile.uri;
      } else {
        throw new Error('Invalid resume file format');
      }

      console.log('Resume file path:', filePath);

      // 异步读取文件内容
      FileSystem.readAsStringAsync(filePath)
        .then(content => {
          setResumeContent(content);
          console.log('Resume content loaded successfully');
        })
        .catch(error => {
          console.error('Error reading resume file:', error);
          Alert.alert('错误', '无法读取简历文件');
        });
    } catch (error) {
      console.error('Error processing resume file:', error);
      Alert.alert('错误', '无法处理简历文件');
    }
  };

  const generateResponse = async (prompt: string) => {
    const language = LANGUAGE_MAP[appStore.language] || 'English';
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: `You are a job candidate in an interview. Answer questions in ${language} based on the provided resume. Your responses should be concise, highlighting only the most relevant points. Be professional and specific, focusing on key achievements and skills.`
          },
          {
            role: "user", 
            content: `Resume content:\n\n${resumeContent}\n\nRemember this information for your responses.`
          },
          {
            role: "assistant", 
            content: "Understood. I'm ready to provide concise, relevant answers based on the resume."
          },
          {
            role: "user", 
            content: `Interviewer's question: ${prompt}\nProvide a brief, focused answer highlighting key points.`
          }
        ],
        max_tokens: 300
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  };

  const startAssistant = () => {
    isAssistantActiveRef.current = true;
    console.log('开始面试', isAssistantActiveRef.current);
    startRecording();
  };

  const endAssistant = () => {
    isAssistantActiveRef.current = false;
    console.log("结束面试", isAssistantActiveRef.current);
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
      console.log('录音已停止');
    }
    
    appStore.resetState();
    router.replace('/');
  };

  const startRecording = async () => {
    if (isRecording) {
      console.log('已经在录音中，请等待当前录音结束');
      return;
    }

    try {
      isRecording = true;
      console.log('准备录音...');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('开始录音...');
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingObj = recording;
      setRecording(recording);
      console.log('新的录音已开始');
      monitorVolume(recording);
    } catch (err) {
      console.error('开始新录音失败:', err);
      Alert.alert('录音失败', '请检查麦克风权限并重试。');
      if (isAssistantActiveRef.current) {
        console.log('录音失败，1秒后重试');
        setTimeout(startRecording, 1000);
      }
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !recordingObj) {
      console.log('没有正在进行的录音或录音对象为空');
      return;
    }

    try {
      console.log('停止录音...');
      await recordingObj.stopAndUnloadAsync();
      const uri = recordingObj.getURI();
      console.log('录音已停止，URI:', uri);
      if (uri) {
        processAudio(uri);
      } else {
        console.error('无法获取录音 URI');
      }
    } catch (err) {
      console.error('停止录音失败:', err);
    } finally {
      isRecording = false;
      recordingObj = null;
    }
  };

  const monitorVolume = (recordingObj: Audio.Recording) => {
    let silentChunks = 0;
    let hasSpeech = false;
    
    const checkVolume = () => {
      if (!isAssistantActiveRef.current) return;

      recordingObj.getStatusAsync().then(status => {
        if (!status.isRecording) return;

        const { metering } = status;
        console.log(`当前音量: ${metering}dB, 静音阈值: ${SILENCE_THRESHOLD}dB, 静音持续: ${silentChunks * (CHECK_INTERVAL / 1000)}秒`);

        if (metering && metering > SILENCE_THRESHOLD) {
          silentChunks = 0;
          hasSpeech = true;
        } else {
          silentChunks++;
        }

        if (hasSpeech && silentChunks > SILENCE_DURATION * (1000 / CHECK_INTERVAL)) {
          console.log(`静音持续: ${silentChunks * (CHECK_INTERVAL / 1000)}秒`);
          stopRecording();
        } else {
          setTimeout(checkVolume, CHECK_INTERVAL);
        }
      });
    };

    checkVolume();
  };

  const processAudio = async (uri: string) => {
    try {
      console.log('开始处理音频文件:', uri);

      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('文件信息:', fileInfo);

      if (!fileInfo.exists) {
        console.error('音频文件不存在');
        throw new Error('音频文件不存在');
      }

      // 获取文件扩展名
      const fileExtension = uri.split('.').pop();
      const mimeType = `audio/${fileExtension}`;

      console.log('文件扩展名:', fileExtension);
      console.log('MIME类型:', mimeType);

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: mimeType,
        name: `audio.${fileExtension}`
      } as any);
      formData.append('model', 'whisper-1');
      console.log('FormData创建完成');

      console.log('开始发送请求到OpenAI API');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      console.log('API响应状态:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API误响应:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const transcription = await response.json();
      console.log('转录结果:', transcription);
      const text = transcription.text;

      // 生成回答
      const answer = await generateResponse(text);
      if (answer) {
        console.log('AI回答:', answer);

        // 将回答转换为语音
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: appStore.language === 'en' ? 'nova' : 'alloy',
          input: answer,
        });

        const audioData = await response.arrayBuffer();
        await playAudio(audioData);
      } else {
        console.error('无法生成回答');
        Alert.alert('错误', '无法生成回答，请重试。');
      }

    } catch (error) {
      console.error('处理音频时出错:', error);
    }
    // 不在这里开始新的录音，因为已经在 monitorVolume 中处理了
  };

  const playAudio = async (audioData: ArrayBuffer) => {
    try {
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: `data:audio/mp3;base64,${arrayBufferToBase64(audioData)}` });
      await soundObject.playAsync();
      
      // 等待音频播放完成
      await new Promise((resolve) => {
        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve(null);
          }
        });
      });

      console.log('音频播放完成');

      // 音频播放完成后，如果面试仍在进行，则开始新的录音
      if (isAssistantActiveRef.current) {
        console.log('准备开始新的录音');
        await startRecording();
      }

    } catch (error) {
      console.error('播放音频错误:', error);
      Alert.alert('错误', '播放音频时出现错误，请重试。');
      // 即使出错，如果面试仍在进行，也尝试开始新的录音
      if (isAssistantActiveRef.current) {
        console.log('播放出错，但仍准备开始新的录音');
        await startRecording();
      }
    }
  };

  // 辅助函数：将 ArrayBuffer 转换为 Base64 字符串
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>AI 面试助手</Text>
    </View>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.pageTitle}>第 4 页：AI 面试助手</Text>
      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={[styles.button, isAssistantActiveRef.current && styles.activeButton]}
          onPress={isAssistantActiveRef.current ? endAssistant : startAssistant}
        >
          <Text style={styles.buttonText}>
            {isAssistantActiveRef.current ? '结束面试' : '开始面试'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.instruction}>
          {isAssistantActiveRef.current
            ? '正在进行面试...'
            : '点击按钮开始面试，说出你的问题'}
        </Text>
      </View>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  activeButton: {
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
  },
  footer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#333',
  },
});

export default Page4;