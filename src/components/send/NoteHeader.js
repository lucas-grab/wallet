import { isHexString } from '@ethersproject/bytes';
import { get, isEmpty, toLower } from 'lodash';
import React, { Fragment, useCallback, useMemo } from 'react';
import { ActivityIndicator, Keyboard, View } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { PasteAddressButton } from '../buttons';
import { AddressField } from '../fields';
import { NoteField } from '../fields/';
import { Row } from '../layout';
import { SheetHandleFixedToTop, SheetTitle } from '../sheet';
import { Label, Text } from '../text';
import { resolveNameOrAddress } from '@rainbow-me/handlers/web3';
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
import { useClipboard, useDimensions } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import { profileUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${({ isSmallPhone, isTinyPhone }) =>
    android
      ? padding(0, 19)
      : isTinyPhone
      ? padding(23, 15, 10)
      : isSmallPhone
      ? padding(11, 19, 15)
      : padding(18, 19, 19)};
  background-color: ${({ theme: { colors } }) => colors.white};
  overflow: hidden;
  width: 100%;
`;

const AddressFieldLabel = styled(Label).attrs({
  size: 'large',
  weight: 'bold',
})`
  color: ${({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.6)};
  margin-right: 4;
  opacity: 1;
`;

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
  })
)`
  margin-right: 2;
`;

const SendSheetTitle = styled(SheetTitle).attrs({
  weight: 'heavy',
})`
  margin-bottom: ${android ? -10 : 0};
  margin-top: ${android ? 10 : 17};
`;

export default function NoteHeader({
  hideDivider,
  onChangeNoteInput,
  onFocus,
  onPressPaste,
  onRefocusInput,
  showAssetList,
}) {
  const { setClipboard } = useClipboard();
  const { isSmallPhone, isTinyPhone } = useDimensions();
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const [showNote, setShowNote] = useState(false);

  return (
    <View>
      <AddressInputContainer
        isSmallPhone={isSmallPhone}
        isTinyPhone={isTinyPhone}
      >
        <AddressFieldLabel>Note:</AddressFieldLabel>
        <NoteField
          autoFocus={true}
          testID="send-asset-form-field"
          onChange={onChangeNoteInput}
        />
      </AddressInputContainer>
      {hideDivider && !isTinyPhone ? null : (
        <Divider color={colors.rowDividerExtraLight} flex={0} inset={[0, 19]} />
      )}
    </View>
  );
}
