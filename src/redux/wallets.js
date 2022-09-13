import { toChecksumAddress } from 'ethereumjs-util';
import { filter, flatMap, get, isEmpty, keys, map, values } from 'lodash';
import { backupUserDataIntoCloud } from '../handlers/cloudBackup';
import { saveKeychainIntegrityState } from '../handlers/localstorage/globalSettings';
import {
  getWalletNames,
  saveWalletNames,
} from '../handlers/localstorage/walletNames';
import { web3Provider } from '../handlers/web3';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';
import { hasKey } from '../model/keychain';
import { PreferenceActionType, setPreference } from '../model/preferences';
import {
  generateAccount,
  getAllWallets,
  getSelectedWallet,
  loadAddress,
  oldSeedPhraseMigratedKey,
  saveAddress,
  saveAllWallets,
  setSelectedWallet,
} from '../model/wallet';
import { settingsUpdateAccountAddress } from '../redux/settings';
import { logger } from '../utils';
import {
  addressKey,
  privateKeyKey,
  seedPhraseKey,
} from '../utils/keychainConstants';
import { addressHashedColorIndex } from '../utils/profileUtils';
import { updateWebDataEnabled } from './showcaseTokens';
import { lightModeThemeColors } from '@rainbow-me/styles';

// -- Constants --------------------------------------- //
const WALLETS_ADDED_ACCOUNT = 'wallets/WALLETS_ADDED_ACCOUNT';
const WALLETS_LOAD = 'wallets/ALL_WALLETS_LOAD';
const WALLETS_UPDATE = 'wallets/ALL_WALLETS_UPDATE';
const WALLETS_UPDATE_NAMES = 'wallets/WALLETS_UPDATE_NAMES';
const WALLETS_SET_IS_LOADING = 'wallets/WALLETS_SET_IS_LOADING';
const WALLETS_SET_SELECTED = 'wallets/SET_SELECTED';

// -- Actions ---------------------------------------- //
export const walletsLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress } = getState().settings;
    let addressFromKeychain = accountAddress;
    const allWalletsResult = await getAllWallets();
    const wallets = allWalletsResult?.wallets || {};
    if (isEmpty(wallets)) return;
    const selected = await getSelectedWallet();
    // Prevent irrecoverable state (no selected wallet)
    let selectedWallet = get(selected, 'wallet', undefined);
    // Check if the selected wallet is among all the wallets
    if (selectedWallet && !wallets[selectedWallet.id]) {
      // If not then we should clear it and default to the first one
      const firstWalletKey = Object.keys(wallets)[0];
      selectedWallet = wallets[firstWalletKey];
      await setSelectedWallet(selectedWallet);
    }

    if (!selectedWallet) {
      const address = await loadAddress();
      keys(wallets).some(key => {
        const someWallet = wallets[key];
        const found = someWallet.addresses.some(account => {
          return (
            toChecksumAddress(account.address) === toChecksumAddress(address)
          );
        });
        if (found) {
          selectedWallet = someWallet;
        }
        return found;
      });
    }

    // Recover from broken state (account address not in selected wallet)
    if (!addressFromKeychain) {
      addressFromKeychain = await loadAddress();
    }

    const selectedAddress = selectedWallet.addresses.find(a => {
      return a.visible && a.address === addressFromKeychain;
    });

    if (!selectedAddress) {
      const account = selectedWallet.addresses.find(a => a.visible);
      await dispatch(settingsUpdateAccountAddress(account.address));
      await saveAddress(account.address);
    }

    const walletNames = await getWalletNames();

    dispatch({
      payload: {
        selected: selectedWallet,
        walletNames,
        wallets,
      },
      type: WALLETS_LOAD,
    });

    dispatch(fetchWalletNames());
    return wallets;
  } catch (error) {}
};

export const walletsUpdate = wallets => async dispatch => {
  await saveAllWallets(wallets);
  dispatch({
    payload: wallets,
    type: WALLETS_UPDATE,
  });
};

export const walletsSetSelected = wallet => async dispatch => {
  await setSelectedWallet(wallet);
  dispatch({
    payload: wallet,
    type: WALLETS_SET_SELECTED,
  });
};

export const setIsWalletLoading = val => dispatch => {
  dispatch({
    payload: val,
    type: WALLETS_SET_IS_LOADING,
  });
};

export const setWalletBackedUp = (
  walletId,
  method,
  backupFile = null
) => async (dispatch, getState) => {
  const { wallets, selected } = getState().wallets;
  const newWallets = { ...wallets };
  newWallets[walletId] = {
    ...newWallets[walletId],
    backedUp: true,
    backupDate: Date.now(),
    backupFile,
    backupType: method,
  };

  await dispatch(walletsUpdate(newWallets));
  if (selected.id === walletId) {
    await dispatch(walletsSetSelected(newWallets[walletId]));
  }

  // Reset the loading state 1 second later
  setTimeout(() => {
    dispatch(setIsWalletLoading(null));
  }, 1000);

  if (method === WalletBackupTypes.cloud) {
    try {
      await backupUserDataIntoCloud({ wallets: newWallets });
    } catch (e) {
      throw e;
    }
  }
};

export const addressSetSelected = address => () => saveAddress(address);

export const createAccountForWallet = (id, color, name) => async (
  dispatch,
  getState
) => {
  const { wallets } = getState().wallets;
  const newWallets = { ...wallets };
  let index = 0;
  newWallets[id].addresses.forEach(
    account => (index = Math.max(index, account.index))
  );
  const newIndex = index + 1;
  const account = await generateAccount(id, newIndex);
  const walletColorIndex =
    color !== null ? color : addressHashedColorIndex(account.address);
  newWallets[id].addresses.push({
    address: account.address,
    avatar: null,
    color: walletColorIndex,
    index: newIndex,
    label: name,
    visible: true,
  });

  setPreference(PreferenceActionType.init, 'profile', account.address, {
    accountColor: lightModeThemeColors.avatarBackgrounds[walletColorIndex],
  });

  await dispatch(updateWebDataEnabled(true, account.address));
  // Save all the wallets
  saveAllWallets(newWallets);
  // Set the address selected (KEYCHAIN)
  await saveAddress(account.address);
  // Set the wallet selected (KEYCHAIN)
  await setSelectedWallet(newWallets[id]);

  dispatch({
    payload: { selected: newWallets[id], wallets: newWallets },
    type: WALLETS_ADDED_ACCOUNT,
  });

  return newWallets;
};

export const fetchWalletNames = () => async (dispatch, getState) => {
  const { wallets } = getState().wallets;
  const updatedWalletNames = {};

  // Fetch ENS names
  await Promise.all(
    flatMap(values(wallets), wallet => {
      const visibleAccounts = filter(wallet.addresses, 'visible');
      return map(visibleAccounts, async account => {
        try {
          const ens = await web3Provider.lookupAddress(account.address);
          if (ens && ens !== account.address) {
            updatedWalletNames[account.address] = ens;
          }
          // eslint-disable-next-line no-empty
        } catch (error) {}
        return account;
      });
    })
  );

  dispatch({
    payload: updatedWalletNames,
    type: WALLETS_UPDATE_NAMES,
  });
  saveWalletNames(updatedWalletNames);
};

export const checkKeychainIntegrity = () => async (dispatch, getState) => {
  try {
    let healthyKeychain = true;

    const hasAddress = await hasKey(addressKey);
    if (hasAddress) {
    } else {
      healthyKeychain = false;
    }

    const hasOldSeedPhraseMigratedFlag = await hasKey(oldSeedPhraseMigratedKey);
    if (hasOldSeedPhraseMigratedFlag) {
    } else {
    }

    const hasOldSeedphrase = await hasKey(seedPhraseKey);
    if (hasOldSeedphrase) {
    } else {
    }

    const { wallets, selected } = getState().wallets;
    if (!wallets) {
    }

    if (!selected) {
    }

    const nonReadOnlyWalletKeys = keys(wallets).filter(
      key => wallets[key].type !== WalletTypes.readOnly
    );

    for (const key of nonReadOnlyWalletKeys) {
      let healthyWallet = true;

      const wallet = wallets[key];

      const seedKeyFound = await hasKey(`${key}_${seedPhraseKey}`);
      if (!seedKeyFound) {
        healthyWallet = false;
      } else {
      }

      for (const account of wallet.addresses) {
        const pkeyFound = await hasKey(`${account.address}_${privateKeyKey}`);
        if (!pkeyFound) {
          healthyWallet = false;
        } else {
        }
      }

      // Handle race condition:
      // A wallet is NOT damaged if:
      // - it's not imported
      // - and hasn't been migrated yet
      // - and the old seedphrase is still there
      if (
        !wallet.imported &&
        !hasOldSeedPhraseMigratedFlag &&
        hasOldSeedphrase
      ) {
        healthyWallet = true;
      }

      if (!healthyWallet) {
        healthyKeychain = false;
        wallet.damaged = true;
        await dispatch(walletsUpdate(wallets));
        // Update selected wallet if needed
        if (wallet.id === selected.id) {
          await dispatch(walletsSetSelected(wallets[wallet.id]));
        }
      }
    }
    if (!healthyKeychain) {
    }

    await saveKeychainIntegrityState('done');
  } catch (e) {}
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  isWalletLoading: null,
  selected: undefined,
  walletNames: {},
  wallets: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETS_SET_IS_LOADING:
      return { ...state, isWalletLoading: action.payload };
    case WALLETS_SET_SELECTED:
      return { ...state, selected: action.payload };
    case WALLETS_UPDATE:
      return { ...state, wallets: action.payload };
    case WALLETS_UPDATE_NAMES:
      return { ...state, walletNames: action.payload };
    case WALLETS_LOAD:
      return {
        ...state,
        selected: action.payload.selected,
        walletNames: action.payload.walletNames,
        wallets: action.payload.wallets,
      };
    case WALLETS_ADDED_ACCOUNT:
      return {
        ...state,
        selected: action.payload.selected,
        wallets: action.payload.wallets,
      };
    default:
      return state;
  }
};
