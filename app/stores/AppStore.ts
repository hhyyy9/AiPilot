import { makeAutoObservable,runInAction} from 'mobx';
import axios from 'axios';
import { apiService } from '../services/ApiService';

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
  userId: string = '';
  userName: string = '';
  accessToken: string = '';
  refreshToken: string = '';

  user: any = null;
  isLoggedIn: boolean = false;
  currentInterview: any = null;

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

  async login(username: string, password: string) {
    try {
      const response = await apiService.login(username, password);
      runInAction(() => {
        this.user = response.data.userId;
        this.isLoggedIn = true;
        apiService.setToken(response.data.accessToken);
        apiService.setRefreshToken(response.data.refreshToken);
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(username: string, password: string) {
    try {
      await apiService.register(username, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async startInterview(positionName: string, resumeUrl: string) {
    try {
      const response = await apiService.startInterview(positionName, resumeUrl);
      runInAction(() => {
        this.currentInterview = response.data;
      });
    } catch (error) {
      console.error('Start interview failed:', error);
      throw error;
    }
  }

  async endInterview() {
    if (!this.user || !this.currentInterview) return;
    try {
      await apiService.endInterview(this.user.id);
      runInAction(() => {
        this.currentInterview = null;
      });
    } catch (error) {
      console.error('End interview failed:', error);
      throw error;
    }
  }

  async aiTrigger(prompt: string, language: string) {
    if (!this.currentInterview) return;
    try {
      const response = await apiService.aiTrigger(
        this.currentInterview.id,
        this.currentInterview.positionName,
        prompt,
        language,
        this.currentInterview.resumeContent
      );
      return response.data;
    } catch (error) {
      console.error('AI trigger failed:', error);
      throw error;
    }
  }

  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
    try {
      const response = await apiService.createCheckoutSession(priceId, successUrl, cancelUrl);
      return response.data;
    } catch (error) {
      console.error('Create checkout session failed:', error);
      throw error;
    }
  }

  async confirmCheckoutSession(sessionId: string) {
    try {
      const response = await apiService.confirmCheckoutSession(sessionId);
      runInAction(() => {
        this.user.credits = response.data.totalCredits;
      });
    } catch (error) {
      console.error('Confirm checkout session failed:', error);
      throw error;
    }
  }

  async uploadCV(file: FormData) {
    try {
      const response = await apiService.uploadCV(file);
      return response.data;
    } catch (error) {
      console.error('Upload CV failed:', error);
      throw error;
    }
  }
}

export const appStore = new AppStore();