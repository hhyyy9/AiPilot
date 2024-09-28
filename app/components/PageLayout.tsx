import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';

type PageLayoutProps = {
  children: React.ReactNode;
  footer: React.ReactNode;
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, footer }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{children}</View>
      <View style={styles.footer}>{footer}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default PageLayout;