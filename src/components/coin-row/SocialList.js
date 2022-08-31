import { Text, View, FlatList, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { colors } from '@rainbow-me/styles';
import { formatDistanceToNowStrict } from 'date-fns';
import store from '@rainbow-me/redux/store';

function renderSocialItem(itemData) {
  const { accountAddress } = store.getState().settings;

  var from_nickname = itemData.item.from_nickname;
  var to_nickname = itemData.item.to_nickname;

  if (itemData.item.from_address === accountAddress.toLowerCase()) {
    from_nickname = '💰 Me';
  } else if (itemData.item.to_address === accountAddress.toLowerCase()) {
    to_nickname = '💰 Me';
  }

  return (
    <Pressable>
      <View style={styles.item}>
        <View>
          <Text style={[styles.people]}>
            {from_nickname} ➠ {to_nickname}
          </Text>
          <Text style={styles.textTimestamp}>
            {formatDistanceToNowStrict(new Date(itemData.item.blockTimestamp))}{' '}
            ago
          </Text>
          <Text style={(styles.textBase, styles.note)}>
            {itemData.item.note}
          </Text>
        </View>

        {/* <View style={styles.amountContainer}>
          <Text style={styles.amount}>AMOUNT: {itemData.item.value}</Text>
        </View> */}
      </View>
    </Pressable>
  );
}

function SocialList({ socialTransactions }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={socialTransactions}
        renderItem={renderSocialItem}
        keyExtractor={item => item.tx_hash}
      />
    </View>
  );
}

export default SocialList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  item: {
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 6,
  },
  people: {
    fontSize: 16,
    marginBottom: 4,
    marginTop: 4,
    fontWeight: '600',
    color: colors.appleBlue,
  },
  textTimestamp: {
    color: colors.blueGreyDark60,
    fontSize: 14,
    marginLeft: 4,
  },
  note: {
    fontSize: 16,
    marginBottom: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  amountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  amount: {
    color: colors.blueGreyDark40,
    fontWeight: 'bold',
  },
});
