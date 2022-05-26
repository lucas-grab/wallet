import { useContext } from 'react';
import React from 'react';
import { StyleSheet, Text, View, Pressable, FlatList } from 'react-native';
import normalizer from './price-string-normalizer';
import { KeypadContext } from '../../context/keypad-context';
import Button from 'react-native-ui-lib/button';
import { useTheme } from '../../context/ThemeContext';
import Routes from '@rainbow-me/routes';
import { useNavigation } from '../../navigation/Navigation';

function Keypad() {
  const keypad = [
    {
      key: 0,
      value: 1,
    },
    {
      key: 1,
      value: 2,
    },
    {
      key: 2,
      value: 3,
    },
    {
      key: 3,
      value: 4,
    },
    {
      key: 4,
      value: 5,
    },
    {
      key: 5,
      value: 6,
    },
    {
      key: 6,
      value: 7,
    },
    {
      key: 7,
      value: 8,
    },
    {
      key: 8,
      value: 9,
    },
    {
      key: 9,
      value: ' ',
    },
    {
      key: 10,
      value: 0,
    },
    {
      key: 11,
      value: '←',
    },
  ];

  const keypadContext = useContext(KeypadContext);
  const { colors } = useTheme();
  const { navigate } = useNavigation();

  function isInt(value) {
    if (isNaN(value)) {
      return false;
    }
    var x = parseFloat(value);
    return (x | 0) === x;
  }

  function keypadHandler(value) {
    if (isInt(value)) {
      keypadContext.addKeypadValue(value);
    } else if (value === '←') {
      keypadContext.removeKeypadValue(value);
    }
  }

  function renderKeypadItem(itemData) {
    return (
      <Pressable
        style={styles.pressable}
        onPress={() => {
          keypadHandler(itemData.item.value);
        }}
      >
        <Text style={styles.keypadNumber}>{itemData.item.value}</Text>
      </Pressable>
    );
  }

  return (
    <View>
      <Text style={styles.keypadValue}>
        {normalizer(keypadContext.keypadValue)} €
      </Text>
      <FlatList
        data={keypad}
        keyExtractor={item => item.key}
        renderItem={renderKeypadItem}
        numColumns={3}
        contentContainerStyle={styles.keypad}
      />
      <View style={styles.keypadButtonContainer}>
        <Button
          label={'Request'}
          backgroundColor={colors.blueGreyDarker}
          labelStyle={{ fontWeight: '700' }}
          style={styles.keypadButton}
          onPress={() => navigate(Routes.RECEIVE_MODAL)}
        />
        <Button
          label={'Send'}
          backgroundColor={colors.blueGreyDarker}
          labelStyle={{ fontWeight: '700' }}
          style={styles.keypadButton}
          onPress={() => navigate(Routes.SEND_FLOW)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: {
    alignItems: 'center',
  },
  keypadNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    margin: 28,
    textAlign: 'center',
    width: 40,
    alignSelf: 'center',
  },
  keypadValue: {
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 30,
  },
  pressable: ({ pressed }) => ({
    opacity: pressed ? 0.5 : 1,
    marginRight: 10,
  }),
  keypadButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  keypadButton: {
    marginHorizontal: 10,
    width: 150,
  },
});

export default Keypad;
