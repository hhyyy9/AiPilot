import { makeAutoObservable } from 'mobx';

class AppStore {
  currentStep: number = 1;
  position: string = '';
  resumeFile: any = null;
  language: string = 'en';
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
    // ...  ...
  }
}

export const appStore = new AppStore();