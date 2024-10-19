import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Button, Modal, Text, ActivityIndicator, Card, Icon } from '@ant-design/react-native';
import { appStore } from './stores/AppStore';
import PageLayout from './components/PageLayout';
import Header from './components/Header';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Fontisto from '@expo/vector-icons/Fontisto';

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

interface UserInfo {
  username: string;
  credits: number;
  interviews: Interview[];
}

const Main = observer(() => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { t } = useTranslation();
  const [page, setPage] = useState(1);  // 从 1 开始，而不是 0
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, [appStore.isFinished]);

  const fetchUserInfo = async (loadMore = false) => {
    if (isLoading || (!loadMore && !hasMore)) return;
    setIsLoading(true);
    try {
      const response = await appStore.getUserInfo(page, 10);
      if (response.success) {
        if (loadMore) {
          setUserInfo((prevInfo: UserInfo | null) => {
            if (!prevInfo) return response.data;
            return {
              ...prevInfo,
              interviews: [...prevInfo.interviews, ...response.data.interviews]
            };
          });
        } else {
          setUserInfo(response.data);
        }
        const pagination = response.data.pagination;
        setHasMore(pagination.currentPage < pagination.totalPages);
        setPage(pagination.currentPage + 1);
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

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prevPage => prevPage + 1);  // 增加页码
      fetchUserInfo(true);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setPage(1);  // 重置为 1，而不是 0
    setHasMore(true);
    fetchUserInfo().then(() => setRefreshing(false));
  }, []);

  const renderInterviewItem = ({ item, index }: { item: Interview; index: number }) => (
    <Card key={`interview-${item.id || index}`} style={styles.interviewCard}>
      <Card.Header
        title={
          <View style={styles.titleContainer}>
            <Fontisto name="file-1" size={16} color="#1890ff" style={styles.titleIcon}/>
            <Text style={styles.titleText}>{item.positionName}</Text>
          </View>
        }
        extra={item.state ? t('interviewInProgress') : t('interviewEnded')}
      />
      <Card.Body>
        <View style={styles.cardBody}>
          <View style={styles.infoItem}>
            <Text style={styles.dotIcon}>•</Text>
            <Text style={styles.infoText}>{t('interviewStartTime')} {new Date(item.startTime).toLocaleString()}</Text>
          </View>
          {item.endTime && (
            <View style={styles.infoItem}>
              <Text style={styles.dotIcon}>•</Text>
              <Text style={styles.infoText}>{t('interviewEndTime')} {new Date(item.endTime).toLocaleString()}</Text>
            </View>
          )}
          {item.duration && (
            <View style={styles.infoItem}>
              <Text style={styles.dotIcon}>•</Text>
              <Text style={styles.infoText}>{t('interviewDuration')} {item.duration} {t('minutes')}</Text>
            </View>
          )}
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
            <View style={styles.userInfoItem}>
              <Fontisto name="person" size={16} color="#1890ff" style={styles.titleIcon}/>
              <Text style={styles.username}>{t('user')}: {userInfo.username}</Text>
            </View>
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
          keyExtractor={(item, index) => `interview-${item.id || index}`}
          style={styles.interviewList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={() => (
            isLoading && !refreshing ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingText}>{t('loading')}</Text>
              </View>
            ) : null
          )}
          extraData={userInfo}
        />
      </View>
      {/* <Modal
        transparent
        visible={isLoading}
        animationType="fade"
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <ActivityIndicator size="large"/>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </Modal> */}
    </PageLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
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
    marginLeft: 10,
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
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  dotIcon: {
    fontSize: 16,
    color: '#1890ff',
    marginRight: 1,
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Main;
