import { createTheme } from '@rneui/themed';

export const theme = createTheme({
  lightColors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#F2F2F7',
    white: '#FFFFFF',
    black: '#000000',
    grey0: '#8E8E93',
    grey1: '#C7C7CC',
    grey2: '#D1D1D6',
    grey3: '#E5E5EA',
    grey4: '#F2F2F7',
    grey5: '#F9F9F9',
    greyOutline: '#C7C7CC',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    divider: '#C6C6C8',
  },
  darkColors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    white: '#FFFFFF',
    black: '#000000',
    grey0: '#8E8E93',
    grey1: '#636366',
    grey2: '#48484A',
    grey3: '#3A3A3C',
    grey4: '#2C2C2E',
    grey5: '#1C1C1E',
    greyOutline: '#3A3A3C',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    divider: '#38383A',
  },
  mode: 'light',
  components: {
    Button: {
      raised: true,
      buttonStyle: {
        borderRadius: 10,
      },
    },
    Input: {
      inputContainerStyle: {
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 10,
      },
    },
    Card: {
      containerStyle: {
        borderRadius: 10,
      },
    },
    Text: {
      h1Style: {
        fontWeight: 'bold',
        fontSize: 34,
      },
      h2Style: {
        fontWeight: 'bold',
        fontSize: 28,
      },
      h3Style: {
        fontWeight: 'bold',
        fontSize: 22,
      },
      h4Style: {
        fontWeight: 'bold',
        fontSize: 20,
      },
    },
    Icon: {
      type: 'ionicon',
    },
  },
});
