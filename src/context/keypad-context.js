import React, { createContext, useState } from 'react';

export const KeypadContext = createContext({
    keypadValue: '0.00',
    addKeypadValue: (value) => {},
    removeKeypadValue: () => {},
});

function KeypadContextProvider({children}) {
    const [keypadValue, setKeypadValue] = useState("0.00");

    function addKeypadValue(value) {
        setKeypadValue(currentKeypadValue => currentKeypadValue + value);
    }

    function removeKeypadValue() {
        if(keypadValue.slice(0, -1))  {
            setKeypadValue(currentKeypadValue => currentKeypadValue.slice(0, -1))
        }
        else {
            setKeypadValue("0.00")
        }  
    }

    const value = {
        keypadValue: keypadValue,
        addKeypadValue: addKeypadValue,
        removeKeypadValue: removeKeypadValue
    };
    
    return <KeypadContext.Provider value={value}>{children}</KeypadContext.Provider>
}

export default KeypadContextProvider;
