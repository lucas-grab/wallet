import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { isHexString } from '../../handlers/web3';
import { checkIsValidAddressOrDomain } from '../../helpers/validators';
import { Input } from '../inputs';
import { Row } from '../layout';
import { Label } from '../text';
import { useClipboard, useDimensions } from '@rainbow-me/hooks';
import { abbreviations, addressUtils } from '@rainbow-me/utils';
import { firebaseA, firebaseTest } from '../../model/firebase';

const NoteInput = styled(Input).attrs({
  autoCapitalize: 'none',
  autoCorrect: false,
  keyboardType: android ? 'visible-password' : 'default',
  maxLength: addressUtils.maxLength,
  selectTextOnFocus: true,
  size: 'large',
  spellCheck: false,
  weight: 'bold',
})`
  ${android && 'height: 56;'}
  flex-grow: 1;
  margin-top: 1;
  z-index: 1;
`;

const Placeholder = styled(Row)`
  margin-left: ${android ? 4 : 0};
  margin-top: ${android ? 11 : 0};
  position: absolute;
  top: 0;
  z-index: 1;
`;

const PlaceholderText = styled(Label).attrs({
  size: 'large',
  weight: 'bold',
})`
  color: ${({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.3)};
  opacity: 1;
`;

const NoteField = ({ autoFocus, onFocus, onChange, testID, ...props }, ref) => {
  const { isTinyPhone } = useDimensions();
  const { colors } = useTheme();
  const [note, setNote] = useState('');
  const dispatch = useDispatch();

  // const { clipboard, setClipboard } = useClipboard();

  // const expandAbbreviatedClipboard = useCallback(() => {
  //   if (clipboard === abbreviations.formatAddressForDisplay(address)) {
  //     setClipboard(address);
  //   }
  // }, [address, clipboard, setClipboard]);

  const handleChange = useCallback(
    ({ nativeEvent: { text } }) => {
      if (text.length === 0) {
        text = text + ' ';
      }
      onChange(text);
    },
    [onChange]
  );

  return (
    <Row flex={1}>
      <NoteInput
        {...props}
        autoFocus={autoFocus}
        color={colors.dark}
        //onBlur={expandAbbreviatedClipboard}
        onChangeText={setNote}
        onEndEditing={handleChange}
        onFocus={onFocus}
        ref={ref}
        testID={testID}
        value={note}
      />
      {!note && (
        <Placeholder>
          <TouchableWithoutFeedback onPress={ref?.current?.focus}>
            <PlaceholderText>
              {android || isTinyPhone
                ? 'Your note'
                : 'Your note for the receiver'}
            </PlaceholderText>
          </TouchableWithoutFeedback>
        </Placeholder>
      )}
    </Row>
  );
};

export default React.forwardRef(NoteField);
