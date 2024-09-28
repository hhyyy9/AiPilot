import { makeAutoObservable } from 'mobx';

class AppStore {
  currentStep: number = 1;
  position: string = '';
  resumeFile: any = null;
  language: string = 'en';

  constructor() {
    makeAutoObservable(this);
  }

  nextStep() {
    this.currentStep += 1;
  }

  setCurrentStep(step: number) {
    this.currentStep = step;
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
}

export const appStore = new AppStore();