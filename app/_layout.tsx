import { Stack } from "expo-router";
import { ThemeProvider } from '@rneui/themed';
import { useColorScheme } from 'react-native';
import { theme } from './createTheme';

export const App = () => {
  // 使用 useColorScheme 钩子来获取系统的颜色方案
  const colorScheme = useColorScheme();
  
  // 根据系统颜色方案设置主题模式
  theme.mode = colorScheme || 'light';

  return (
    <ThemeProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="Register" />
        <Stack.Screen name="main" />
      </Stack>
    </ThemeProvider>
  );
};
