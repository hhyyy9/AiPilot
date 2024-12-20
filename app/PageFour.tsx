import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
  Platform,
} from "react-native";
import { observer } from "mobx-react-lite";
import { Button, Modal, ActivityIndicator } from '@ant-design/react-native';
import { appStore } from "./stores/AppStore";
import PageLayout from "./components/PageLayout";
import Header from "./components/Header";
import StepIndicator from "./components/StepIndicator";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  isRecognitionAvailable,
  supportsOnDeviceRecognition,
  supportsRecording
} from "expo-speech-recognition";
import Tts from 'react-native-tts';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { use } from "i18next";


const TTS_TYPE:Number = 0; //0=buildin, 1=openai

const PageFour = observer(() => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [interviewContent, setInterviewContent] = useState<string[]>([]);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const isInterviewingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const interviewIdRef = useRef<string>("");

  const isPausuedRef = useRef(false);

  useKeepAwake();

  const [transcription, setTranscription] = useState({
    transcriptTally: "",
    transcript: "",
  });

  // 在组件外部或使用 useRef 来存储最新的 utteranceId
  const latestUtteranceId = useRef<string | number>("");
  const lastProcessedUtteranceId = useRef<string | number>("");

  const updateIsInterviewing = useCallback((value: boolean) => {
    setIsInterviewing(value);
    isInterviewingRef.current = value;
    console.log(`isInterviewing 更新为: ${value}`);
  }, []);

  // const available1 = isRecognitionAvailable();
  // console.log("Speech recognition available:", available1);

  // const available2 = supportsOnDeviceRecognition();
  // console.log("OnDevice recognition available:", available2);

  // const available3 = supportsRecording();
  // console.log("Recording available:", available3);

  useSpeechRecognitionEvent("start", () => {
    console.log("Speech recognition started:", isInterviewingRef.current, ":" ,new Date().toISOString());
  });

  useSpeechRecognitionEvent("end", (event) => {
    console.log("Speech recognition ended", event, isInterviewingRef.current);
  });

  useSpeechRecognitionEvent("result", (event) => {
    // console.log("onSpeechResults: ", event, isInterviewingRef.current);
    if (!isInterviewingRef.current) return;

    const transcriptResult = event.results[0]?.transcript || "";
    setTranscription((prev) => ({
      transcriptTally: prev.transcriptTally + " " + transcriptResult,
      transcript: transcriptResult,
    }));

    if (event.isFinal) {
      console.log('最终识别结果: ', transcriptResult, ":" , new Date().toISOString());
      handleSpeechEnd(transcriptResult);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech recognition error:", event.error, event.message);
    if (event.error === 'no-speech' && isInterviewingRef.current) {
      console.log("No speech detected, restarting recognition...");
    }
    handleStart();
  });

  Tts.addEventListener("tts-start", event => {
    // console.log("tts-start", event)
    if (isInterviewingRef.current) {
      latestUtteranceId.current = event.utteranceId;
    }
  });

  Tts.addEventListener('tts-progress', (event) => {
    // console.log("progress", event)
  });

  Tts.addEventListener("tts-finish", event => {
    // console.log("tts-finish", event)
    if (event.utteranceId !== latestUtteranceId.current) {
      // console.log("忽略旧的 TTS 完成事件");
      return;
    }else{
      latestUtteranceId.current = event.utteranceId;
    }

    if (event.utteranceId !== lastProcessedUtteranceId.current)
    {
      console.log('音频播放完成，准备开始新的录音',isInterviewingRef.current);
      if (isInterviewingRef.current) {
        handleStart();
      }
      lastProcessedUtteranceId.current = event.utteranceId;
    }
  });

  Tts.addEventListener("tts-cancel", event => {
    console.log("tts-cancel", event)
  });

  const initTts = async () => {
    const voices = await Tts.voices();
    if (voices && voices.length > 0) {
      try {
        await Tts.setDefaultLanguage(appStore.recordingLanguage);
        await Tts.setIgnoreSilentSwitch("ignore");    // 忽略静音开关
        await Tts.setDucking(false);                  // 不降低其他应用的音量
        await Tts.setDefaultRate(0.5);
      } catch (err) {
        Modal.alert(t('errorTitle'), t('errorMessage'));
        console.log(`setDefaultLanguage error `, err);
      }
    }
  };

  const playTts = async (text: string) => {
    Tts.stop();
    Tts.speak(text);
  };

  const handleSpeechEnd = async (finalTranscription: string) => {
    console.log('开始处理文字转语音', finalTranscription);
    if (finalTranscription) {
      // 生成AI回答
      console.log('生成AI回答');
      const answer = await generateResponse(finalTranscription);
      if (answer) {
        console.log("AI回答:", answer);
        addNewQAPair(finalTranscription, answer, 1);

        // 将回答转换为语音
        // if (TTS_TYPE === 1){
        //   console.log('将回答转换为语音');
        //   const response = await openai.audio.speech.create({
        //     model: "tts-1",
        //     voice: appStore.language === "en" ? "nova" : "alloy",
        //     input: answer,
        //   });
        //   const audioData = await response.arrayBuffer();
        //   await playAudio(audioData);
        // }else{
          await playTts(answer);
        // }

      } else {
        console.error("无法生成回答");
        if (isInterviewingRef.current) {
          // isRecognizingRef.current = true;
          await handleStart();
        }
      }
    }
    setTranscription({ transcriptTally: "", transcript: "" });
  };

  /**
  const playAudio = async (audioData: ArrayBuffer) => {
    console.log('开始播放音频');
    try {
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({
        uri: `data:audio/mp3;base64,${arrayBufferToBase64(audioData)}`,
      });
      await soundObject.playAsync();

      // 等待音频播放完成
      await new Promise((resolve) => {
        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve(null);
          }
        });
      });

      console.log("音频播放完成",isInterviewingRef.current);

      // 音频播放完成后，如果面试仍在进行，则开始新的录音
      if (isInterviewingRef.current) {
        console.log("准备开始下一次语音识别");
        await handleStart();
      }else{
        return;
      }
    } catch (error) {
      console.error("播放音频误:", error);
      Alert.alert("错误", "播放音频时出现错误，请重试。");
      if (isInterviewingRef.current) {
        console.log("播放出错，但仍准备开始新的语音识别");
        await handleStart();
      }
    }
  }; 

  const loadResumeContent = async () => {
    try {
      const resumeFile = appStore.resumeFile;
      let filePath = "";

      if (typeof resumeFile === "string") {
        filePath = resumeFile;
      } else if (
        resumeFile &&
        typeof resumeFile === "object" &&
        "uri" in resumeFile
      ) {
        filePath = resumeFile.uri;
      } else {
        throw new Error("无效的简历文件格式");
      }

      // 使用 await 等待文件内容读取完成
      const content = await FileSystem.readAsStringAsync(filePath);
      console.log("简历内容加载成功");
      return content; // 返回读取的内容
    } catch (error) {
      console.error("处理简历文件时出错:", error);
      Modal.alert("错误", "无法处理简历文件");
      return null; // 出错时返回 null
    }
  };*/

  useEffect(() => {
    // 每当 interviewContent 更新时，滚动到底部
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [interviewContent]);

  const handleStart = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        console.warn("Permissions not granted", result);
        return;
      }
      updateIsInterviewing(true);

      ExpoSpeechRecognitionModule.start({
        lang: appStore.recordingLanguage,
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        recordingOptions: {
          persist: true,
        },
        androidIntentOptions: { EXTRA_LANGUAGE_MODEL: "web_search" }
      });
      console.log("语音识别已启动", isInterviewingRef.current);
    } catch (error) {
      console.error("启动语音识别时出错:", error);
    }
  };

  const handleStop = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      updateIsInterviewing(false);
      console.log("语音识别已停止");
    } catch (error) {
      console.error("停止语音识别时出错:", error);
    }
  };

  const generateResponse = async (prompt: string) => {
  
    try {
      // console.log('generateResponse:', generateResponse);
      // console.log('interviewId:', interviewIdRef.current);
      // console.log('prompt:', prompt);
      // 调用aiTrigger获取AI回答
      const aiResponse = await appStore.aiTrigger(
        interviewIdRef.current,
        prompt,
      );
      console.log('aiResponse:', aiResponse);
      if (!aiResponse.success && aiResponse.code === "E2003"){
        Modal.alert(t('errorTitle'), t('insufficientCredits'));
        return null;
      }
      if (!aiResponse.success) {
        Modal.alert(t('errorTitle'), aiResponse.error);
        return null;
      }

      return aiResponse.data.response;
    } catch (error) {
      console.error("Error generating response:", error);
      return null;
    }
  };

  /**
  // 辅助函数：将 ArrayBuffer 转换为 Base64 字符串
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };**/

  const handleStartButtonPress = async () => {
    console.log("按钮被点击，当前状态:", isInterviewingRef.current);
    try {
      if (isInterviewingRef.current) {
        console.log("尝试结束面试");
        // 通知服务器结束面试
        const response = await appStore.endInterview();
        if (!response.success) {
          Modal.alert(t('errorTitle'), response.error);
          return;
        }
        /////

        await handleStop();
        appStore.resetState();
        appStore.setCurrentStep(1);
        navigation.navigate('Main' as never);
      } else {
        console.log("尝试开始面试");
        updateIsInterviewing(true);
        
        // 通知服务器开始面试
        const startInterviewResponse = await appStore.startInterview();
        console.log('appStore.currentInterview:', startInterviewResponse);
        if (!startInterviewResponse.success) {
          Modal.alert(t('errorTitle'), startInterviewResponse.error);
          return;
        }
        interviewIdRef.current = startInterviewResponse.data.interviewId;
        /////
        appStore.setIsFinished(false);
        initTts();
        await handleStart();
        await addNewQAPair(t('startInterviewText'), "", 0);
      }
    } catch (error) {
      console.error("处理按钮点击时出错:", error);
      await handleStop();
      Modal.alert(t('errorTitle'), t('errorHandlingInterviewState'));
    }
  };

  // 这个函数将在每次生成新的问答对时被调用
  const addNewQAPair = async (question: string, answer: string, state: number) => {
    if (state === 0) {
      setInterviewContent(prev => [
        ...prev,
        `${question}`
      ]);
    } else {
      setInterviewContent(prev => [
        ...prev,
        `Q：${question}`,
        `A：${answer}`
      ]);
    }
  };

  const handleMenuPress = () => {
    console.log('Menu button pressed');
    navigation.navigate('Main' as never);
  };

  const handleBackPress = () => {
    appStore.setCurrentStep(3);
    navigation.goBack();
  };

  const handlePauseButtonPress = () => {
    isPausuedRef.current = !isPausuedRef.current;
    if (isPausuedRef.current) {
      handleStop();
    } else {
      handleStart();
    }
  };

  const renderFooter = () => (
    <>
      <View style={styles.buttonContainer}>
        {/* <Button 
          type="ghost" 
          onPress={handlePauseButtonPress} 
          style={styles.pauseButton}
        >
          {isPausuedRef.current ? t('resumeInterview') : t('pauseInterview')}
        </Button> */}
        <Button
          type="primary"
          onPress={handleStartButtonPress}
          style={[styles.button, isInterviewing && styles.activeButton]}
        >
          {isInterviewing ? t('endInterview') : t('startInterview')}
        </Button>
      </View>
    </>
  );

  const { t } = useTranslation();

  // 添加音频会话配置
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,        // 允许在静音模式下播放
          staysActiveInBackground: true,      // 保持后台活动
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: false,           // 其他应用播放声音时不降低音量
          playThroughEarpieceAndroid: false   // 使用扬声器而不是听筒
        });
      } catch (error) {
        console.error('配置音频模式失败:', error);
      }
    };

    configureAudio();
  }, []);

  return (
    <PageLayout footer={renderFooter()}>
      <Header title={t('startInterviewAssistant')} menuType={1} onMenuPress={handleMenuPress} isShowBackButton={true} onBackPress={handleBackPress} />
      <StepIndicator />
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {interviewContent.length === 0 ? (
            <Text style={styles.defaultText}>
              {t('interviewPreparation')}
            </Text>
          ) : (
            interviewContent.map((content, index) => (
              <Text key={index} style={styles.dialogueText}>{content}</Text>
            ))
          )}
        </ScrollView>
      </View>
      <Modal
        transparent
        visible={isLoading}
        animationType="fade"
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <ActivityIndicator size="large"/>
          <Text style={styles.loadingText}>{t('processingText')}</Text>
        </View>
      </Modal>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    padding: 10,
  },
  dialogueText: {
    fontSize: 16,
    marginBottom: 10,
  },
  defaultText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: '#FF4136',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  pauseButton: {
    flex: 1,
    marginRight: 10, // 添加右边距以保持间隔
  },
});

export default PageFour;
