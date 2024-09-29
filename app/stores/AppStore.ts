import { makeAutoObservable } from 'mobx';

class AppStore {
  currentStep: number = 1;
  position: string = '';
  resumeFile: any = null;
  language: string = 'en';

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

  resetState() {
    // 重置所有相关状态
    this.currentStep = 1;
    this.resumeFile = null;
    this.language = 'en';
    // ... 重置其他需要重置的状态 ...
  }
}

export const appStore = new AppStore();