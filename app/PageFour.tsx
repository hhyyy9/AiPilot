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
  addSpeechRecognitionListener,
} from "expo-speech-recognition";

const OPENAI_API_KEY =
  "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";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});


const LANGUAGE_MAP: { [key: string]: string } = {
  af: "Afrikaans",
  ar: "العربية",
  hy: "Հայերեն",
  az: "Azərbaycan",
  be: "Беларуская",
  bs: "Bosanski",
  bg: "Български",
  ca: "Català",
  zh: "中文",
  hr: "Hrvatski",
  cs: "Čeština",
  da: "Dansk",
  nl: "Nederlands",
  en: "English",
  et: "Eesti",
  fi: "Suomi",
  fr: "Français",
  gl: "Galego",
  de: "Deutsch",
  el: "Ελληνικά",
  he: "עברית",
  hi: "हिन्दी",
  hu: "Magyar",
  is: "Íslenska",
  id: "Bahasa Indonesia",
  it: "Italiano",
  ja: "日本語",
  kn: "ಕನ್ನಡ",
  kk: "Қазақ",
  ko: "한국어",
  lv: "Latviešu",
  lt: "Lietuvių",
  mk: "Македонски",
  ms: "Bahasa Melayu",
  mr: "मराठी",
  mi: "Māori",
  ne: "नेपाली",
  no: "Norsk",
  fa: "فارسی",
  pl: "Polski",
  pt: "Português",
  ro: "Română",
  ru: "Русский",
  sr: "Српски",
  sk: "Slovenčina",
  sl: "Slovenščina",
  es: "Español",
  sw: "Kiswahili",
  sv: "Svenska",
  tl: "Tagalog",
  ta: "தமிழ்",
  th: "ไทย",
  tr: "Türkçe",
  uk: "Українська",
  ur: "اردو",
  vi: "Tiếng Việt",
  cy: "Cymraeg",
};

  // 定义监听器的类型
  type Listener = {
    remove: () => void;
  } | null;

  type Listeners = {
    startListener: Listener;
    endListener: Listener;
    resultListener: Listener;
    errorListener: Listener;
  };

const Page4 = observer(() => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [interviewContent, setInterviewContent] = useState<string[]>([]);
  const [resumeContent, setResumeContent] = useState("");
  const [isInterviewing, setIsInterviewing] = useState(false);
  const isInterviewingRef = useRef(false);

  const [transcription, setTranscription] = useState({
    transcriptTally: "",
    transcript: "",
  });

  const listenersRef = useRef<Listeners>({
    startListener: null,
    endListener: null,
    resultListener: null,
    errorListener: null
  });

  useEffect(() => {
    isInterviewingRef.current = isInterviewing;
  }, [isInterviewing]);

  useEffect(() => {

    listenersRef.current.startListener = addSpeechRecognitionListener("start", () => {
      console.log("Speech recognition started");
    });
  
    listenersRef.current.endListener = addSpeechRecognitionListener("end", (event) => {
      console.log("Speech recognition ended",event);
    });
  
    listenersRef.current.resultListener = addSpeechRecognitionListener("result", (ev) => {
      console.log('onSpeechResults: ', ev);
      if(!isInterviewingRef.current){
        return;
      }
      
      if (ev.isFinal) {
        const finalTranscript = ev.results[0]?.transcript || "";
        console.log('最终识别结果: ', finalTranscript);
        
        setTranscription((current) => ({
          transcriptTally: (current.transcriptTally ?? "") + finalTranscript,
          transcript: (current.transcriptTally ?? "") + finalTranscript,
        }));
        
        handleSpeechEnd(finalTranscript);
      }
    });
  
    listenersRef.current.errorListener = addSpeechRecognitionListener("error", (event) => {
      console.log("error code:", event.error, "error message:", event.message);
      if (event.error === 'no-speech' && isInterviewingRef.current) {
        console.log("No speech detected, restarting recognition...");
      }
      handleStart();
    });
  
    return () => {
      Object.values(listenersRef.current).forEach(listener => listener?.remove());
    };
  }, []);

  

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
        console.log('将回答转换为语音');
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: appStore.language === "en" ? "nova" : "alloy",
          input: answer,
        });

        const audioData = await response.arrayBuffer();
        await playAudio(audioData);
        console.log('音频播放完成，准备开始新的录音',isInterviewingRef.current);
      } else {
        console.error("无法生成回答");
        Alert.alert("错误", "无法生成回答，请重试。");
        if (isInterviewingRef.current) {
          // isRecognizingRef.current = true;
          handleStart();
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
      }
    } catch (error) {
      console.error("播放音频��误:", error);
      Alert.alert("错误", "播放音频时出现错误，请重试。");
      if (isInterviewingRef.current) {
        console.log("播放出错，但仍准备开始新的语音识别");
      }
    }
    handleStart();
  };

  const startInterview = () => {
    try {
      console.log("开始面试流程...");
      isInterviewingRef.current = true;
      console.log("面试开始成功");
    } catch (error) {
      console.error("开始面试时出错:", error);
      isInterviewingRef.current = false;
      Alert.alert("错误", "开始面试时出现问题，请重试。");
    }
  };

  const stopInterview = () => {
    try {
      setIsInterviewing(false);
      isInterviewingRef.current = false;
    } catch (error) {
      console.error("停止面试时出错:", error);
      throw error;
    }
  };

  useEffect(() => {
    loadResumeContent();
  }, []);

  useEffect(() => {
    // 每当对话内容更新时，滚动到底部
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [interviewContent]);

  const handleStart = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      console.warn("Permissions not granted", result);
      return;
    }
    isInterviewingRef.current = true;
    setIsInterviewing(prev => {
      console.log("强制更新 isInterviewing:", !prev);
      return !prev;
    });
    // Start speech recognition
    ExpoSpeechRecognitionModule.start({
      lang: appStore.recordingLanguage,
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: false,
      addsPunctuation: false,
      contextualStrings: ["Carlsen", "Nepomniachtchi", "Praggnanandhaa"],
    });
  };

  const handleStop = async () => {
    // Stop speech recognition
    // 移除所有监听器
    Object.values(listenersRef.current).forEach(listener => listener?.remove());
    isInterviewingRef.current = false;
    setIsInterviewing(prev => {
      console.log("强制更新 isInterviewing:", !prev);
      return !prev;
    });


    ExpoSpeechRecognitionModule.stop();
  };


  const loadResumeContent = () => {
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
        throw new Error("Invalid resume file format");
      }

      console.log("Resume file path:", filePath);

      // 异步读取文件内容
      FileSystem.readAsStringAsync(filePath)
        .then((content) => {
          setResumeContent(content);
          console.log("Resume content loaded successfully");
        })
        .catch((error) => {
          console.error("Error reading resume file:", error);
          Alert.alert("错误", "无法读取简历文件");
        });
    } catch (error) {
      console.error("Error processing resume file:", error);
      Alert.alert("错误", "无法处理简历文件");
    }
  };

  const generateResponse = async (jobPositon: string, prompt: string) => {
    const language = LANGUAGE_MAP[appStore.language] || "English";

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
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
        ],
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
    try {
      console.log("按钮被点击，当前状态:", isInterviewingRef.current);

      if (isInterviewingRef.current) {
        stopInterview();
        await handleStop();
        console.log("尝试结束面试");
      } else {
        await handleStart();
        startInterview();
        console.log("尝试开始面试");
        await addNewQAPair("开始面试...", "", 0);
      }
    } catch (error) {
      console.error("处理按钮点击时出错:", error);
      await handleStop();
      stopInterview();
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
        isInterviewingRef.current && styles.activeButton,
      ]}
      onPress={handleStartButtonPress}
    >
      <Text style={styles.buttonText}>
        {isInterviewingRef.current ? "结束面试" : "开始面试"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Text style={styles.pageTitle}>第 4 页：AI 面试助手</Text>
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