//Ngô Kim Trâm_CE191681
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { saveOrderToFirebase } from '../services/firebaseService';
import { sendLocalNotification } from '../services/notificationService';

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

export default function CartScreen() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    retryCartLoad,
    saveOrder,
    totalAmount,
    totalItemCount,
    isCartLoaded,
    cartStorageError,
  } = useContext(CartContext);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!cartItems.length || checkingOut) {
      return;
    }

    setCheckingOut(true);
    const order = {
      id: `local-${Date.now()}`,
      items: cartItems,
      totalAmount,
      createdAt: new Date().toISOString(),
      status: 'Đã tiếp nhận (bản demo)',
    };

    try {
      try {
        order.id = await saveOrderToFirebase(cartItems, totalAmount);
        order.status = 'Đã tiếp nhận';
      } catch (error) {
        console.warn('Order will be saved locally because Firebase is unavailable:', error);
      }
      saveOrder(order);
      clearCart();
      Alert.alert(
        'Đã tiếp nhận đơn hàng',
        order.status === 'Đã tiếp nhận'
          ? `Mã đơn: ${order.id}`
          : 'Đơn hàng đã lưu trên thiết bị ở chế độ demo. Firebase chưa kết nối.'
      );
      sendLocalNotification('Đặt hàng thành công', 'Đơn hàng của bạn đã được tiếp nhận.', { showAlert: false });
    } catch (error) {
      console.error('Failed to save checkout order locally:', error);
      Alert.alert('Chưa thể đặt hàng', 'Không lưu được đơn hàng trên thiết bị. Vui lòng thử lại.');
    } finally {
      setCheckingOut(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="cover" />
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory}>STYLEME EDIT</Text>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.variant}>Cỡ {item.size} · {item.color}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.itemActions}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Giảm số lượng ${item.title}`}
              onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Tăng số lượng ${item.title}`}
              onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Xóa ${item.title} khỏi giỏ hàng`}
            onPress={() => removeFromCart(item.cartItemId)}
            hitSlop={8}
          >
            <Text style={styles.removeText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STYLEME / YOUR SELECTION</Text>
        <Text style={styles.title}>Túi đồ</Text>
        <Text style={styles.itemCount}>{totalItemCount} sản phẩm</Text>
        {cartStorageError ? (
          <View style={styles.storageError}>
            <Text style={styles.storageErrorText}>{cartStorageError}</Text>
            <TouchableOpacity onPress={retryCartLoad}>
              <Text style={styles.retryText}>TẢI LẠI</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          cartItems.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          !isCartLoaded ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#25372e" />
              <Text style={styles.emptyCaption}>Đang khôi phục túi đồ...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>S</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {cartStorageError ? 'Chưa tải được túi đồ' : 'Túi đồ đang trống'}
              </Text>
              <Text style={styles.emptyCaption}>
                {cartStorageError || 'Những món đồ bạn yêu thích sẽ xuất hiện ở đây.'}
              </Text>
              {cartStorageError ? (
                <TouchableOpacity style={styles.retryButton} onPress={retryCartLoad}>
                  <Text style={styles.retryText}>THỬ LẠI</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
      />

      {cartItems.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.subtotal}>{formatPrice(totalAmount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.total}>{formatPrice(totalAmount)}</Text>
          </View>
          <Text style={styles.shippingNote}>Phí vận chuyển được tính ở bước tiếp theo.</Text>
          <TouchableOpacity
            style={[styles.checkoutButton, checkingOut && styles.checkoutButtonDisabled]}
            disabled={checkingOut}
            onPress={handleCheckout}
          >
            {checkingOut ? (
              <ActivityIndicator color="#fffdf8" />
            ) : (
              <Text style={styles.checkoutButtonText}>ĐẶT HÀNG · KHÔNG THANH TOÁN TRỰC TUYẾN</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f5f0' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e5dd',
  },
  eyebrow: { color: '#8c7652', fontSize: 9, fontWeight: '700', letterSpacing: 1.8 },
  title: { color: '#25372e', fontSize: 30, fontWeight: '700', marginTop: 7 },
  itemCount: { color: '#88877f', fontSize: 13, marginTop: 3 },
  storageError: { backgroundColor: '#f3e5df', borderRadius: 10, padding: 10, marginTop: 10 },
  storageErrorText: { color: '#8c4b3c', fontSize: 11, lineHeight: 16 },
  retryText: { color: '#25372e', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 8 },
  retryButton: { paddingHorizontal: 18, paddingVertical: 11, backgroundColor: '#25372e', borderRadius: 10, marginTop: 12 },
  listContent: { padding: 16, paddingBottom: 22 },
  emptyListContent: { flexGrow: 1 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 17,
    padding: 10,
    marginBottom: 12,
  },
  image: { width: 92, height: 112, borderRadius: 11, backgroundColor: '#eeece6' },
  itemInfo: { flex: 1, justifyContent: 'center', paddingLeft: 13, paddingVertical: 3 },
  itemCategory: { color: '#8c7652', fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  itemTitle: { color: '#25372e', fontSize: 14, fontWeight: '600', lineHeight: 19, marginTop: 5 },
  variant: { color: '#88877f', fontSize: 11, marginTop: 4 },
  itemPrice: { color: '#25372e', fontSize: 14, fontWeight: '700', marginTop: 5 },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityControl: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f2ed',
    borderRadius: 9,
  },
  quantityButton: { width: 32, height: 30, alignItems: 'center', justifyContent: 'center' },
  quantityButtonText: { color: '#25372e', fontSize: 17, fontWeight: '500' },
  quantity: { color: '#25372e', minWidth: 20, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  removeText: { color: '#9b6257', fontSize: 11, fontWeight: '600', paddingHorizontal: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#e8e9df',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: { color: '#25372e', fontSize: 23, fontWeight: '800', letterSpacing: 2 },
  emptyTitle: { color: '#25372e', fontSize: 18, fontWeight: '700' },
  emptyCaption: { color: '#88877f', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  summary: {
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 22,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#77776f', fontSize: 13 },
  subtotal: { color: '#77776f', fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eeece6', marginVertical: 13 },
  totalLabel: { color: '#25372e', fontSize: 15, fontWeight: '700' },
  total: { color: '#25372e', fontSize: 19, fontWeight: '800' },
  shippingNote: { color: '#99958d', fontSize: 11, marginTop: 10 },
  checkoutButton: { minHeight: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25372e', borderRadius: 12, marginTop: 16, paddingHorizontal: 12 },
  checkoutButtonDisabled: { opacity: 0.65 },
  checkoutButtonText: { color: '#fffdf8', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
});
