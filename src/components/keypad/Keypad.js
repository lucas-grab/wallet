import { useState } from 'react';
import React from 'react';
import { StyleSheet, Text, View, Button, Pressable, FlatList } from 'react-native';

const styles = StyleSheet.create({
    keypad: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingTop: 50,
        paddingHorizontal: 50,
        borderColor: 'red',
        borderWidth: 2,
    },
    keypadNumber: {
        fontSize: 30,
        fontWeight: 'bold',
        margin: 30

    },
    keypadValue: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 30,
        textAlign: 'center'
    },
    pressable: ({pressed}) => ({
        opacity: pressed ? 0.5 : 1,
        marginRight: 10
    }),

});

function Keypad() {

    const [keypadValue, setKeypadValue] = useState("");

    const keypad = [
        {
            number: 1
        },
        {
            number: 2
        },
        {
            number: 3
        },
        {
            number: 4
        },
        {
            number: 5
        },
        {
            number: 6
        },
        {
            number: 7
        },
        {
            number: 8
        },
        {
            number: 9
        },
    ]


    function keypadHandler(value) {
        setKeypadValue(currentKeypadValue => currentKeypadValue + value);
    };

    function renderKeypadItem(itemData) {

        return (
            <Pressable style={styles.pressable} onPress={() => {keypadHandler(itemData.item.number)}}>
                <Text style={styles.keypadNumber}>{itemData.item.number}</Text>
            </Pressable>
            )
    }


    return (
        <View>
            <Text style={styles.keypadValue}>{keypadValue}</Text>
            
            <View style={styles.keypad}>                

                <FlatList data={keypad} keyExtractor={item => item.number} renderItem={renderKeypadItem} numColumns={3}/>

          
                    
            </View>
      </View>

   


    );
   
} 

export default Keypad;