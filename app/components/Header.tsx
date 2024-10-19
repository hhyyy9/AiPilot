import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Fontisto from '@expo/vector-icons/Fontisto';

interface HeaderProps {
  title: string;
  menuType: number;
  onMenuPress: () => void;
  onBackPress: () => void;
  isShowBackButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, menuType ,onMenuPress, isShowBackButton = false, onBackPress }) => {
  return (
    <View style={styles.header}>
      {isShowBackButton && (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
      { menuType == 0 ?
        <Ionicons name="settings" size={24} color="#007AFF" />
        : <Fontisto name="arrow-return-left" size={24} color="#007AFF" />
      }
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
  menuButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  backButton: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
});

export default Header;

