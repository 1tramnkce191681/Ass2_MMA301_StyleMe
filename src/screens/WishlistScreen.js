//Ngô Kim Trâm_CE191681
import { useCallback, useContext, useEffect, useState } from 'react';
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
import {
  loadOrdersFromFirebase,
  isFirebaseConfigured,
  loadWishlistFromFirebase,
  removeWishlistFromFirebase,
} from '../services/firebaseService';
import { CartContext } from '../context/CartContext';

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

export default function WishlistScreen({ navigation }) {
  const {
    wishlist: localWishlist,
    orders: localOrders,
    removeFromWishlist: contextRemoveFromWishlist,
    retryWishlistLoad,
    wishlistStorageError,
    isWishlistLoaded,
    isOrdersLoaded,
  } = useContext(CartContext);
  const [remoteWishlist, setRemoteWishlist] = useState([]);
  const [remoteOrders, setRemoteOrders] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(isFirebaseConfigured);
  const [ordersLoading, setOrdersLoading] = useState(isFirebaseConfigured);
  const [wishlistError, setWishlistError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [removingId, setRemovingId] = useState('');

  const wishlistByProduct = new Map();
  remoteWishlist.forEach((item) => {
    const rawProductId = item.productId ?? item.id;
    const productId = String(rawProductId);
    wishlistByProduct.set(productId, {
      ...item,
      id: String(item.id),
      productId: rawProductId,
      firebaseDocumentId: String(item.id),
      isLocal: false,
    });
  });
  localWishlist.forEach((item) => {
    const rawProductId = item.productId ?? item.id;
    const productId = String(rawProductId);
    wishlistByProduct.set(productId, {
      ...item,
      id: wishlistByProduct.get(productId)?.id || String(item.id),
      productId: rawProductId,
      firebaseDocumentId:
        wishlistByProduct.get(productId)?.firebaseDocumentId || null,
      isLocal: true,
    });
  });
  const wishlist = [...wishlistByProduct.values()];
  const orderIds = new Set(localOrders.map((order) => String(order.id)));
  const orders = [
    ...localOrders,
    ...remoteOrders.filter((order) => !orderIds.has(String(order.id))),
  ];

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return undefined;
    }

    let isActive = true;

    const loadInitialWishlist = async () => {
      try {
        const items = await loadWishlistFromFirebase();
        if (isActive) {
          setRemoteWishlist(items);
          setWishlistError('');
        }
      } catch (loadError) {
        console.error('Failed to load wishlist from Firebase:', loadError);
        if (isActive) {
          setWishlistError('Không thể đồng bộ danh sách yêu thích với Firebase.');
        }
      } finally {
        if (isActive) {
          setWishlistLoading(false);
        }
      }
    };

    const loadInitialOrders = async () => {
      try {
        const items = await loadOrdersFromFirebase();
        if (isActive) {
          setRemoteOrders(items);
          setOrdersError('');
        }
      } catch (loadError) {
        console.error('Failed to load orders from Firebase:', loadError);
        if (isActive) {
          setOrdersError('Không thể đồng bộ đơn hàng với Firebase.');
        }
      } finally {
        if (isActive) {
          setOrdersLoading(false);
        }
      }
    };

    if (isFirebaseConfigured) {
      loadInitialWishlist();
      loadInitialOrders();
    }
    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = useCallback(async () => {
    if (!isFirebaseConfigured) {
      return;
    }
    setWishlistLoading(true);
    setOrdersLoading(true);
    setWishlistError('');
    setOrdersError('');
    const [wishlistResult, ordersResult] = await Promise.allSettled([
      loadWishlistFromFirebase(),
      loadOrdersFromFirebase(),
    ]);
    if (wishlistResult.status === 'fulfilled') {
      setRemoteWishlist(wishlistResult.value);
    } else {
      console.error('Failed to retry wishlist sync:', wishlistResult.reason);
      setWishlistError('Không thể đồng bộ danh sách yêu thích với Firebase.');
    }
    if (ordersResult.status === 'fulfilled') {
      setRemoteOrders(ordersResult.value);
    } else {
      console.error('Failed to retry orders sync:', ordersResult.reason);
      setOrdersError('Không thể đồng bộ đơn hàng với Firebase.');
    }
    setWishlistLoading(false);
    setOrdersLoading(false);
  }, []);

  const isLoading = !isWishlistLoaded || !isOrdersLoaded || wishlistLoading;
  const handleRemove = async (item) => {
    if (removingId) {
      return;
    }
    if (item.isLocal) {
      if (item.firebaseDocumentId) {
        setRemovingId(item.id);
        try {
          await removeWishlistFromFirebase(item.firebaseDocumentId);
          setRemoteWishlist((items) =>
            items.filter((saved) => saved.id !== item.firebaseDocumentId)
          );
        } catch (error) {
          console.error('Failed to remove wishlist item from Firebase:', error);
          Alert.alert('Chưa thể xóa', 'Vui lòng thử lại khi có kết nối.');
          return;
        } finally {
          setRemovingId('');
        }
      }
      contextRemoveFromWishlist(item.productId);
      return;
    }
    setRemovingId(item.id);
    try {
      await removeWishlistFromFirebase(item.id);
      setRemoteWishlist((items) => items.filter((saved) => saved.id !== item.id));
    } catch (error) {
      console.error('Failed to remove wishlist item:', error);
      Alert.alert('Chưa thể xóa', 'Vui lòng thử lại khi có kết nối.');
    } finally {
      setRemovingId('');
    }
  };

  const renderItem = ({ item }) => {
    const savedDate = item.addedAt ? new Date(item.addedAt) : null;
    const validSavedDate = savedDate && !Number.isNaN(savedDate.getTime());

    return (
      <View style={styles.card}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderMark}>S</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.category}>STYLEME EDIT</Text>
          <Text style={styles.productTitle} numberOfLines={2}>{item.title || 'Sản phẩm'}</Text>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.date}>
            {validSavedDate ? `Đã lưu ${savedDate.toLocaleDateString()}` : 'Món đồ bạn yêu thích'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Xóa ${item.title} khỏi danh sách yêu thích`}
            disabled={Boolean(removingId)}
            onPress={() => handleRemove(item)}
            style={styles.removeButton}
          >
            <Text style={styles.removeText}>
              {removingId === item.id ? 'ĐANG XÓA...' : 'BỎ YÊU THÍCH'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heartBadge}>
          <Text style={styles.heart}>♥</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          wishlist.length === 0 && styles.emptyListContent,
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>STYLEME / YOUR EDIT</Text>
                <Text style={styles.title}>Món đồ yêu thích</Text>
                <Text style={styles.subtitle}>
                  {wishlist.length > 0
                    ? `${wishlist.length} thiết kế đang chờ bạn.`
                    : isFirebaseConfigured
                      ? 'Lưu lại những thiết kế bạn muốn nhớ.'
                      : 'Danh sách được lưu trên thiết bị này.'}
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.count}>{wishlist.length}</Text>
              </View>
            </View>
            <View style={styles.sectionLine}>
              <Text style={styles.sectionLabel}>DANH SÁCH CỦA BẠN</Text>
              <Text style={styles.sectionLabel}>01 / EDIT</Text>
            </View>
            {wishlistStorageError ? (
              <View style={styles.storageError}>
                <Text style={styles.ordersEmptyText}>{wishlistStorageError}</Text>
                <TouchableOpacity onPress={retryWishlistLoad}>
                  <Text style={styles.retryText}>THỬ TẢI LẠI</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator size="large" color="#25372e" />
                <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
              </>
            ) : wishlistError ? (
              <>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconMark}>!</Text>
                </View>
                <Text style={styles.emptyTitle}>Chưa đồng bộ được</Text>
                <Text style={styles.emptyText}>{wishlistError}</Text>
                {isFirebaseConfigured ? (
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryText}>THỬ LẠI</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconMark}>♡</Text>
                </View>
                <Text style={styles.emptyTitle}>Chưa có món đồ nào</Text>
                <Text style={styles.emptyText}>
                  Chạm vào biểu tượng trái tim ở sản phẩm để lưu lại những món bạn yêu thích.
                </Text>
                <TouchableOpacity
                  style={styles.shopButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('HomeTab')}
                >
                  <Text style={styles.shopButtonText}>KHÁM PHÁ BỘ SƯU TẬP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.ordersSection}>
            <View style={styles.ordersHeading}>
              <Text style={styles.ordersTitle}>Đơn hàng</Text>
              {ordersLoading ? (
                <ActivityIndicator size="small" color="#25372e" />
              ) : (
                <Text style={styles.sectionLabel}>{orders.length} ĐƠN</Text>
              )}
            </View>
            {ordersError ? (
              <View style={styles.orderError}>
                <Text style={styles.ordersEmptyText}>{ordersError}</Text>
                <TouchableOpacity onPress={handleRetry}>
                  <Text style={styles.retryText}>THỬ ĐỒNG BỘ LẠI</Text>
                </TouchableOpacity>
              </View>
            ) : orders.length ? (
              orders.map((order) => (
                <View key={String(order.id)} style={styles.orderCard}>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderId}>ĐƠN {String(order.id).slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderStatus}>{order.status || 'Đã tiếp nhận'}</Text>
                  </View>
                  <Text style={styles.orderMeta}>
                    {order.items?.length || 0} sản phẩm · {formatPrice(order.totalAmount)}
                  </Text>
                  <Text style={styles.orderDate}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : 'Ngày đặt chưa xác định'}
                  </Text>
                </View>
              ))
            ) : !ordersLoading ? (
              <Text style={styles.ordersEmptyText}>Đơn hàng của bạn sẽ xuất hiện ở đây.</Text>
            ) : null}
            {!isFirebaseConfigured && !orders.length ? (
              <Text style={styles.localOnlyNote}>Đơn hàng demo chỉ được lưu trên thiết bị này.</Text>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f5f0' },
  listContent: { paddingHorizontal: 18, paddingBottom: 24, flexGrow: 1 },
  emptyListContent: { flexGrow: 1 },
  header: { paddingTop: 22, paddingBottom: 19 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headingCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: '#8c7652', fontSize: 9, fontWeight: '700', letterSpacing: 1.7 },
  title: { color: '#25372e', fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitle: { color: '#88877f', fontSize: 12, marginTop: 5 },
  countBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8e9df',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { color: '#25372e', fontSize: 15, fontWeight: '700' },
  sectionLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e1d7',
    marginTop: 20,
    paddingTop: 12,
  },
  sectionLabel: { color: '#8a8981', fontSize: 9, fontWeight: '600', letterSpacing: 1.2 },
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 11,
    borderRadius: 16,
    marginBottom: 12,
  },
  image: { width: 92, height: 112, borderRadius: 11, backgroundColor: '#eeece6' },
  imagePlaceholder: {
    width: 92,
    height: 112,
    borderRadius: 11,
    backgroundColor: '#e8e9df',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderMark: { color: '#7c8478', fontSize: 24, fontWeight: '800', letterSpacing: 3 },
  info: { flex: 1, marginLeft: 13, paddingRight: 25 },
  category: { color: '#8c7652', fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  productTitle: { color: '#25372e', fontSize: 14, fontWeight: '600', lineHeight: 19, marginTop: 5 },
  price: { color: '#25372e', fontSize: 14, fontWeight: '700', marginTop: 6 },
  date: { color: '#99958d', fontSize: 10, marginTop: 5 },
  removeButton: { alignSelf: 'flex-start', marginTop: 8 },
  removeText: { color: '#9b6257', fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  ordersSection: { marginTop: 24, paddingBottom: 12 },
  ordersHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e1d7', paddingTop: 16, marginBottom: 12 },
  ordersTitle: { color: '#25372e', fontSize: 18, fontWeight: '700' },
  orderCard: { backgroundColor: '#fff', borderRadius: 13, padding: 14, marginBottom: 9 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: '#25372e', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  orderStatus: { color: '#65745f', fontSize: 10, fontWeight: '600' },
  orderMeta: { color: '#25372e', fontSize: 12, fontWeight: '600', marginTop: 7 },
  orderDate: { color: '#99958d', fontSize: 10, marginTop: 5 },
  orderError: { alignItems: 'flex-start', backgroundColor: '#f3e5df', borderRadius: 11, padding: 12 },
  ordersEmptyText: { color: '#88877f', fontSize: 11, lineHeight: 17, marginTop: 4 },
  localOnlyNote: { color: '#99958d', fontSize: 10, marginTop: 8 },
  storageError: { backgroundColor: '#f3e5df', borderRadius: 11, padding: 12, marginTop: 12 },
  heartBadge: {
    position: 'absolute',
    right: 13,
    top: 13,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#f7f5f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: { color: '#9b6257', fontSize: 13 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 23, paddingBottom: 42 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e8e9df',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconMark: { color: '#526154', fontSize: 28, fontWeight: '500' },
  emptyTitle: { color: '#25372e', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { maxWidth: 290, color: '#88877f', fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  loadingText: { color: '#88877f', fontSize: 12, marginTop: 12 },
  retryButton: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    backgroundColor: '#25372e',
    borderRadius: 11,
    marginTop: 18,
  },
  retryText: { color: '#fffdf8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  shopButton: {
    paddingHorizontal: 21,
    paddingVertical: 14,
    backgroundColor: '#25372e',
    borderRadius: 11,
    marginTop: 20,
  },
  shopButtonText: { color: '#fffdf8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
