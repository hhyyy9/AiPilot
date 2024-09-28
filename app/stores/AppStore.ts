import { makeAutoObservable } from 'mobx';

class AppStore {
  currentStep = 1;
  totalSteps = 5;
  position = '';
  resumeFile = null;

  constructor() {
    makeAutoObservable(this);
  }

  setPosition(position: string) {
    this.position = position;
  }

  setResumeFile(file: any) {
    this.resumeFile = file;
  }

  setCurrentStep(step: number) {
    if (step >= 1 && step <= this.totalSteps && step <= this.currentStep) {
      this.currentStep = step;
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }
}

export const appStore = new AppStore();