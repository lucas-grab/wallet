import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import logger from 'logger';

export default function useInitializeAccountData() {
  const dispatch = useDispatch();

  const initializeAccountData = useCallback(async () => {
    try {
      InteractionManager.runAfterInteractions(() => {
        dispatch(explorerInit());
      });

      InteractionManager.runAfterInteractions(async () => {
        await dispatch(uniqueTokensRefreshState());
      });
    } catch (error) {}
  }, [dispatch]);

  return initializeAccountData;
}
