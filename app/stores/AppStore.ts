import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';

// const isDevelopment = process.env.NODE_ENV === 'development';
// console.log('当前环境:', isDevelopment ? '开发环境' : '生产环境');
// let BASE_URL : string | undefined = "http://192.168.0.114:7071/api/v1";
// if (!isDevelopment) {
// const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE_URL : string | undefined = "http://192.168.0.114:7071/api/v1";
// }

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
  userInfo: any = null;
  userName: string = '';
  accessToken: string = '';
  refreshToken: string = '';

  user: any = null;
  isLoggedIn: boolean = false;
  currentInterview: any = null;

  isFinished: boolean = false;

  private refreshTokenInterval: NodeJS.Timeout | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setIsFinished(finished: boolean) {
    this.isFinished = finished;
  }

  setCurrentStep(step: number) {
    if (step >= 1 && step <= 4) {
      this.currentStep = step;
    }
  }

  nextStep() {
    if (this.currentStep <= 4) {
      this.currentStep += 1;
    }
  }

  setPosition(position: string) {
    this.position = position;
  }

  setResumeFile(file: any) {
    console.log('setResumeFile:', file);
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
    console.log('resetState');
    this.currentStep = 1;
    // this.resumeFile = null;
    // this.language = 'en';
    // this.currentTranscription = '';
    // this.position = '';
    // this.recordingLanguage = 'en-US';
  }

  logout() {
    this.stopTokenRefreshTimer();
    this.accessToken = '';
    this.refreshToken = '';
    this.userInfo = null;
    this.user = null;
    this.isLoggedIn = false;
    this.currentInterview = null;
    this.isFinished = false;
    this.userName = '';
    this.position = '';
    this.resumeFile = null;
    this.language = 'English';
    this.recordingLanguage = 'en-US';
    this.currentTranscription = '';
  }

  setToken(token: string) {
    this.accessToken = token;
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
  }

  private async request(method: string, url: string, data?: any, customHeaders?: Record<string, string>): Promise<any> {
    try {
      const headers = {
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...customHeaders,
        'Accept-Language': 'en',
      };
      const response = await axios({
        method,
        url: `${BASE_URL}${url}`,
        data,
        headers,
      });
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async login(username: string, password: string) {
    try {
      console.log('login request:', username, password);
      const response = await this.request('POST', '/userLogin', { username, password });
      if (response.success) {
        runInAction(() => {
          console.log('login response:', response);
          this.user = response.data.userId;
          this.isLoggedIn = true;
          this.setToken(response.data.accessToken);
          this.setRefreshToken(response.data.refreshToken);
          this.startTokenRefreshTimer();
        });
      }else{
        return null;
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      return error;
    }
  }

  async register(username: string, password: string) {
    try {
      const response = await this.request('POST', '/userRegister', { username, password });
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      return error;
    }
  }

  async startInterview() {
    try {
      console.log('startInterview:', this.user, this.position);
      const response = await this.request('POST', '/startInterview', { userId: this.user, positionName: this.position, resumeUrl: "cv.text" });
      runInAction(() => {
        this.currentInterview = response.data;
      });
      return response;
    } catch (error) {
      console.error('Start interview failed:', error);
      return error;
    }
  }

  async endInterview() {
    if (!this.user || !this.currentInterview) return;
    try {
      const response = await this.request('POST', '/endInterview', { userId: this.user });
      if (response.success) {
      runInAction(() => {
        this.currentInterview = null;
        });
      }
      return response;
    } catch (error) {
      console.error('End interview failed:', error);
      return error;
    }
  }

  async aiTrigger(interviewId: string, prompt: string) {
    try {
      const response = await this.request('POST', '/aiTrigger', { jobPosition: this.position, prompt, language:this.language, resumeContent: this.resumeFile,interviewId });
      return response;
    } catch (error) {
      console.error('AI trigger failed:', error);
      return error;
    }
  }

  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
    try {
      const response = await this.request('POST', '/create-checkout-session', { priceId, successUrl, cancelUrl });
      return response;
    } catch (error) {
      console.error('Create checkout session failed:', error);
      return error;
    }
  }

  async confirmCheckoutSession(sessionId: string) {
    try {
      const response = await this.request('POST', '/confirm-checkout-session', { sessionId });
      if (response.success) {
        runInAction(() => {
          this.user.credits = response.data.totalCredits;
        });
      }
      return response;
    } catch (error) {
      console.error('Confirm checkout session failed:', error);
      return error;
    }
  }

  async uploadCV(file: FormData) {
    try {
      const response = await this.request('POST', '/uploadCV', file);
      const { fileContent } = response.data;
      this.setResumeFile(fileContent);
      return response;
    } catch (error) {
      console.error('Upload CV failed:', error);
      return error;
    }
  }

  async refreshNewToken(): Promise<{}> {
    try {
      if (!this.refreshToken) {
        throw new Error('token is null');
      }
      const response = await this.request('POST', '/refreshToken', {}, {
        'x-refresh-token': this.refreshToken
      });
      console.log('refreshNewToken2:', response);
      if (response.data.accessToken && response.data.refreshToken) {
        this.setToken(response.data.accessToken);
        this.setRefreshToken(response.data.refreshToken);
        return response;
      } else {
        throw new Error('token format error');
      }
    } catch (error) {
      console.error('token refresh failed:', error);
      throw error;
    }
  }

  async getUserInfo(page:number=1,limit:number=10) :Promise<any>{
    try {
      const response = await this.request('GET', `/getUserInfo?page=${page}&limit=${limit}`);
      this.userInfo = response.data;
      return response;
    } catch (error) {
      console.error('Get user info failed:', error);
      return error;
    }
  }

  startTokenRefreshTimer() {
    // 每15分钟刷新一次token
    this.refreshTokenInterval = setInterval(() => {
      this.refreshNewToken();
    }, 30 * 60 * 1000);
  }

  stopTokenRefreshTimer() {
    if (this.refreshTokenInterval) {
      clearInterval(this.refreshTokenInterval);
      this.refreshTokenInterval = null;
    }
  }
}

export const appStore = new AppStore();
