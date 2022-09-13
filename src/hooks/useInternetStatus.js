import * as NetInfo from '@react-native-community/netinfo';

import { isNil } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import useRefreshAccountData from './useRefreshAccountData';

export default function useInternetStatus() {
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const refreshAccountData = useRefreshAccountData();
  const onChange = useCallback(
    ({ isInternetReachable: newIsInternetReachable }) => {
      if (!isNil(newIsInternetReachable)) {
        setIsInternetReachable(newIsInternetReachable);
        if (!isInternetReachable && newIsInternetReachable) {
          refreshAccountData();
        } else {
        }
      }
    },
    [isInternetReachable, refreshAccountData]
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(onChange);
    return unsubscribe;
  }, [onChange]);

  return isInternetReachable;
}
