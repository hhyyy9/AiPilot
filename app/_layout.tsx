import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from '@ant-design/react-native';
import Register from "./Register";
import Login from "./Login";
import PageOne from "./PageOne";
import PageTwo from "./PageTwo";
import PageThree from "./PageThree";
import PageFour from "./PageFour";
import Main from "./Main";
import * as RNLocalize from 'react-native-localize';
import I18n from "./i18n";
import 'intl-pluralrules';

const Stack = createNativeStackNavigator();

export default function App() {  

  useEffect(() => {
    const locales = RNLocalize.getLocales();
    const systemLanguage = locales[0]?.languageCode;  // 用户系统偏好语言
     
    if (systemLanguage) {
      I18n.changeLanguage(systemLanguage);
    } else {
      I18n.changeLanguage('en');  // 默认语言为英文  
    }
  }, []);

  return (
    <Provider>
      <NavigationContainer independent={true}>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={Main} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="PageOne" component={PageOne} />
          <Stack.Screen name="PageTwo" component={PageTwo} />
          <Stack.Screen name="PageThree" component={PageThree} />
          <Stack.Screen name="PageFour" component={PageFour} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
