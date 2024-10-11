import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import * as FileSystem from 'expo-file-system';

let recording: Audio.Recording | null = null;


const startRecording = async (): Promise<string> => {
    try {
        console.log('请求录音权限');
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
            throw new Error('未获得录音权限');
        }

        console.log('设置音频模式');
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
        });
      
        // const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
        // recording = newRecording;
        recording = new Audio.Recording();

        console.log('准备录音');
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);

        console.log('开始录音');
        await recording.startAsync();

        console.log('录音开始，临时文件路径:', recording.getURI());
        const uri = recording.getURI();
        if (!uri) return "";
        return uri;
    } catch (error) {
        console.error('录音过程出错:', error);
        throw error;
    }
};

const stopRecording = async (): Promise<string> => {
    if (!recording) {
        throw new Error('没有正在进行的录音');
    }

    try {
        console.log('停止录音');
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('录音完成，文件路径:', uri);

        if (!uri) {
            throw new Error('录音失败，未获得文件路径');
        }
        return uri;
    } catch (error) {
        console.error('停止录音时出错:', error);
        throw error;
    }
};

const playAudioFromPath = async (audioPath: string): Promise<void> => {
    try {
        console.log('开始播放音频:', audioPath);
        const soundObject = new Audio.Sound();
        await soundObject.loadAsync({ uri: audioPath });
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
        await soundObject.unloadAsync();
    } catch (error) {
        console.error('播放音频出错:', error);
        throw error;
    }
};

const deleteAudioFile = async (filePath: string): Promise<void> => {
    try {
        console.log('开始删除音频文件:', filePath);
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        console.log('音频文件删除成功');
    } catch (error) {
        console.error('删除音频文件时出错:', error);
        throw error;
    }
};


export {
    startRecording,
    stopRecording,
    deleteAudioFile,
    playAudioFromPath
}