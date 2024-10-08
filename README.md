# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.



/Users/jackyhuang/Projects/WebProjects/AiPilot/node_modules/react-native-screens/RNScreens.podspec 
  # s.project_header_files = "cpp/**/*.h" # Don't expose C++ headers publicly to allow importing framework into Swift files
  s.private_header_files = "cpp/**/*.h"

/Users/jackyhuang/Projects/WebProjects/AiPilot/node_modules/react-native/ReactCommon/yoga/Yoga.podspec
  #spec.version = '0.0.0'
  spec.version = '1.40.0'

/Users/jackyhuang/Projects/WebProjects/AiPilot/node_modules/react-native/sdks/hermes-engine/hermes-engine.podspec
  ss.visionos.vendored_frameworks = "destroot/Library/Frameworks/universal/hermes.xcframework"
  #ss.visionos.vendored_frameworks = "destroot/Library/Frameworks/universal/hermes.xcframework"



https://docs.expo.dev/develop/development-builds/create-a-build/

https://github.com/jamsch/expo-speech-recognition?tab=readme-ov-file


eas build --profile development --platform android



npx expo-cli clean

rm -rf node_modules
npm install

cd ios
pod deintegrate
pod install
cd ..

npx expo run:ios


cd android
./gradlew clean
cd ..


npx expo run:android

npx expo-doctor