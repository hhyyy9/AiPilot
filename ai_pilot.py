from openai import OpenAI
import pyaudio
import wave
import threading
import numpy as np
from pydub import AudioSegment
from pydub.playback import play
import io
import queue
import tempfile
import os
from PyPDF2 import PdfReader
import argparse
import docx
from PyPDF2 import PdfReader
from dotenv import dotenv_values

# 在文件顶部定义全局变量
global_lang_code = 'en'  # 默认设置为英语

# 从.env文件加载配置
config = dotenv_values(".env")

# 初始化OpenAI客户端
client = OpenAI(
    api_key=config["OPENAI_API_KEY"],
)

# 音频设置常量
CHUNK = 2048
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
SILENCE_THRESHOLD = 500  # 静音阈值
SILENCE_DURATION = 1  # 静音持续时间（秒）

# 支持的语言列表
LANGUAGE_MAP = {
    'af': 'Afrikaans', 'ar': 'Arabic', 'hy': 'Armenian', 'az': 'Azerbaijani',
    'be': 'Belarusian', 'bs': 'Bosnian', 'bg': 'Bulgarian', 'ca': 'Catalan',
    'zh': 'Chinese', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish',
    'nl': 'Dutch', 'en': 'English', 'et': 'Estonian', 'fi': 'Finnish',
    'fr': 'French', 'gl': 'Galician', 'de': 'German', 'el': 'Greek',
    'he': 'Hebrew', 'hi': 'Hindi', 'hu': 'Hungarian', 'is': 'Icelandic',
    'id': 'Indonesian', 'it': 'Italian', 'ja': 'Japanese', 'kn': 'Kannada',
    'kk': 'Kazakh', 'ko': 'Korean', 'lv': 'Latvian', 'lt': 'Lithuanian',
    'mk': 'Macedonian', 'ms': 'Malay', 'mr': 'Marathi', 'mi': 'Maori',
    'ne': 'Nepali', 'no': 'Norwegian', 'fa': 'Persian', 'pl': 'Polish',
    'pt': 'Portuguese', 'ro': 'Romanian', 'ru': 'Russian', 'sr': 'Serbian',
    'sk': 'Slovak', 'sl': 'Slovenian', 'es': 'Spanish', 'sw': 'Swahili',
    'sv': 'Swedish', 'tl': 'Tagalog', 'ta': 'Tamil', 'th': 'Thai',
    'tr': 'Turkish', 'uk': 'Ukrainian', 'ur': 'Urdu', 'vi': 'Vietnamese',
    'cy': 'Welsh'
}
# 支持的语言列表
SUPPORTED_LANGUAGES = list(LANGUAGE_MAP.keys())


class AudioProcessor:
    def __init__(self):
        # 初始化PyAudio和音频流
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)
        self.frames = []
        self.is_recording = False
        self.audio_queue = queue.Queue()

    def start_recording(self):
        # 开始录音
        self.is_recording = True
        self.frames = []
        threading.Thread(target=self._record).start()

    def _record(self):
        # 录音主循环
        silent_chunks = 0
        while self.is_recording:
            try:
                data = self.stream.read(CHUNK, exception_on_overflow=False)
                self.frames.append(data)
            except IOError as e:
                if e.errno == pyaudio.paInputOverflowed:
                    print("警告: 音频输入溢出,跳过此帧")
                else:
                    raise
            
            # 检测静音
            audio_data = np.frombuffer(data, dtype=np.int16)
            if np.abs(audio_data).mean() < SILENCE_THRESHOLD:
                silent_chunks += 1
            else:
                silent_chunks = 0
            
            # 如果静音持续时间超过阈值，停止录音
            if silent_chunks > SILENCE_DURATION * (RATE / CHUNK):
                self.stop_recording()

    def stop_recording(self):
        # 停止录音并将音频数据放入队列
        self.is_recording = False
        audio_data = b''.join(self.frames)
        self.audio_queue.put(audio_data)

    def get_audio(self):
        # 从队列获取音数据
        return self.audio_queue.get()

def record_audio():
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    SILENCE_THRESHOLD = 500  # 静音阈值
    SILENCE_DURATION = 2  # 静音持续时间（秒）

    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    print("开始录音...（说话结束后请保持2秒静音）")
    frames = []
    silent_chunks = 0
    has_speech = False

    while True:
        data = stream.read(CHUNK)
        frames.append(data)

        # 检测是否有声音
        audio_data = np.frombuffer(data, dtype=np.int16)
        if np.abs(audio_data).mean() > SILENCE_THRESHOLD:
            silent_chunks = 0
            has_speech = True
        else:
            silent_chunks += 1

        # 如果有语音，且之后有足够长的静音，则停止录音
        if has_speech and silent_chunks > SILENCE_DURATION * (RATE / CHUNK):
            break

    print("录音结束")

    stream.stop_stream()
    stream.close()
    p.terminate()

    # 将录音数据写入临时文件
    temp_file, temp_file_path = tempfile.mkstemp(suffix=".wav")
    os.close(temp_file)
    
    wf = wave.open(temp_file_path, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

    # 检查文件大小
    file_size = os.path.getsize(temp_file_path)
    print(f"音频文件大小: {file_size} 字节")
    
    if file_size == 0:
        print("警告: 录音文件为空")
        os.remove(temp_file_path)  # 删除空文件
        return None
    
    return temp_file_path

def transcribe_audio(audio_file_path):
    try:
        with open(audio_file_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                response_format="text"
            )
        return transcript
    except Exception as e:
        print(f"转录时发生错误: {str(e)}")
        return None

def load_document(file_path):
    _, file_extension = os.path.splitext(file_path)
    
    if file_extension.lower() == '.txt':
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    elif file_extension.lower() == '.docx':
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    
    elif file_extension.lower() == '.pdf':
        reader = PdfReader(file_path)
        full_text = []
        for page in reader.pages:
            full_text.append(page.extract_text())
        return '\n'.join(full_text)
    
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")

def set_language():
    global global_lang_code
    return global_lang_code

def generate_response(prompt, document_content):
    lang_code = set_language()
    language = LANGUAGE_MAP.get(lang_code, 'English')
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-16k",
            # messages=[
            #     {"role": "system", "content": f"You are a job candidate in an interview. Please answer the interviewer's questions naturally in {language}, as if you were in a real interview. Your answers should be concise, specific, polite, and professional."},
            #     {"role": "user", "content": f"This is your resume content:\n\n{document_content}\n\nPlease remember this information and refer to it when answering questions."},
            #     {"role": "assistant", "content": f"Understood. I will answer questions naturally and professionally in {language}, based on the resume content."},
            #     {"role": "user", "content": f"Interviewer's question: {prompt}\nPlease answer this question as if you were a real job candidate."}
            # ],
            messages=[
                {"role": "system", "content": f"You are a job candidate in an interview. Answer questions in {language} based on the provided resume. Your responses should be concise, highlighting only the most relevant points. Be professional and specific, focusing on key achievements and skills."},
                {"role": "user", "content": f"Resume content:\n\n{document_content}\n\nRemember this information for your responses."},
                {"role": "assistant", "content": "Understood. I'm ready to provide concise, relevant answers based on the resume."},
                {"role": "user", "content": f"Interviewer's question: {prompt}\nProvide a brief, focused answer highlighting key points."}
            ],
            max_tokens=300
        )
        return response.choices[0].message.content, lang_code
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        return None, lang_code

def text_to_speech(text, lang):
    # 对于所有语言，我们使用 'alloy' 声音，除了英语使用 'nova'
    voice = 'nova' if lang == 'en' else 'alloy'
    
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3"  # 改为 opus 格式
        )
        return response.content
    except Exception as e:
        print(f"文本转语音时发生错误: {str(e)}")
        return None

def play_audio(audio_data):
    # 播放 Opus 格式的音频数据
    audio = AudioSegment.from_file(io.BytesIO(audio_data), format="mp3")
    play(audio)

def main():
    global global_lang_code
    parser = argparse.ArgumentParser(description='Set AI assistant language')
    parser.add_argument('--lang', default='en', choices=SUPPORTED_LANGUAGES, help='Set language code')
    args = parser.parse_args()
    
    global_lang_code = args.lang
    
    print(f"Real-time voice assistant started. Language: {global_lang_code}")
    
    document_content = load_document("CV.pdf")  # or .pdf
    
    while True:
        # 录音
        audio_file_path = record_audio()
        if not audio_file_path:
            print("录音失败,请重试。")
            continue

        print("处理中...")
        
        # 使用OpenAI的Whisper模型转录音频
        text = transcribe_audio(audio_file_path)
        if not text:
            print("抱歉,无法识别您的语音。再试一次。")
            os.remove(audio_file_path)
            continue

        print(f"您说: {text}")

        # 使用OpenAI的GPT模型生成回答,传入文档内容
        response, _ = generate_response(text, document_content)
        if not response:
            print("无法生成回答,请重试。")
            os.remove(audio_file_path)
            continue

        print(f"AI回答: {response}")

        # 使用OpenAI的TTS服务将回答转换为语音
        speech_data = text_to_speech(response, global_lang_code)
        if not speech_data:
            print("无法将回答转换为语音,请重试。")
            os.remove(audio_file_path)
            continue

        # 播放AI回答的语音
        print("正在播放AI回答...")
        play_audio(speech_data)

        # 清理临时文件
        os.remove(audio_file_path)

if __name__ == "__main__":
    main()