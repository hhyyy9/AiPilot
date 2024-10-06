import { makeAutoObservable } from 'mobx';


export const LANGUAGE_MAP: { [key: string]: { name: string, code: string } } = {
  'en': { name: 'English', code: 'en-US' },
  'zh': { name: '中文', code: 'zh-CN' },
  'es': { name: 'Español', code: 'es-ES' },
  'ja': { name: '日本語', code: 'ja-JP' },
  'ko': { name: '한국어', code: 'ko-KR' },
  'fr': { name: 'Français', code: 'fr-FR' },
  'de': { name: 'Deutsch', code: 'de-DE' },
  'pt': { name: 'Português', code: 'pt-PT' },
  'ru': { name: 'Русский', code: 'ru-RU' },
  'ar': { name: 'العربية', code: 'ar-SA' },
  'hi': { name: 'हिन्दी', code: 'hi-IN' }
};

class AppStore {
  currentStep: number = 1;
  position: string = '';
  resumeFile: any = null;
  language: string = 'English';
  recordingLanguage: string = 'en-US';
  currentTranscription: string = '';
  

  constructor() {
    makeAutoObservable(this);
  }

  setCurrentStep(step: number) {
    if (step >= 1 && step <= 4) {
      this.currentStep = step;
    }
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep += 1;
    }
  }

  setPosition(position: string) {
    this.position = position;
  }

  setResumeFile(file: any) {
    this.resumeFile = file;
  }

  setLanguage(language: string) {
    this.language = language;
  }

  setRecordingLanguage(language: string) {
    this.recordingLanguage = language;
  }

  setCurrentTranscription(text: string) {
    this.currentTranscription = text;
  }

  appendToCurrentTranscription(text: string) {
    this.currentTranscription += ' ' + text;
    this.currentTranscription = this.currentTranscription.trim();
  }

  clearCurrentTranscription() {
    this.currentTranscription = '';
  }

  resetState() {
    // 重置所有相关状态
    this.currentStep = 1;
    this.resumeFile = null;
    this.language = 'en';
    this.currentTranscription = '';
    this.position = '';
    this.recordingLanguage = 'en-US';
  }
}

export const appStore = new AppStore();