import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { Text, View } from 'react-native';
import styled from 'styled-components';
import { ActivityList } from '../components/activity-list';
import { BackButton, Header, HeaderButton } from '../components/header';
import { Icon } from '../components/icons';
import { Page } from '../components/layout';
import { ProfileMasthead } from '../components/profile';
import TransactionList from '../components/transaction-list/TransactionList';
import { useTheme } from '../context/ThemeContext';
import useNativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';
import NetworkTypes from '../helpers/networkTypes';
import { useNavigation } from '../navigation/Navigation';
import {
  useAccountSettings,
  useAccountTransactions,
  useContacts,
  useRequests,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { getPolygonTransactionsFromCovalent } from '../redux/polygonExplorer';
import { hash } from 'react-native-fs';
import { toArray } from 'lodash';
import { address } from 'src/utils/abbreviations';
import { namehash } from 'ethers/lib/utils';
import { timeStamp } from 'console';
import {
  ContractInteractionCoinRow,
  RequestCoinRow,
  TransactionCoinRow,
} from '../components/coin-row';
import SocialList from '../components/coin-row/SocialList';
import { getTransactionNotes } from '../model/firebase';
import { func } from 'prop-types';
import store from '@rainbow-me/redux/store';

const ACTIVITY_LIST_INITIALIZATION_DELAY = 5000;

const SocialScreenPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

export default function SocialScreen({ navigation }) {
  const { colors } = useTheme();
  const [activityListInitialized, setActivityListInitialized] = useState(false);
  const isFocused = useIsFocused();
  const { navigate } = useNavigation();
  const nativeTransactionListAvailable = useNativeTransactionListAvailable();

  const accountTransactions = useAccountTransactions(
    activityListInitialized,
    isFocused
  );
  const {
    isLoadingTransactions: isLoading,
    sections,
    transactions,
    transactionsCount,
  } = accountTransactions;
  const { contacts } = useContacts();
  const { pendingRequestCount, requests } = useRequests();
  const { network } = useAccountSettings();
  const { accountAddress } = store.getState().settings;
  const isEmpty = !transactionsCount && !pendingRequestCount;

  const [socialTransactions, setSocialTransactions] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setActivityListInitialized(true);
    }, ACTIVITY_LIST_INITIALIZATION_DELAY);
  }, []);

  const onPressBackButton = useCallback(() => navigate(Routes.WALLET_SCREEN), [
    navigate,
  ]);

  const onPressSettings = useCallback(() => navigate(Routes.SETTINGS_MODAL), [
    navigate,
  ]);

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const addCashSupportedNetworks =
    (IS_DEV && network === NetworkTypes.kovan) ||
    network === NetworkTypes.mainnet;
  const addCashAvailable =
    IS_TESTING === 'true' ? false : addCashSupportedNetworks;

  async function getTransactions() {
    const transactions = [];
    const uniqueIds = [];

    for await (const [key, value] of Object.entries(contacts)) {
      try {
        const transactionData = await getPolygonTransactionsFromCovalent(
          137,
          key,
          'eur'
        );

        if (transactionData) {
          transactionData.map(item => {
            if (item) {
              let from_nickname = 'Unknown';
              let to_nickname = 'Unknown';

              const returnItem = {
                tx_hash: item.tx_hash,
                from_address: item.from_address,
                to_address: item.to_address,
                value: item.value,
                blockTimestamp: item.blockTimestamp,
                updatedAt: item.updatedAt,
                from_nickname: from_nickname,
                to_nickname: to_nickname,
              };

              if (!uniqueIds.includes(returnItem.tx_hash)) {
                transactions.push(returnItem);
                uniqueIds.push(returnItem.tx_hash);
              }
            }
          });
        }
      } catch (e) {
        console.log('Error: ', e);
      }
    }

    transactions.map(t => {
      for (const [key, value] of Object.entries(contacts)) {
        if (t.from_address === key) {
          t.from_nickname = value.nickname;
        }
        if (t.to_address === key) {
          t.to_nickname = value.nickname;
        }
      }
    });

    return transactions;
  }

  // const testdata = {
  //   address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  //   balance: { amount: '0.05379', display: '0.0538 USDC' },
  //   contact: {
  //     address: '0xff9f04827d1d698a9114f9eec6a38bf9d839602e',
  //     color: 1,
  //     network: 'mainnet',
  //     nickname: 'Kontakt12',
  //   },
  //   data:
  //     '0xa9059cbb000000000000000000000000ff9f04827d1d698a9114f9eec6a38bf9d839602e000000000000000000000000000000000000000000000000000000000000d21e',
  //   description: 'USD Coin',
  //   from: '0x6EAe616f37A3840160C82fb745F39F77207E5B6d',
  //   gasLimit: '59151',
  //   gasPrice: 53000000000,
  //   hash:
  //     '0x5b81dc954aa8fd43db69a4b8aaa0ff224b8a085ad15f49367a5f2cee919cd337-0',
  //   minedAt: 1654697206,
  //   name: 'USD Coin',
  //   native: { amount: '', display: '' },
  //   network: 'polygon',
  //   nonce: 42,
  //   pending: false,
  //   status: 'sent',
  //   symbol: 'USDC',
  //   title: 'Sent',
  //   to: '0xff9f04827D1D698A9114F9EEC6A38bf9D839602E',
  //   txTo: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  //   type: 'send',
  //   value: '0x00',
  // };

  useEffect(() => {
    (async () => {
      const newTransactions = await getTransactions();
      const transactionNotes = await getTransactionNotes();

      newTransactions.forEach(t => {
        if (t.from_address === accountAddress.toLowerCase()) {
          t.from_nickname = 'Me';
        } else if (t.to_address === accountAddress.toLowerCase()) {
          t.to_nickname = 'Me';
        }

        transactionNotes.forEach(n => {
          if (t.tx_hash === n.tx_hash) {
            t.note = n.note;
          }
        });
      });

      console.log('new transactions ts----------------');
      console.log(newTransactions);

      // const sortedTransactions = newTransactions.sort(function (a, b) {
      //   console.log('sooooorting ', b.blockTimestamp);
      //   return b.blockTimestamp - a.blockTimestamp;
      // });

      // console.log('sorted', sortedTransactions);

      setSocialTransactions(newTransactions);
    })();
  }, [contacts, accountAddress]);

  return (
    <SocialScreenPage testID="social-screen">
      <Header align="center" justify="flex-end">
        {/* <HeaderButton
          onPress={onPressSettings}
          opacityTouchable={false}
          radiusAndroid={42}
          radiusWrapperStyle={{
            alignItems: 'center',
            height: 42,
            justifyContent: 'center',
            marginLeft: 5,
            width: 42,
          }}
          testID="settings-button"
        >
          <Icon color={colors.black} name="gear" />
        </HeaderButton> */}
        <BackButton
          color={colors.black}
          direction="right"
          onPress={onPressBackButton}
        />
      </Header>
      <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>
        SOCIAL WALLET
      </Text>

      <ProfileMasthead onChangeWallet={onChangeWallet} />

      <SocialList socialTransactions={socialTransactions} />

      {/* <ActivityList
        addCashAvailable={false}
        header={
          <ProfileMasthead
            addCashAvailable={addCashAvailable}
            onChangeWallet={onChangeWallet}
          />
        }
        isEmpty={isEmpty}
        isLoading={isLoading}
        navigation={navigation}
        network={network}
        recyclerListView={ios}
        sections={sections}
        {...accountTransactions}
      /> */}
    </SocialScreenPage>
  );
}
