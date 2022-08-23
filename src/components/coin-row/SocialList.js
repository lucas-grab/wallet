import { Text, View, FlatList, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { colors } from '@rainbow-me/styles';

function renderSocialItem(itemData) {
  return (
    <Pressable>
      <View style={styles.item}>
        <View>
          <Text style={[styles.textBase, styles.description]}>
            {itemData.item.from_nickname} ➠ {itemData.item.to_nickname}
          </Text>
          <Text style={styles.textBase}>
            WHEN: {itemData.item.blockTimestamp}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amount}>AMOUNT: {itemData.item.value}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SocialList({ socialTransactions }) {
  console.log(socialTransactions[0]);
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
