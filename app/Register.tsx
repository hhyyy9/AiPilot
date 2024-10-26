import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Modal, Text, ActivityIndicator } from '@ant-design/react-native';
import { appStore } from './stores/AppStore';
import { useTranslation } from 'react-i18next';

const Register = observer(() => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigation = useNavigation();

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
      Modal.alert('错误', '请填写所有字段');
      return;
    }

    if (!validateEmail(username)) {
      Modal.alert('错误', '请输入有效的邮箱地址');
      return;
    }

    if (password !== confirmPassword) {
      Modal.alert('错误', '两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      const response = await appStore.register(username, password);
      if (!response.success) {
        Modal.alert('错误', response.error);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      Modal.alert('成功', '注册成功', [
        { text: 'OK', onPress: () => navigation.navigate('Login' as never) }
      ]);
    } catch (error) {
      setIsLoading(false);
      Modal.alert('错误', '注册失败，请稍后重试:' + error);
    }
  }, [username, password, confirmPassword, navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('register')}</Text>
      </View>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/react-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.inputContainer}>
          <Input
            placeholder={t('emailPlaceholder')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            type="text"
            style={styles.input}          />
          <Input
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            type="password"
            style={styles.input}
            textContentType='oneTimeCode'
          />
          <Input
            placeholder={t('confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            type="password"
            style={styles.input}
            textContentType='oneTimeCode'
          />
        </View>
        <Button
          type="primary"
          onPress={handleRegister}
          style={styles.buttonContainer}
          disabled={!!emailError}
        >
          {t('registerButton')}
        </Button>
        <Modal
          transparent
          visible={isLoading}
          animationType="fade"
          style={styles.modalContainer}
        >
            <View style={styles.modalContent}>
              <ActivityIndicator size="large"/>
              <Text style={styles.loadingText}>{t('registering')}</Text>
            </View>
        </Modal>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)', // 半透明背景
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5, // 用于 Android 的阴影
    shadowColor: '#000', // 以下四行用于 iOS 的阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default Register;
