import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, Link } from 'expo-router';
import { apiService } from './services/ApiService';
import { Button, Input, Text, Dialog, Image, useTheme } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';

const Register = observer(() => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  useEffect(() => {
    if (username && !validateEmail(username)) {
      setEmailError('请输入有效的邮箱地址');
    } else {
      setEmailError('');
    }
  }, [username]);

  const handleRegister = useCallback(async () => {
    if (!username || !password || !confirmPassword) {
      alert('请填写所有字段');
      return;
    }

    if (!validateEmail(username)) {
      alert('请输入有效的邮箱地址');
      return;
    }

    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.register(username, password);
      setIsLoading(false); // 在显示成功消息之前关闭加载对话框
      alert('注册成功');
      router.replace({ pathname: '/Login' });
    } catch (error) {
      setIsLoading(false); // 确保在出错时也关闭加载对话框
      alert('注册失败，请稍后重试:' + error);
    }
  }, [username, password, confirmPassword, router]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>注册</Text>
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
          <Input
            placeholder="确认密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
        <Button
          title="注册"
          onPress={handleRegister}
          containerStyle={styles.buttonContainer}
          disabled={!!emailError}
        />
        <Dialog isVisible={isLoading} overlayStyle={styles.dialogOverlay}>
          <Dialog.Loading loadingProps={{ size: 'large', color: '#0000ff' }} />
          <Text style={styles.loadingText}>注册中...</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    top: 7,
    zIndex: 1,
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
    paddingTop: 0, // 移除顶部内边距，因为 SafeAreaView 已经处理了这个问题
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 80, // 增加底部margin，与下面的内容留出更多空间
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
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
  errorText: {
    color: 'red',
  },
});

export default Register;
