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

    for await (const [key, value] of Object.entries(contacts)) {
      try {
        const transactionData = await getPolygonTransactionsFromCovalent(
          137,
          key,
          'eur'
        );

        transactionData.map(item => {
          if (item) {
            let from_nickname = 'unknown';
            let to_nickname = 'unknown';

            if (item.from_address === key) {
              from_nickname = value.nickname;
            } else if (item.to_address === key) {
              to_nickname = value.nickname;
            }

            const returnItem = {
              tx_hash: item.tx_hash,
              from_address: item.from_address,
              to_address: item.to_address,
              value: item.value,
              blockTimestamp: item.blockTimestamp,
              updatedAt: item.updatedAt,
              from_nickname,
              to_nickname,
            };

            transactions.push(returnItem);
          }
        });
      } catch (e) {
        console.log('Error: ', e);
      }
    }
    return transactions;
  }

  useEffect(() => {
    (async () => {
      const newTransactions = await getTransactions();
      setSocialTransactions(arr => [...arr, newTransactions]);
      console.log('effect2 ran');
    })();
  }, []);

  const testarr = ['testarr1', 'qsd'];
  const varr = 'varible test';

  function showTransactions() {
    const transactions = getTransactions();

    // if (transactions) {
    //   const trans = transactions[0];

    //   const tData = {
    //     address: 'random string',
    //     balance: { amount: trans.value, display: trans.value }, //not working
    //     contact: {
    //       address: '0x3304eb0db17cdf9fb876e728084dc959adddcc81',
    //       color: 12,
    //       network: 'mainnet',
    //       nickname: '🐷 Phone L',
    //     },
    //     dappName: undefined,
    //     data:
    //       '0xa9059cbb0000000000000000000000003304eb0db17cdf9fb876e728084dc959adddcc810000000000000000000000000000000000000000000000000000000000019a9e',
    //     description: 'USD Coin',
    //     from: trans.from_address,
    //     gasLimit: '1',
    //     gasPrice: 1,
    //     hash: trans.tx + '-0',
    //     minedAt: 1,
    //     name: 'USD Coin',
    //     native: { amount: '', display: '' },
    //     network: 'polygon',
    //     nonce: 43,
    //     pending: false,
    //     protocol: undefined,
    //     sourceAmount: undefined,
    //     status: 'sent',
    //     symbol: 'USDC',
    //     title: 'Sent',
    //     to: trans.to_address,
    //     transferId: undefined,
    //     txTo: '1',
    //     type: 'send',
    //     value: '0x00',
    //   };

    //   console.log('tdata', tData);
    // }
    return <Text> test</Text>;
  }
  function fprint() {
    console.log('009');
    console.log(socialTransactions);
    return 'test009';
  }

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

      {/* <View>
        {testarr.map(t => {
          <Text>{t} </Text>;
        })}

        {() => {
          <Text>asdasd</Text>;
        }}
      </View>

      <Text>
        {socialTransactions.map(t => {
          return t.value;
        })}
      </Text>

     

      {console.log('sociiial' + socialTransactions.map(t => {return t)})} */}

      <Text>{fprint()}</Text>

      {/* <Text>{JSON.stringify(socialTransactions)}</Text>

      <Text>
        {socialTransactions.map(t => {
          return t.tx_hash;
        })}
      </Text> */}

      <ActivityList
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
      />
    </SocialScreenPage>
  );
}
