//Ngô Kim Trâm_CE191681
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Alert, Platform } from 'react-native';

const isExpoGoAndroid =
  Platform.OS === 'android' &&
  (Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient ||
    Constants?.executionEnvironment === 'storeClient') &&
  Boolean(Constants?.expoGoConfig);

export const canUseLocalNotifications = true;

export const notificationUnavailableMessage = '';

let notificationsModule;

const getNotifications = async () => {
  if (!notificationsModule) {
    notificationsModule = import('expo-notifications').then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return Notifications;
    });
  }
  return notificationsModule;
};

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'web' || isExpoGoAndroid) {
    return true;
  }

  try {
    const Notifications = await getNotifications();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Notification permission check fallback:', error);
    return true;
  }
};

export const sendLocalNotification = async (title, body, options = {}) => {
  try {
    if (!isExpoGoAndroid && Platform.OS !== 'web') {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        const Notifications = await getNotifications();
        await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        });
        return true;
      }
    }
  } catch (error) {
    console.warn('Native notification not available, using in-app notification:', error);
  }

  if (options.showAlert !== false) {
    Alert.alert(`🔔 ${title}`, body);
  }
  return true;
};
