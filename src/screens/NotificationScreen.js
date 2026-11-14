//Ngô Kim Trâm_CE191681
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  requestNotificationPermission,
  sendLocalNotification,
} from '../services/notificationService';

export default function NotificationScreen() {
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [message, setMessage] = useState('');

  const enableNotifications = async () => {
    setLoading(true);
    setMessage('');
    try {
      await requestNotificationPermission();
      setPermissionGranted(true);
      setMessage('Đã kích hoạt thông báo thành công. Bạn có thể gửi thử thông báo bên dưới.');
      Alert.alert('Thông báo', 'Đã bật nhận thông báo trên thiết bị!');
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      setMessage('Không thể kiểm tra quyền thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    setMessage('');
    try {
      const sent = await sendLocalNotification(
        'STYLEME',
        'Thông báo thử đã được gửi thành công.'
      );
      setMessage(
        sent
          ? 'Đã gửi thông báo thử đến thiết bị.'
          : 'Không gửi được thông báo. Vui lòng thử lại.'
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setMessage('Không thể gửi thông báo thử. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>STYLEME / PREFERENCES</Text>
      <Text style={styles.title}>Thông báo</Text>
      <Text style={styles.subtitle}>
        Chọn cách bạn muốn nhận cập nhật về túi đồ và các bộ sưu tập mới.
      </Text>

      <View style={styles.card}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>✳</Text>
        </View>
        <Text style={styles.cardTitle}>Thông báo trên thiết bị</Text>
        <Text style={styles.cardDescription}>
          Nhận cập nhật khi đặt hàng hoặc có hoạt động mới trong ứng dụng.
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, permissionGranted && styles.primaryButtonActive]}
          disabled={loading}
          onPress={enableNotifications}
        >
          {loading ? (
            <ActivityIndicator color="#fffdf8" />
          ) : (
            <Text style={styles.primaryText}>
              {permissionGranted ? '✓ ĐÃ BẬT THÔNG BÁO' : 'BẬT THÔNG BÁO'}
            </Text>
          )}
        </TouchableOpacity>

        {permissionGranted ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            disabled={loading}
            onPress={sendTestNotification}
          >
            <Text style={styles.secondaryText}>🔔 GỬI THÔNG BÁO THỬ</Text>
          </TouchableOpacity>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      <Text style={styles.footer}>Bạn luôn có thể thay đổi quyền này trong cài đặt thiết bị.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f5f0', padding: 20, paddingTop: 28 },
  eyebrow: { color: '#8c7652', fontSize: 9, fontWeight: '700', letterSpacing: 1.7 },
  title: { color: '#25372e', fontSize: 28, fontWeight: '700', marginTop: 8 },
  subtitle: { color: '#88877f', fontSize: 13, lineHeight: 20, marginTop: 7 },
  card: { backgroundColor: '#fff', borderRadius: 17, padding: 18, marginTop: 25 },
  icon: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#e8e9df', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#526154', fontSize: 21 },
  cardTitle: { color: '#25372e', fontSize: 16, fontWeight: '700', marginTop: 15 },
  cardDescription: { color: '#88877f', fontSize: 12, lineHeight: 19, marginTop: 6 },
  primaryButton: { minHeight: 46, backgroundColor: '#25372e', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryButtonActive: { backgroundColor: '#385345' },
  primaryText: { color: '#fffdf8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  secondaryButton: { minHeight: 43, borderWidth: 1, borderColor: '#d8d6cc', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { color: '#25372e', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  notice: { backgroundColor: '#f4f2ed', borderRadius: 10, padding: 12, marginTop: 16 },
  noticeText: { color: '#77776f', fontSize: 11, lineHeight: 17 },
  message: { color: '#60665d', fontSize: 11, lineHeight: 17, marginTop: 13, textAlign: 'center' },
  footer: { color: '#99958d', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 18 },
});
