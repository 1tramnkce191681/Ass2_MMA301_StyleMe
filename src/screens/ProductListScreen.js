//Ngô Kim Trâm_CE191681
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { CLOTHING_CATEGORY_OPTIONS, fetchProducts } from '../services/apiService';

const PAGE_SIZE = 6;
const CATEGORY_LABELS = {
  'mens-shirts': 'ÁO NAM',
  'womens-dresses': 'ĐẦM NỮ',
  tops: 'THỜI TRANG',
};
const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const generation = useRef(0);
  const loadingMoreRef = useRef(false);
  const resettingRef = useRef(false);
  const productsRef = useRef([]);
  const hasMoreRef = useRef(true);
  const { totalItemCount } = useContext(CartContext);

  const loadPage = useCallback(
    async ({ reset = false, refresh = false } = {}) => {
      if (
        !reset &&
        (resettingRef.current || !hasMoreRef.current || loadingMoreRef.current)
      ) {
        return;
      }
      if (reset) {
        generation.current += 1;
        loadingMoreRef.current = false;
        resettingRef.current = true;
        productsRef.current = [];
        hasMoreRef.current = true;
      } else {
        loadingMoreRef.current = true;
      }
      const requestGeneration = generation.current;
      const offset = reset ? 0 : productsRef.current.length;

      if (refresh) {
        setRefreshing(true);
      } else if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
        const result = await fetchProducts(
          PAGE_SIZE,
          offset,
          search,
          category,
          refresh
        );
        if (requestGeneration !== generation.current) {
          return;
        }
        const nextProducts = reset
          ? result.products
          : [...productsRef.current, ...result.products];
        productsRef.current = nextProducts;
        setProducts(nextProducts);
        hasMoreRef.current = offset + result.products.length < result.total;
      } catch (loadError) {
        console.error('Failed to load clothing products:', loadError);
        if (requestGeneration === generation.current) {
          setError('Không thể tải sản phẩm. Vui lòng kiểm tra kết nối và thử lại.');
        }
      } finally {
        if (requestGeneration === generation.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
          resettingRef.current = false;
          loadingMoreRef.current = false;
        }
      }
    },
    [category, search]
  );

  useEffect(() => {
    const timer = setTimeout(() => loadPage({ reset: true }), 250);
    return () => clearTimeout(timer);
  }, [category, loadPage, search]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Detail', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.cardInfo}>
        <Text style={styles.categoryLabel}>{CATEGORY_LABELS[item.category] || 'QUẦN ÁO'}</Text>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => loadPage()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPage({ reset: true, refresh: true })}
            tintColor="#25372e"
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.brand}>STYLEME</Text>
                <Text style={styles.tagline}>MẶC ĐẸP, SỐNG CHẤT</Text>
              </View>
              <View style={styles.cartBadge}>
                <Text style={styles.cartIcon}>TÚI</Text>
                <Text style={styles.cartCount}>{totalItemCount}</Text>
              </View>
            </View>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>BỘ SƯU TẬP MỚI</Text>
              <Text style={styles.heroTitle}>Phong cách{'\n'}của riêng bạn.</Text>
              <Text style={styles.heroCaption}>Những thiết kế bạn sẽ muốn mặc mỗi ngày.</Text>
            </View>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Khám phá</Text>
                <Text style={styles.resultCount}>
                  {products.length} sản phẩm đang hiển thị
                </Text>
              </View>
              <Text style={styles.season}>2026 / SS</Text>
            </View>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchBar}
                placeholder="Tìm áo, váy..."
                placeholderTextColor="#99958d"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                accessibilityLabel="Tìm sản phẩm quần áo"
              />
            </View>
            <FlatList
              horizontal
              data={CLOTHING_CATEGORY_OPTIONS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    category === item.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(item.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === item.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" color="#25372e" />
            ) : error ? (
              <>
                <Text style={styles.emptyTitle}>Không tải được sản phẩm</Text>
                <Text style={styles.emptyText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadPage({ reset: true })}
                >
                  <Text style={styles.retryText}>THỬ LẠI</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
                <Text style={styles.emptyText}>Hãy đổi từ khóa hoặc danh mục nhé.</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#25372e" style={styles.footerLoader} />
          ) : error && products.length > 0 ? (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadPage()}
            >
              <Text style={styles.retryText}>TẢI THÊM · THỬ LẠI</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f5f0' },
  listContent: { paddingHorizontal: 18, paddingBottom: 28, flexGrow: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
  brand: { color: '#25372e', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  tagline: { color: '#88877f', fontSize: 9, letterSpacing: 2, marginTop: 3 },
  cartBadge: { minWidth: 54, height: 42, paddingHorizontal: 10, borderRadius: 22, backgroundColor: '#e8e9df', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cartIcon: { color: '#25372e', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cartCount: { color: '#25372e', fontSize: 12, fontWeight: '700' },
  hero: { minHeight: 190, justifyContent: 'center', padding: 22, borderRadius: 22, backgroundColor: '#25372e' },
  eyebrow: { color: '#d9c49a', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  heroTitle: { color: '#fffdf8', fontSize: 31, fontWeight: '700', lineHeight: 37, marginTop: 10 },
  heroCaption: { color: '#d2d7cf', fontSize: 12, marginTop: 9 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 25, marginBottom: 14 },
  sectionTitle: { color: '#25372e', fontSize: 23, fontWeight: '700' },
  resultCount: { color: '#88877f', fontSize: 12, marginTop: 4 },
  season: { color: '#77776f', fontSize: 10, letterSpacing: 1.5, paddingBottom: 3 },
  searchWrap: { height: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: '#eeece6', borderRadius: 13, paddingHorizontal: 14, marginBottom: 12 },
  searchIcon: { color: '#696c63', fontSize: 25, marginRight: 8, marginTop: -4 },
  searchBar: { flex: 1, height: '100%', color: '#25372e', fontSize: 14 },
  categoryList: { gap: 8, paddingBottom: 17 },
  categoryChip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, backgroundColor: '#eeece6' },
  categoryChipActive: { backgroundColor: '#25372e' },
  categoryChipText: { color: '#696c63', fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: '#fffdf8' },
  productRow: { justifyContent: 'space-between' },
  card: { width: '48.5%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden' },
  image: { width: '100%', height: 155, backgroundColor: '#eeece6' },
  cardInfo: { paddingHorizontal: 11, paddingTop: 10, paddingBottom: 13 },
  categoryLabel: { color: '#8c7652', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  productTitle: { color: '#25372e', fontSize: 13, fontWeight: '600', lineHeight: 18, minHeight: 36, marginTop: 5 },
  price: { color: '#25372e', fontSize: 14, fontWeight: '700', marginTop: 8 },
  emptyState: { flex: 1, minHeight: 150, justifyContent: 'center', alignItems: 'center', padding: 18 },
  emptyTitle: { color: '#25372e', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptyText: { color: '#88877f', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  retryButton: { paddingHorizontal: 18, paddingVertical: 11, backgroundColor: '#25372e', borderRadius: 10, marginTop: 12, alignSelf: 'center' },
  retryText: { color: '#fffdf8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  footerLoader: { marginVertical: 16 },
});
