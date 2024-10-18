import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { Button, Input, Text, Dialog, Image, useTheme } from '@rneui/themed';
import { appStore } from './stores/AppStore'; // 确保这个路径是正确的

const Login = observer(() => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      Alert.alert('错误', '请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    try {
      await appStore.login(username, password);
      setIsLoading(false);
      Alert.alert('成功', '登录成功', [
        { text: 'OK', onPress: () => router.replace('/main') }
      ]);
    } catch (error) {
      Alert.alert('错误', '登录失败，请检查用户名和密码');
    }
  }, [username, password, router]);

  const handleNavigateToRegister = useCallback(() => {
    router.push({
      pathname: '/Register'
    });
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>登录</Text>
      </View>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/react-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.inputContainer}>
          <Input
            placeholder="邮箱地址"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
            errorMessage={emailError}
            errorStyle={styles.errorText}
          />
          <Input
            placeholder="密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <Button
          title="登录"
          onPress={handleLogin}
          containerStyle={styles.buttonContainer}
          disabled={!!emailError}
        />
        <Button
          title="注册新账户"
          onPress={handleNavigateToRegister}
          containerStyle={styles.registerButtonContainer}
          type="outline"
        />
        <Dialog isVisible={isLoading} overlayStyle={styles.dialogOverlay}>
          <Dialog.Loading loadingProps={{ size: 'large', color: '#0000ff' }} />
          <Text style={styles.loadingText}>登录中...</Text>
        </Dialog>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    width: '100%',
    height: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  registerButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  registerButtonContainer: {
    width: '100%',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
  },
  dialogOverlay: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Login;
