import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Button, Modal, Text, ActivityIndicator, Card } from '@ant-design/react-native';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';
import Header from './components/Header';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

interface Interview {
  userId: string;
  positionName: string;
  resumeUrl: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  state: boolean;
  id: string;
}

const Main = observer(() => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserInfo();
  }, [appStore.isFinished]);

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const response = await appStore.getUserInfo();
      if (response.success) {
        setUserInfo(response.data);
      } else {
        Modal.alert(t('mainPageGetUserInfoError'), t('mainPageGetUserInfoErrorDetail'));
      }
    } catch (error) {
      console.error('获取用户信息错误:', error);
      Modal.alert(t('mainPageGetUserInfoError'), t('mainPageGetUserInfoErrorDetail'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuPress = () => {
    Modal.alert(
      t('logoutConfirmation'),
      t('logoutMessage'),
      [
        { text: t('cancel'), onPress: () => console.log('取消退出登录'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            appStore.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ]
    );
  };

  const renderInterviewItem = ({ item }: { item: Interview }) => (
    <Card style={styles.interviewCard}>
      <Card.Header
        title={item.positionName}
        extra={item.state ? t('interviewInProgress') : t('interviewEnded')}
      />
      <Card.Body>
        <View style={styles.cardBody}>
        <Text>{t('interviewStartTime')} {new Date(item.startTime).toLocaleString()}</Text>
          {item.endTime && (
            <Text>{t('interviewEndTime')} {new Date(item.endTime).toLocaleString()}</Text>
          )}
          {item.duration && <Text>{t('interviewDuration')} {item.duration} {t('minutes')}</Text>}
        </View>
      </Card.Body>
    </Card>
  );

  const renderFooter = () => (
    <Button
      type="primary"
      onPress={() => navigation.navigate('PageOne' as never)}
    >
      {t('startNewInterview')}
    </Button>
  );

  return (
    <PageLayout footer={renderFooter()}>
      <Header title={t('appName')} menuType={0} onMenuPress={handleMenuPress} isShowBackButton={false} onBackPress={() => {}} />
      <View style={styles.container}>
        {userInfo && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.username}>{t('user')}: {userInfo.username}</Text>
            <Text style={styles.credits}>{t('remainingCredits')}: {userInfo.credits}</Text>
            {/* <Text style={styles.verified}>
              验证状态: {userInfo.isVerified ? '已验证' : '未验证'}
            </Text> */}
          </View>
        )}
        <Text style={styles.sectionTitle}>{t('interviewRecords')}</Text>
        <FlatList
          data={userInfo?.interviews || []}
          renderItem={renderInterviewItem}
          keyExtractor={(item) => item.id}
          style={styles.interviewList}
        />
      </View>
      <Modal
        transparent
        visible={isLoading}
        animationType="fade"
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <ActivityIndicator size="large"/>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </Modal>
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  userInfoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  credits: {
    fontSize: 16,
    marginBottom: 5,
  },
  verified: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  interviewList: {
    flex: 1,
  },
  interviewCard: {
    marginBottom: 10,
  },
  cardBody: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default Main;
