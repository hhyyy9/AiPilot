import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Image } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Input, Button, Modal, Text, ActivityIndicator } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import { appStore } from './stores/AppStore';
import { useTranslation } from 'react-i18next';

const Login = observer(() => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigation = useNavigation();

  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      Modal.alert(t('errorTitle'), t('emptyFieldsError'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await appStore.login(username, password);
      if (response.success == false) {
        Modal.alert(t('errorTitle'), response.data.message);
        return;
      }
      navigation.navigate('Main' as never)
    } catch (error) {
      setIsLoading(false);
      Modal.alert(t('errorTitle'), t('loginFailedError'));
    }finally {
      setIsLoading(false);
    }
  }, [username, password, navigation, t]);

  const handleNavigateToRegister = useCallback(() => {
    navigation.navigate('Register' as never);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appName')}</Text>
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
            style={styles.input}
          />
          <Input
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            type="password"
            style={styles.input}
          />
        </View>
        <Button
          type="primary"
          onPress={handleLogin}
          style={styles.buttonContainer}
          disabled={!!emailError}
        >
          {t('loginButton')}
        </Button>
        <Button
          onPress={handleNavigateToRegister}
          style={styles.registerButtonContainer}
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
              <Text style={styles.loadingText}>{t('loadingText')}</Text>
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
  registerButtonContainer: {
    width: '100%',
    marginTop: 10,
    borderColor: '#108ee9',
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

export default Login;
