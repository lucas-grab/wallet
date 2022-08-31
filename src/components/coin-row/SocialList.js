import { Text, View, FlatList, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { colors } from '@rainbow-me/styles';
import { formatDistanceToNowStrict } from 'date-fns';
import store from '@rainbow-me/redux/store';

function renderSocialItem(itemData) {
  const { accountAddress } = store.getState().settings;

  var from_nickname = itemData.item.from_nickname;
  var to_nickname = itemData.item.to_nickname;

  return (
    <Pressable>
      <View style={styles.item}>
        <View>
          <Text style={[styles.textBase, styles.description]}>
            {from_nickname} ➠ {to_nickname}
          </Text>
          <Text style={styles.textBase}>
            {formatDistanceToNowStrict(new Date(itemData.item.blockTimestamp))}{' '}
            ago
          </Text>
          <Text style={(styles.textBase, styles.description)}>
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
  // console.log('social ts ----------------------  ');
  // console.log(socialTransactions);

  //console('ts', { socialTransactions });

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
    backgroundColor: colors.alpha,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 6,
  },
  textBase: {
    color: colors.appleBlue,
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 'bold',
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
