import { isNil } from 'lodash';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import runMigrations from '../model/migrations';
import { walletInit } from '../model/wallet';
import { appStateUpdate } from '../redux/appState';
import {
  settingsLoadNetwork,
  settingsUpdateAccountAddress,
} from '../redux/settings';
import { uniswapGetAllExchanges, uniswapPairsInit } from '../redux/uniswap';
import { walletsLoadState } from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import useHideSplashScreen from './useHideSplashScreen';
import useInitializeAccountData from './useInitializeAccountData';
import useInitializeDiscoverData from './useInitializeDiscoverData';
import useLoadAccountData from './useLoadAccountData';
import useLoadGlobalData from './useLoadGlobalData';
import useResetAccountState from './useResetAccountState';
import { runKeychainIntegrityChecks } from '@rainbow-me/handlers/walletReadyEvents';
import { additionalDataCoingeckoIds } from '@rainbow-me/redux/additionalAssetsData';
import { checkPendingTransactionsOnInitialize } from '@rainbow-me/redux/data';
import logger from 'logger';

export default function useInitializeWallet() {
  const dispatch = useDispatch();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const loadGlobalData = useLoadGlobalData();
  const initializeAccountData = useInitializeAccountData();
  const initializeDiscoverData = useInitializeDiscoverData();

  const { network } = useAccountSettings();
  const hideSplashScreen = useHideSplashScreen();

  const initializeWallet = useCallback(
    async (
      seedPhrase,
      color = null,
      name = null,
      shouldRunMigrations = false,
      overwrite = false,
      checkedWallet = null,
      switching
    ) => {
      try {
        await resetAccountState();

        const isImporting = !!seedPhrase;

        if (shouldRunMigrations && !seedPhrase) {
          await dispatch(walletsLoadState());

          await runMigrations();
        }

        // Load the network first
        await dispatch(settingsLoadNetwork());

        const { isNew, walletAddress } = await walletInit(
          seedPhrase,
          color,
          name,
          overwrite,
          checkedWallet,
          network
        );

        if (!switching) {
          // Run keychain integrity checks right after walletInit
          // Except when switching wallets!
          await runKeychainIntegrityChecks();
        }

        if (seedPhrase || isNew) {
          await dispatch(walletsLoadState());
        }

        if (isNil(walletAddress)) {
          Alert.alert(
            'Import failed due to an invalid private key. Please try again.'
          );
          if (!isImporting) {
            dispatch(appStateUpdate({ walletReady: true }));
          }
          return null;
        }

        if (!(isNew || isImporting)) {
          await loadGlobalData();
        }

        await dispatch(settingsUpdateAccountAddress(walletAddress));

        // Newly created / imported accounts have no data in localstorage
        if (!(isNew || isImporting)) {
          await loadAccountData(network);
        }

        hideSplashScreen();

        initializeAccountData();

        if (!isImporting) {
          dispatch(appStateUpdate({ walletReady: true }));
        }

        if (!switching) {
          dispatch(uniswapPairsInit());
          dispatch(uniswapGetAllExchanges());
          initializeDiscoverData();
          dispatch(additionalDataCoingeckoIds);
        }

        dispatch(checkPendingTransactionsOnInitialize(walletAddress));
        return walletAddress;
      } catch (error) {
        // TODO specify error states more granular
        if (!switching) {
          await runKeychainIntegrityChecks();
        }
        hideSplashScreen();

        Alert.alert('Something went wrong while importing. Please try again!');
        dispatch(appStateUpdate({ walletReady: true }));
        return null;
      }
    },
    [
      dispatch,
      hideSplashScreen,
      initializeAccountData,
      initializeDiscoverData,
      loadAccountData,
      loadGlobalData,
      network,
      resetAccountState,
    ]
  );

  return initializeWallet;
}
