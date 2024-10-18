import axios from 'axios';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;


class ApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
  }

  private async request(method: string, url: string, data?: any, customHeaders?: Record<string, string>): Promise<any> {
    try {
      const headers = {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...customHeaders,
      };
      const response = await axios({
        method,
        url: `${BASE_URL}${url}`,
        data,
        headers,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // 如果收到401错误，尝试刷新token
        try {
          await this.refreshNewToken();
          // 刷新token成功后，重试原始请求
          return this.request(method, url, data, customHeaders);
        } catch (refreshError) {
          // 如果刷新token失败，抛出原始错误
          throw error.response?.data || error.message;
        }
      }
      if (axios.isAxiosError(error)) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }

  async login(username: string, password: string) {
    return this.request('POST', '/userLogin', { username, password });
  }

  async register(username: string, password: string) {
    return this.request('POST', '/userRegister', { username, password });
  }

  async startInterview(positionName: string, resumeUrl: string) {
    return this.request('POST', '/startInterview', { positionName, resumeUrl });
  }

  async endInterview(userId: string) {
    return this.request('POST', '/endInterview', { userId });
  }

  async aiTrigger(interviewId: string, jobPosition: string, prompt: string, language: string, resumeContent: string) {
    return this.request('POST', '/aiTrigger', { interviewId, jobPosition, prompt, language, resumeContent });
  }

  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
    return this.request('POST', '/create-checkout-session', { priceId, successUrl, cancelUrl });
  }

  async confirmCheckoutSession(sessionId: string) {
    return this.request('POST', '/confirm-checkout-session', { sessionId });
  }

  async uploadCV(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('POST', '/uploadCV', formData);
  }

  async refreshNewToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      if (!this.refreshToken) {
        throw new Error('刷新令牌不存在');
      }
      const response = await this.request('POST', '/v1/refreshToken', {}, {
        'x-refresh-token': this.refreshToken
      });
      
      if (response.accessToken && response.refreshToken) {
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
        return response;
      } else {
        throw new Error('刷新令牌响应格式不正确');
      }
    } catch (error) {
      console.error('刷新令牌失败:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
