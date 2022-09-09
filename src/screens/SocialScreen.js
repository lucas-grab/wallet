import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { Text, View } from 'react-native';
import styled from 'styled-components';
import { ActivityList } from '../components/activity-list';
import { BackButton, Header, HeaderButton } from '../components/header';
import { Icon } from '../components/icons';
import { Page, Column, Row, RowWithMargins } from '../components/layout';
import { ProfileMasthead, AvatarCircle } from '../components/profile';
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
  useDimensions,
  useAccountProfile,
  useOnAvatarPress,
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
import { TruncatedText } from '../components/text';
import Divider from '../components/Divider';
import { abbreviations } from '@rainbow-me/utils';
import ActivityListEmptyState from '../components/activity-list/ActivityListEmptyState';
import ProfileAction from '../components/profile/ProfileAction';
import { color } from 'react-native-reanimated';

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
  const { width: deviceWidth } = useDimensions();
  const headerText = 'Center feed';
  var showFeed = false;

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

  const {
    accountColor,
    accountSymbol,
    accountName,
    accountImage,
  } = useAccountProfile();

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

  useEffect(() => {
    (async () => {
      const newTransactions = await getTransactions();
      const transactionNotes = await getTransactionNotes();

      newTransactions.forEach(t => {
        transactionNotes.forEach(n => {
          if (t.tx_hash === n.tx_hash) {
            t.note = n.note;
          }
        });
      });

      const sortedTransactions = newTransactions.sort(function (a, b) {
        return new Date(b.blockTimestamp) - new Date(a.blockTimestamp);
      });

      setSocialTransactions(sortedTransactions);
    })();
  }, [contacts, accountAddress]);

  useEffect(() => {
    if (socialTransactions.length === 0) {
      showFeed = false;
    } else {
      showFeed = true;
    }
  }, [socialTransactions]);

  const handlePressAvatar = useCallback(() => {
    return null;
  });

  const handlePressCopyAddress = useCallback(() => {
    return null;
  });

  const customAccountSymbol = '💸';

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

      <Column align="center" height={185} marginBottom={24} marginTop={0}>
        <AvatarCircle
          accountColor={accountColor}
          accountSymbol={accountSymbol}
          showcaseAccountSymbol={customAccountSymbol}
          showcaseAccountColor={colors.walletconnect}
          image={accountImage}
          isAvatarPickerAvailable={false}
          onPress={handlePressAvatar}
        />

        <Row>
          <AccountName deviceWidth={deviceWidth}>{headerText}</AccountName>
        </Row>

        <RowWithMargins align="center" margin={19}>
          <ProfileAction
            icon="copy"
            onPress={handlePressCopyAddress}
            radiusWrapperStyle={{ marginRight: 10, width: 150 }}
            scaleTo={0.88}
            text="Add contact"
            width={127}
            wrapperProps={{
              containerStyle: {
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                paddingLeft: 10,
              },
            }}
          />
        </RowWithMargins>
        <ProfileMastheadDivider />
      </Column>

      {showFeed ? (
        <ActivityListEmptyState
          emoji="🧐"
          label="Add contacts to follow their transactions"
        ></ActivityListEmptyState>
      ) : (
        <SocialList socialTransactions={socialTransactions} />
      )}
    </SocialScreenPage>
  );
}

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  height: ${android ? '38' : '33'};
  margin-top: ${android ? '-10' : '-1'};
  margin-bottom: ${android ? '10' : '1'};
  max-width: ${({ deviceWidth }) => deviceWidth - 60};
  padding-right: 6;
`;

const ProfileMastheadDivider = styled(Divider).attrs(
  ({ theme: { colors } }) => ({
    color: colors.rowDividerLight,
  })
)`
  bottom: 0;
  position: absolute;
`;
