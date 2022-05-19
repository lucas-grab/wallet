import { useState, useContext } from 'react';
import React from 'react';
import { StyleSheet, Text, View, Pressable, FlatList } from 'react-native';
import normalizer from './price-string-normalizer'
import { KeypadContext } from '../../context/keypad-context';

const styles = StyleSheet.create({
    keypad: {
        justifyContent: 'space-evenly',
        paddingHorizontal: 50,
        paddingTop: 10
    },
    keypadNumber: {
        fontSize: 30,
        fontWeight: 'bold',
        margin: 35,
        textAlign: 'center'
    },
    keypadValue: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    pressable: ({pressed}) => ({
        opacity: pressed ? 0.5 : 1,
        marginRight: 10
    }),

});

function Keypad() {
    const [keypadValue, setKeypadValue] = useState("0.00");
    const keypad = [
        {
            key: 0,
            value: 1
        },
        {
            key: 1,
            value: 2
        },
        {
            key: 2,
            value: 3
        },
        {
            key: 3,
            value: 4
        },
        {
            key: 4,
            value: 5
        },
        {
            key: 5,
            value: 6
        },
        {
            key: 6,
            value: 7
        },
        {
            key: 7,
            value: 8
        },
        {
            key: 8,
            value: 9
        },
        {
            key: 9,
            value: " "
        },
        {
            key: 10,
            value: 0
        },
        {
            key: 11,
            value: "←"
        },
    ]

    const keypadContext = useContext(KeypadContext);

    function isInt(value) {
        if (isNaN(value)) {
          return false;
        }
        var x = parseFloat(value);
        return (x | 0) === x;
    }

    function keypadHandler(value) {
        if(isInt(value)) {
            keypadContext.addKeypadValue(value)
        }
        else if (value === "←") {
            keypadContext.removeKeypadValue(value)
        }
    };

    function renderKeypadItem(itemData) {

        return (
            <Pressable style={styles.pressable} onPress={() => {keypadHandler(itemData.item.value)}}>
                <Text style={styles.keypadNumber}>{itemData.item.value}</Text>
            </Pressable>
            )
    }

    return (
        <View>
            <Text style={styles.keypadValue}>{normalizer(keypadContext.keypadValue)} €</Text>         
            <View style={styles.keypad}>                
                <FlatList data={keypad} keyExtractor={item => item.key} renderItem={renderKeypadItem} numColumns={3}/>                  
            </View>
      </View>
    );
   
} 

export default Keypad;