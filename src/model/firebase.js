import messaging from '@react-native-firebase/messaging';
import lang from 'i18n-js';
import { get } from 'lodash';
import { requestNotifications } from 'react-native-permissions';
import { Alert } from '../components/alerts';
import { getLocal, saveLocal } from '../handlers/localstorage/common';
import logger from 'logger';
import firestore from '@react-native-firebase/firestore';

const db = firestore();
const addressesCollection = db.collection('Addresses');

export function saveTransactionNote(address, transactionHash, note) {
  addressesCollection
    .doc(address)
    .collection('transactions')
    .doc(transactionHash)
    .set({
      note: note,
      timestamp: firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log('New transaction note was added to firebase');
    });
}

export const getTransactionNotes = async () => {
  try {
    const querySnapshot = await db
      .collectionGroup('transactions')
      // .orderBy('timestamp', 'desc')
      .get();
    const notes = [];
    querySnapshot.forEach(doc => {
      notes.push({
        tx_hash: doc.id,
        note: doc.data().note,
        timestamp: doc.data().timestamp,
      });
    });

    return notes;
  } catch (error) {
    logger.log('error while getting transaction notes', error);
  }
};

export const getFCMToken = async () => {
  const fcmTokenLocal = await getLocal('rainbowFcmToken');

  const fcmToken = get(fcmTokenLocal, 'data', null);

  if (!fcmToken) {
    throw new Error('Push notification token unavailable.');
  }
  return fcmToken;
};

export const saveFCMToken = async () => {
  try {
    const permissionStatus = await getPermissionStatus();
    if (
      permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      permissionStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        saveLocal('rainbowFcmToken', { data: fcmToken });
      }
    }
  } catch (error) {
    logger.log('error while getting & saving FCM token', error);
  }
};

export const getPermissionStatus = () => messaging().hasPermission();

export const requestPermission = () => {
  return new Promise((resolve, reject) => {
    requestNotifications(['alert', 'sound', 'badge'])
      .then(({ status }) => {
        resolve(status === 'granted');
      })
      .catch(e => reject(e));
  });
};

export const checkPushNotificationPermissions = async () => {
  return new Promise(async resolve => {
    let permissionStatus = null;
    try {
      permissionStatus = await getPermissionStatus();
    } catch (error) {
      logger.log(
        'Error checking if a user has push notifications permission',
        error
      );
    }

    if (
      permissionStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
      permissionStatus !== messaging.AuthorizationStatus.PROVISIONAL
    ) {
      Alert({
        buttons: [
          {
            onPress: async () => {
              try {
                await requestPermission();
                await saveFCMToken();
              } catch (error) {
                logger.log('ERROR while getting permissions', error);
              } finally {
                resolve(true);
              }
            },
            text: 'Okay',
          },
          {
            onPress: async () => {
              resolve(true);
            },
            style: 'cancel',
            text: 'Dismiss',
          },
        ],
        message: lang.t('wallet.push_notifications.please_enable_body'),
        title: lang.t('wallet.push_notifications.please_enable_title'),
      });
    } else {
      resolve(true);
    }
  });
};

export const registerTokenRefreshListener = () =>
  messaging().onTokenRefresh(fcmToken => {
    saveLocal('rainbowFcmToken', { data: fcmToken });
  });
