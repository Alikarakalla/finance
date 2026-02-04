import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }
        // Learn more about expo-notifications at https://docs.expo.dev/versions/latest/sdk/notifications/
        try {
            const Constants = require('expo-constants').default;
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } catch (e) {
            console.log('Error getting push token:', e);
        }
    } else {
        // console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

export async function sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: data || {},
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // send immediately
    });
}

export async function scheduleReminder(transaction: any) {
    if (!transaction.reminderDays || transaction.reminderDays <= 0) {
        await cancelReminder(transaction.id);
        return;
    }

    const reminderDate = new Date(transaction.date);
    reminderDate.setDate(reminderDate.getDate() - transaction.reminderDays);

    // If the reminder date is in the past, don't schedule
    if (reminderDate.getTime() <= Date.now()) {
        console.log('Reminder date is in the past, skipping:', reminderDate);
        return;
    }

    // Set a specific hour for the reminder (e.g., 9:00 AM) to be less intrusive
    reminderDate.setHours(9, 0, 0, 0);

    // Cancel existing one first to avoid duplicates
    await cancelReminder(transaction.id);

    await Notifications.scheduleNotificationAsync({
        identifier: `reminder_${transaction.id}`,
        content: {
            title: '📅 Payment Reminder',
            body: `Don't forget: $${transaction.amount} for ${transaction.categoryName || 'Transaction'} in ${transaction.reminderDays} day(s).`,
            data: { transactionId: transaction.id },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: reminderDate as any,
    });
    console.log(`Scheduled reminder for ${transaction.id} at ${reminderDate}`);
}

export async function cancelReminder(transactionId: string) {
    await Notifications.cancelScheduledNotificationAsync(`reminder_${transactionId}`);
}

export async function scheduleDailyReminder() {
    await Notifications.cancelScheduledNotificationAsync('daily_reminder');

    await Notifications.scheduleNotificationAsync({
        identifier: 'daily_reminder',
        content: {
            title: 'Daily Check-in',
            body: 'Don\'t forget to log your expenses and incomes today!',
        },
        trigger: {
            type: 'calendar',
            hour: 12,
            minute: 0,
            repeats: true,
        } as any,
    });
}
