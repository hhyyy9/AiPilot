import { createTheme } from '@rneui/themed';

export const theme = createTheme({
  lightColors: {
    primary: '#4A90E2',
    background: '#FFFFFF',
    // 添加其他你需要的颜色
  },
  darkColors: {
    primary: '#2E5A88',
    background: '#121212',
    // 添加其他你需要的颜色
  },
  mode: 'light', // 默认使用亮色主题
});