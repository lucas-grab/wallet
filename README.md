## Setup

### General

- Install NVM or Node.js 14: https://github.com/creationix/nvm
- Install all project dependencies with `yarn setup`

### MacOS

1. Install the [latest version of XCode](https://developer.apple.com/xcode/).

2. Install Watchman:

   ```shell
   brew install watchman
   ```

3. Install CocoaPods:

   ```shell
   sudo gem install cocoapods
   ```

4. Install the required bundles and Pods for this project:
   ```shell
   yarn install-bundle && yarn install-pods
   ```

### Linux

1. Install system dependencies:

   ```shell
   sudo apt install libsecret-tools watchman
   ```

2. Follow the [React Native environment setup
   instructions](https://reactnative.dev/docs/environment-setup) carefully,
   which will involve installing Android Studio, the Android SDK, the emulator,
   etc. and making them available in your `$PATH`.

3. Ensure at least one [AVD
   image](https://developer.android.com/studio/run/managing-avds) is available
   for the emulator (unless using a physical device).

### Preflight

1. Run `nvm use 14` to force Node.js v14.

2. Set up your .env file, use our env.example as a guide.

   **_Note that some features are currently not accessible, we are working with the Data Providers in order to provide open source API Keys!_**

   Here are some resources to generate your own API keys:

   - Etherscan: https://etherscan.io/apis
   - Infura: https://infura.io/

3. Ensure a `google-services.json` has been added to the relevant project
   directory/directories so the compile will not fail.

   This can be a self-provided config for a personal Firebase project registered under the package name `me.rainbow`.

### MacOS

_Note: Darwin versions of the application can only be developed/built on Darwin
platforms with XCode._

1. Start a React Native webserver with:

   ```shell
   yarn start
   ```

2. Open `rainbow-wallet/ios/Rainbow.xcworkspace` in XCode.

3. Run the project by clicking the play button.

### Linux

_Note: Linux development environments cannot develop or build Darwin versions of the
project._

1. Start a React Native webserver with:

   ```shell
   yarn start
   ```

2. Build/install/start the debug version of the app in an emulator with:
   ```shell
   yarn android
   ```
