import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { observer } from "mobx-react-lite";
import { appStore } from "./stores/AppStore";
import PageLayout from "./components/PageLayout";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import OpenAI from 'openai';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  isRecognitionAvailable,
  supportsOnDeviceRecognition,
  supportsRecording
} from "expo-speech-recognition";
import Tts from 'react-native-tts';


const OPENAI_API_KEY =
  "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";

const TTS_TYPE:Number = 0; //0=buildin, 1=openai


const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const Page4 = observer(() => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [interviewContent, setInterviewContent] = useState<string[]>([]);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const isInterviewingRef = useRef(false);

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

  const available1 = isRecognitionAvailable();
  console.log("Speech recognition available:", available1);

  const available2 = supportsOnDeviceRecognition();
  console.log("OnDevice recognition available:", available2);

  const available3 = supportsRecording();
  console.log("Recording available:", available3);

  useSpeechRecognitionEvent("start", () => {
    console.log("Speech recognition started", isInterviewingRef.current);
  });

  useSpeechRecognitionEvent("end", (event) => {
    console.log("Speech recognition ended", event, isInterviewingRef.current);
  });

  useSpeechRecognitionEvent("result", (event) => {
    console.log("onSpeechResults: ", event, isInterviewingRef.current);
    if (!isInterviewingRef.current) return;

    const transcriptResult = event.results[0]?.transcript || "";
    setTranscription((prev) => ({
      transcriptTally: prev.transcriptTally + " " + transcriptResult,
      transcript: transcriptResult,
    }));

    if (event.isFinal) {
      console.log('最终识别结果: ', transcriptResult);
      handleSpeechEnd(transcriptResult);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech recognition error:", event.error, event.message);
    Alert.alert("错误", "语音识别错误，请重试。");
    if (event.error === 'no-speech' && isInterviewingRef.current) {
      console.log("No speech detected, restarting recognition...");
      // handleStart();
    }
  });

  Tts.addEventListener("tts-start", event => {
    console.log("tts-start", event)
    if (isInterviewingRef.current) {
      latestUtteranceId.current = event.utteranceId;
    }
  });

  Tts.addEventListener('tts-progress', (event) => {
    // console.log("progress", event)
  });


  Tts.addEventListener("tts-finish", event => {
    console.log("tts-finish", event)
    if (event.utteranceId !== latestUtteranceId.current) {
      console.log("忽略旧的 TTS 完成事件");
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
    // const availableVoices = voices
    //   .filter(v => !v.networkConnectionRequired && !v.notInstalled)
    //   .map(v => {
    //     return { id: v.id, name: v.name, language: v.language };
    //   });
    // console.log('voices:', voices);
    if (voices && voices.length > 0) {
      try {
        await Tts.setDefaultLanguage(appStore.recordingLanguage);
      } catch (err) {
        // My Samsung S9 has always this error: "Language is not supported"
        Alert.alert("错误", "语音语言设置失败，请报告给开发者");
        console.log(`setDefaultLanguage error `, err);
      }
      //await Tts.setDefaultVoice(voices[0].id);
      Tts.setIgnoreSilentSwitch("ignore");
      Tts.setDucking(true);
      Tts.setDefaultRate(0.5);

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
      const answer = await generateResponse(appStore.position, finalTranscription);
      if (answer) {
        console.log("AI回答:", answer);
        addNewQAPair(finalTranscription, answer, 1);

        // 将回答转换为语音
        if (TTS_TYPE === 1){
          console.log('将回答转换为语音');
          const response = await openai.audio.speech.create({
            model: "tts-1",
            voice: appStore.language === "en" ? "nova" : "alloy",
            input: answer,
          });
          const audioData = await response.arrayBuffer();
          await playAudio(audioData);
        }else{
          await playTts(answer);
        }

      } else {
        console.error("无法生成回答");
        Alert.alert("错误", "无法生成回答，请重试。");
        if (isInterviewingRef.current) {
          // isRecognizingRef.current = true;
          await handleStart();
        }
      }
    }
    setTranscription({ transcriptTally: "", transcript: "" });
  };

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

      // console.log("简历文件路径:", filePath);

      // 使用 await 等待文件内容读取完成
      const content = await FileSystem.readAsStringAsync(filePath);
      console.log("简历内容加载成功");
      return content; // 返回读取的内容
    } catch (error) {
      console.error("处理简历文件时出错:", error);
      Alert.alert("错误", "无法处理简历文件");
      return null; // 出错时返回 null
    }
  };

  useEffect(() => {
    // 每当对话内容更新时，滚动到底部
    scrollViewRef.current?.scrollToEnd({ animated: true });
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
        // requiresOnDeviceRecognition: true,
        // androidIntent:"android.speech.action.RECOGNIZE_SPEECH",
        // iosTaskHint:"dictation",
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

  const generateResponse = async (jobPositon: string, prompt: string) => {
    const language = appStore.language;

    try {
      const resumeContent = await loadResumeContent();
      if (!resumeContent) {
        Alert.alert('提示', '无法加载简历内容', [
          {text: '确定', onPress: () => {
            appStore.resetState();
            appStore.setCurrentStep(1);
          }}
        ]);
        return;
      }
      // console.log('resumeContent:', resumeContent?.length);
      const msg = [
        {
          role: "system",
          content: `You are a job candidate in an interview. Answer questions in ${language} based on the provided resume. Your responses should be concise, highlighting only the most relevant points. Be professional and specific, focusing on key achievements and skills.`,
        },
        {
          role: "user",
          content: `Job Position: ${jobPositon}\n\nResume content:\n\n${resumeContent}\n\nRemember this information for your responses.`,
        },
        {
          role: "assistant",
          content:
            "Understood. I'm ready to provide concise, relevant answers based on the resume.",
        },
        {
          role: "user",
          content: `Interviewer's question: ${prompt}\nProvide a brief, focused answer highlighting key points.`,
        },
      ];
      console.log('msg:', msg.length);
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: msg.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content
        })),
        max_tokens: 300,
      });


      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating response:", error);
      return null;
    }
  };

  // 辅助函数：将 ArrayBuffer 转换为 Base64 字符串
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleStartButtonPress = async () => {
    console.log("按钮被点击，当前状态:", isInterviewingRef.current);
    try {
      if (isInterviewingRef.current) {
        console.log("尝试结束面试");
        await handleStop();
        
        appStore.resetState();
        appStore.setCurrentStep(1);
      } else {
        console.log("尝试开始面试");
        updateIsInterviewing(true);
        initTts();
        await handleStart();
        await addNewQAPair("开始面试...", "", 0);
      }
    } catch (error) {
      console.error("处理按钮点击时出错:", error);
      await handleStop();
      Alert.alert("错误", "处理面试状态时出现问题，请重试。");
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

  const renderFooter = () => (
    <TouchableOpacity
      style={[
        styles.button,
        isInterviewing && styles.activeButton,
      ]}
      onPress={handleStartButtonPress}
    >
      <Text style={styles.buttonText}>
        {isInterviewing ? "结束面试" : "开始面试"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.pageTitle}>开始面试辅助</Text>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {interviewContent.length === 0 ? (
          <Text style={styles.defaultText}>
            准备好以后点击开始按钮，AI助理将开始接收面试问题并给出语音和文字提示
          </Text>
        ) : (
          interviewContent.map((content, index) => (
            <Text key={index} style={styles.dialogueText}>{content}</Text>
          ))
        )}
      </ScrollView>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  activeButton: {
    backgroundColor: "#FF4136",
  },
  instruction: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  footer: {
    width: "100%",
    padding: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
});

export default Page4;