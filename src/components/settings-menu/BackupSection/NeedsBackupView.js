import { useRoute } from '@react-navigation/native';

import React, { Fragment, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { cloudPlatform } from '../../../utils/platform';
import { RainbowButton } from '../../buttons';
import { Centered, Column } from '../../layout';
import { SheetActionButton } from '../../sheet';
import { Text } from '../../text';
import BackupIcon from '@rainbow-me/assets/backupIcon.png';
import BackupIconDark from '@rainbow-me/assets/backupIconDark.png';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import { useWallets } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { fonts, padding } from '@rainbow-me/styles';

const BackupButton = styled(RainbowButton).attrs({
  type: 'small',
  width: ios ? 221 : 270,
})`
  margin-bottom: 19;
`;

const Content = styled(Centered).attrs({
  direction: 'column',
})`
  ${padding(0, 19, 42)};
  flex: 1;
`;

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'loosest',
  size: 'large',
}))`
  margin-bottom: 42;
  padding-horizontal: 23;
`;

const Subtitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.orangeLight,
  size: fonts.size.smedium,
  weight: fonts.weight.medium,
}))`
  margin-top: -10;
`;

const Title = styled(Text).attrs({
  align: 'center',
  size: 'larger',
  weight: 'bold',
})`
  margin-bottom: 8;
  padding-horizontal: 11;
`;

const TopIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
})`
  height: 74;
  width: 75;
`;

export default function NeedsBackupView() {
  const { navigate, setParams } = useNavigation();
  const { params } = useRoute();
  const { wallets, selectedWallet } = useWallets();
  const walletId = params?.walletId || selectedWallet.id;

  useEffect(() => {
    if (wallets[walletId]?.backedUp) {
      setParams({ type: 'AlreadyBackedUpView' });
    }
  }, [setParams, walletId, wallets]);

  useEffect(() => {}, []);

  const onIcloudBackup = useCallback(() => {
    navigate(ios ? Routes.BACKUP_SHEET : Routes.BACKUP_SCREEN, {
      nativeScreen: true,
      step: WalletBackupStepTypes.cloud,
      walletId,
    });
  }, [navigate, walletId]);

  const onManualBackup = useCallback(() => {
    navigate(ios ? Routes.BACKUP_SHEET : Routes.BACKUP_SCREEN, {
      nativeScreen: true,
      step: WalletBackupStepTypes.manual,
      walletId,
    });
  }, [navigate, walletId]);

  const { colors, isDarkMode } = useTheme();

  return (
    <Fragment>
      <Subtitle>Not backed up</Subtitle>
      <Content>
        <Column align="center">
          <TopIcon source={isDarkMode ? BackupIconDark : BackupIcon} />
          <Title>Back up your wallet </Title>
          <DescriptionText>
            Don&apos;t risk your money! Back up your wallet so you can recover
            it if you lose this device.
          </DescriptionText>
        </Column>
        <Column align="center">
          <BackupButton
            label={`􀙶 Back up to ${cloudPlatform}`}
            onPress={onIcloudBackup}
          />
          <SheetActionButton
            androidWidth={220}
            color={colors.white}
            label="🤓 Back up manually"
            onPress={onManualBackup}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </Column>
      </Content>
    </Fragment>
  );
}
