import AsyncStorage from '@react-native-community/async-storage';

import { findKey, isNumber, keys, uniq } from 'lodash';
import { removeLocal } from '../handlers/localstorage/common';
import { IMAGE_METADATA } from '../handlers/localstorage/globalSettings';
import {
  getMigrationVersion,
  setMigrationVersion,
} from '../handlers/localstorage/migrations';
import WalletTypes from '../helpers/walletTypes';
import {
  DEFAULT_WALLET_NAME,
  loadAddress,
  oldSeedPhraseMigratedKey,
  saveAddress,
  seedPhraseKey,
} from '../model/wallet';
import store from '../redux/store';

import { walletsSetSelected, walletsUpdate } from '../redux/wallets';
import colors, { getRandomColor } from '../styles/colors';
import { hasKey } from './keychain';
import { isL2Asset } from '@rainbow-me/handlers/assets';
import {
  getAssets,
  getHiddenCoins,
  getPinnedCoins,
  saveHiddenCoins,
  savePinnedCoins,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import {
  getContacts,
  saveContacts,
} from '@rainbow-me/handlers/localstorage/contacts';
import {
  getUserLists,
  saveUserLists,
} from '@rainbow-me/handlers/localstorage/userLists';
import { resolveNameOrAddress } from '@rainbow-me/handlers/web3';
import { returnStringFirstEmoji } from '@rainbow-me/helpers/emojiHandler';
import { updateWebDataEnabled } from '@rainbow-me/redux/showcaseTokens';
import { DefaultTokenLists } from '@rainbow-me/references';
import { ethereumUtils, profileUtils } from '@rainbow-me/utils';
import { REVIEW_ASKED_KEY } from '@rainbow-me/utils/reviewAlert';
import logger from 'logger';

export default async function runMigrations() {
  // get current version
  const currentVersion = Number(await getMigrationVersion());
  const migrations = [];

  /*
   *************** Migration v0 ******************
   * This step rewrites public keys to the keychain
   * using the updated Keychain settings (THIS_DEVICE_ONLY)
   */
  const v0 = async () => {
    const walletAddress = await loadAddress();
    if (walletAddress) {
      await saveAddress(walletAddress);
    }
  };

  migrations.push(v0);

  /*
   *************** Migration v1 ******************
   * This step handles the migration to multiwallet
   * adding backwards compatibility for single wallets
   * that were created / imported before we launched this feature
   */
  const v1 = async () => {
    const { selected } = store.getState().wallets;

    if (!selected) {
      // Read from the old wallet data
      const address = await loadAddress();
      if (address) {
        const id = `wallet_${Date.now()}`;
        const currentWallet = {
          addresses: [
            {
              address,
              avatar: null,
              color: getRandomColor(),
              index: 0,
              label: '',
              visible: true,
            },
          ],
          color: 0,
          id,
          imported: false,
          name: DEFAULT_WALLET_NAME,
          primary: true,
          type: WalletTypes.mnemonic,
        };

        const wallets = { [id]: currentWallet };

        await store.dispatch(walletsUpdate(wallets));
        await store.dispatch(walletsSetSelected(currentWallet));
      }
    }
  };

  migrations.push(v1);

  /*
   *************** Migration v2 ******************
   * This step handles the addition of "primary wallets"
   * which are the only wallets allowed to create new accounts under it
   */
  const v2 = async () => {
    const { wallets, selected } = store.getState().wallets;

    if (!wallets) {
      return;
    }

    // Check if we have a primary wallet
    const primaryWallet = findKey(wallets, ['primary', true]);

    // If there's no primary wallet, we need to find
    // if there's a wallet with seed phrase that wasn't imported
    // and set it as primary
    if (!primaryWallet) {
      let primaryWalletKey = null;
      Object.keys(wallets).some(key => {
        const wallet = wallets[key];
        if (wallet.type === WalletTypes.mnemonic && !wallet.imported) {
          primaryWalletKey = key;
          return true;
        }
        return false;
      });

      // If there's no wallet with seed phrase that wasn't imported
      // let's find a wallet with seed phrase that was imported
      if (!primaryWalletKey) {
        Object.keys(wallets).some(key => {
          const wallet = wallets[key];
          if (wallet.type === WalletTypes.mnemonic) {
            primaryWalletKey = key;
            return true;
          }
          return false;
        });
      }

      if (primaryWalletKey) {
        const updatedWallets = { ...wallets };
        updatedWallets[primaryWalletKey] = {
          ...updatedWallets[primaryWalletKey],
          primary: true,
        };

        await store.dispatch(walletsUpdate(updatedWallets));
        // Additionally, we need to check if it's the selected wallet
        // and if that's the case, update it too
        if (selected.id === primaryWalletKey) {
          const updatedSelectedWallet = updatedWallets[primaryWalletKey];
          await store.dispatch(walletsSetSelected(updatedSelectedWallet));
        }
      }
    }
  };

  migrations.push(v2);

  /*
   *************** Migration v3 ******************
   * Not in use
   */

  const v3 = async () => {
    return true;
  };

  migrations.push(v3);

  /*
   *************** Migration v4 ******************
   * Not in use
   */

  const v4 = async () => {
    return true;
  };

  migrations.push(v4);

  /*
   *************** Migration v5 ******************
   * This step makes sure there are no wallets marked as damaged
   * incorrectly by the keychain integrity checks
   */
  const v5 = async () => {
    const { wallets, selected } = store.getState().wallets;

    if (!wallets) {
      return;
    }

    const hasMigratedFlag = await hasKey(oldSeedPhraseMigratedKey);
    if (!hasMigratedFlag) {
      const hasOldSeedphraseKey = await hasKey(seedPhraseKey);
      if (hasOldSeedphraseKey) {
        let incorrectDamagedWalletId = null;
        const updatedWallets = { ...wallets };
        keys(updatedWallets).forEach(walletId => {
          if (
            updatedWallets[walletId].damaged &&
            !updatedWallets[walletId].imported
          ) {
            delete updatedWallets[walletId].damaged;
            incorrectDamagedWalletId = walletId;
          }
        });

        await store.dispatch(walletsUpdate(updatedWallets));

        // Additionally, we need to check if it's the selected wallet
        // and if that's the case, update it too
        if (selected.id === incorrectDamagedWalletId) {
          const updatedSelectedWallet =
            updatedWallets[incorrectDamagedWalletId];
          await store.dispatch(walletsSetSelected(updatedSelectedWallet));
        }
      }
    }
  };

  migrations.push(v5);

  /* Fix dollars => stablecoins */
  const v6 = async () => {
    try {
      const userLists = await getUserLists();
      const newLists = userLists.map(list => {
        if (list?.id !== 'dollars') {
          return list;
        }
        return DefaultTokenLists['mainnet'].find(
          ({ id }) => id === 'stablecoins'
        );
      });
      await saveUserLists(newLists);
    } catch (e) {
      logger.log('ignoring lists migrations');
    }
  };

  migrations.push(v6);

  /* Turning ON web data for all accounts */
  const v7 = async () => {
    const { wallets } = store.getState().wallets;
    if (!wallets) return;
    const walletKeys = Object.keys(wallets);
    for (let i = 0; i < walletKeys.length; i++) {
      const wallet = wallets[walletKeys[i]];
      if (wallet.type !== WalletTypes.readOnly) {
        for (let x = 0; x < wallet.addresses.length; x++) {
          const { address } = wallet.addresses[x];
          logger.log('setting web profiles for address', address);
          await store.dispatch(updateWebDataEnabled(true, address));
        }
      }
    }
  };

  migrations.push(v7);

  const v8 = async () => {
    logger.log('wiping old metadata');
    await removeLocal(IMAGE_METADATA);
  };

  migrations.push(v8);

  /*
   *************** Migration v9 ******************
   * This step makes sure all wallets' color property (index)
   * are updated to point to the new webProfile colors. Do the
   * same for contacts
   */
  const v9 = async () => {
    logger.log('Start migration v9');
    // map from old color index to closest new color's index
    const newColorIndexes = [0, 4, 12, 21, 1, 20, 4, 9, 10];
    try {
      const { selected, wallets } = store.getState().wallets;
      if (!wallets) return;
      const walletKeys = Object.keys(wallets);
      let updatedWallets = { ...wallets };
      for (let i = 0; i < walletKeys.length; i++) {
        const wallet = wallets[walletKeys[i]];
        const newAddresses = wallet.addresses.map(account => {
          const accountEmoji = returnStringFirstEmoji(account?.label);
          return {
            ...account,
            ...(!accountEmoji && {
              label: `${profileUtils.addressHashedEmoji(account.address)} ${
                account.label
              }`,
            }),
            color:
              (accountEmoji
                ? newColorIndexes[account.color]
                : profileUtils.addressHashedColorIndex(account.address)) || 0,
          };
        });
        const newWallet = { ...wallet, addresses: newAddresses };
        updatedWallets[walletKeys[i]] = newWallet;
      }
      logger.log('update wallets in store to index new colors');
      await store.dispatch(walletsUpdate(updatedWallets));

      const selectedWalletId = selected?.id;
      if (selectedWalletId) {
        logger.log('update selected wallet to index new color');
        await store.dispatch(
          walletsSetSelected(updatedWallets[selectedWalletId])
        );
      }

      // migrate contacts to new color index
      const contacts = await getContacts();
      let updatedContacts = { ...contacts };
      if (!contacts) return;
      const contactKeys = Object.keys(contacts);
      for (let j = 0; j < contactKeys.length; j++) {
        const contact = contacts[contactKeys[j]];
        updatedContacts[contactKeys[j]] = {
          ...contact,
          color: isNumber(contact.color)
            ? newColorIndexes[contact.color]
            : typeof contact.color === 'string' &&
              colors.avatarBackgrounds.includes(contact.color)
            ? colors.avatarBackgrounds.indexOf(contact.color)
            : getRandomColor(),
        };
      }
      logger.log('update contacts to index new colors');
      await saveContacts(updatedContacts);
    } catch (error) {
      const migrationError = new Error('Migration 9 failed');
    }
  };

  migrations.push(v9);

  /*
   *************** Migration v10 ******************
   * This step makes sure all contacts have an emoji set based on the address
   */
  const v10 = async () => {
    logger.log('Start migration v10');
    try {
      // migrate contacts to corresponding emoji
      const contacts = await getContacts();
      let updatedContacts = { ...contacts };
      if (!contacts) return;
      const contactKeys = Object.keys(contacts);
      for (let j = 0; j < contactKeys.length; j++) {
        const contact = contacts[contactKeys[j]];
        let nickname = contact.nickname;
        if (!returnStringFirstEmoji(nickname)) {
          let address = null;
          try {
            address = await resolveNameOrAddress(contact.address);
          } catch (error) {
            const migrationError = new Error(
              `Error during v10 migration contact address resolution for ${contact.address}`
            );

            continue;
          }
          const emoji = profileUtils.addressHashedEmoji(address);
          const color = profileUtils.addressHashedColorIndex(address);
          nickname = `${emoji} ${nickname}`;
          updatedContacts[contactKeys[j]] = {
            ...contact,
            color,
            nickname,
          };
        }
      }
      logger.log('update contacts to add emojis / colors');
      await saveContacts(updatedContacts);
    } catch (error) {
      const migrationError = new Error('Migration 10 failed');
    }
  };

  migrations.push(v10);

  /*
   *************** Migration v11 ******************
   * This step resets review timers if we havnt asked in the last 2 weeks prior to running this
   */
  const v11 = async () => {
    logger.log('Start migration v11');
    const reviewAsked = await AsyncStorage.getItem(REVIEW_ASKED_KEY);
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
    const TWO_MONTHS = 2 * 30 * 24 * 60 * 60 * 1000;

    if (Number(reviewAsked) > Date.now() - TWO_WEEKS) {
      return;
    } else {
      const twoMonthsAgo = Date.now() - TWO_MONTHS;
      AsyncStorage.setItem(REVIEW_ASKED_KEY, twoMonthsAgo.toString());
    }
  };

  migrations.push(v11);

  /*
   *************** Migration v12 ******************
   * Migrates the hidden and pinned l2 assets to new format
   */
  const v12 = async () => {
    const { network } = store.getState().settings;
    const { wallets } = store.getState().wallets;
    if (!wallets) return;
    const walletKeys = Object.keys(wallets);
    for (let i = 0; i < walletKeys.length; i++) {
      const wallet = wallets[walletKeys[i]];
      for (let x = 0; x < wallet.addresses.length; x++) {
        const { address } = wallet.addresses[x];
        const assets = await getAssets(address, network);
        const hiddenCoins = await getHiddenCoins(address, network);
        const pinnedCoins = await getPinnedCoins(address, network);
        logger.log(JSON.stringify({ pinnedCoins }, null, 2));
        logger.log(JSON.stringify({ hiddenCoins }, null, 2));

        const pinnedCoinsMigrated = pinnedCoins.map(address => {
          const asset = ethereumUtils.getAsset(assets, address);
          if (asset?.type && isL2Asset(asset.type)) {
            return `${asset.address}_${asset.network}`;
          } else {
            return address;
          }
        });

        const hiddenCoinsMigrated = hiddenCoins.map(address => {
          const asset = ethereumUtils.getAsset(assets, address);
          if (asset?.type && isL2Asset(asset.type)) {
            return `${asset.address}_${asset.network}`;
          } else {
            return address;
          }
        });

        logger.log(JSON.stringify({ pinnedCoinsMigrated }, null, 2));
        logger.log(JSON.stringify({ hiddenCoinsMigrated }, null, 2));

        await savePinnedCoins(uniq(pinnedCoinsMigrated), address, network);
        await saveHiddenCoins(uniq(hiddenCoinsMigrated), address, network);
      }
    }
  };

  migrations.push(v12);

  if (migrations.length === currentVersion) {
    return;
  }

  for (let i = currentVersion; i < migrations.length; i++) {
    await migrations[i].apply(null);

    await setMigrationVersion(i + 1);
  }
}
