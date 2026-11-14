//Ngô Kim Trâm_CE191681
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { getGeminiShoppingAdvice } from '../services/aiService';
import {
  isFirebaseConfigured,
  saveWishlistToFirebase,
} from '../services/firebaseService';
import { sendLocalNotification } from '../services/notificationService';

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;
const CATEGORY_LABELS = {
  'mens-shirts': 'ÁO NAM',
  'womens-dresses': 'ĐẦM NỮ',
  tops: 'THỜI TRANG',
};
const SIZES = ['S', 'M', 'L', 'XL'];
const COLORS = [
  { name: 'Đen', hex: '#252525' },
  { name: 'Kem', hex: '#d9ceb9' },
  { name: 'Xanh', hex: '#526c76' },
];

export default function ProductDetailScreen({ route }) {
  const { product } = route.params;
  const { addToCart, addToWishlist } = useContext(CartContext);
  const { width } = useWindowDimensions();
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].name);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    sendLocalNotification('Giỏ hàng', `Đã thêm ${product.title} vào giỏ hàng!`, { showAlert: false });
    Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng!');
  };

  const handleSaveWishlist = async () => {
    setSavingWishlist(true);
    addToWishlist(product);
    if (!isFirebaseConfigured) {
      setSavingWishlist(false);
      Alert.alert(
        'Đã lưu trên thiết bị',
        'Sản phẩm đã được lưu vào danh sách yêu thích trên thiết bị này.'
      );
      return;
    }

    try {
      await saveWishlistToFirebase(product);
      Alert.alert('Đã lưu', 'Sản phẩm đã được thêm vào danh sách yêu thích.');
    } catch (error) {
      console.error('Failed to save wishlist:', error);
      Alert.alert(
        'Đã lưu trên thiết bị',
        error instanceof Error ? error.message : 'Chưa thể đồng bộ lên Firebase.'
      );
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleAskAI = async () => {
    setLoadingAi(true);
    setAiAdvice('');
    try {
      const advice = await getGeminiShoppingAdvice(product.title, product.description);
      setAiAdvice(advice);
    } catch (error) {
      Alert.alert(
        'Chưa thể tư vấn',
        error instanceof Error ? error.message : 'Vui lòng thử lại sau.'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.imageStage, { height: Math.min(width * 0.88, 410) }]}>
          <Image
            source={{ uri: product.thumbnail }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={`Ảnh ${product.title}`}
          />
          <View style={styles.imageTag}>
            <Text style={styles.imageTagText}>STYLEME EDIT</Text>
          </View>
          {product.rating ? (
            <View style={styles.rating}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>
              {CATEGORY_LABELS[product.category] || 'THỜI TRANG'}
            </Text>
            <Text style={styles.availability}>
              • {product.stock > 0 ? 'CÒN HÀNG' : 'HẾT HÀNG'}
            </Text>
          </View>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <View style={styles.rule} />

          <View style={styles.optionHeader}>
            <Text style={styles.sectionTitle}>Kích cỡ</Text>
            <Text style={styles.selectedOption}>{selectedSize}</Text>
          </View>
          <View style={styles.sizeOptions}>
            {SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedSize === size }}
                style={[
                  styles.sizeOption,
                  selectedSize === size && styles.sizeOptionSelected,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={[
                    styles.sizeOptionText,
                    selectedSize === size && styles.sizeOptionTextSelected,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.optionHeader, styles.colorHeader]}>
            <Text style={styles.sectionTitle}>Màu sắc</Text>
            <Text style={styles.selectedOption}>{selectedColor}</Text>
          </View>
          <View style={styles.colorOptions}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color.name}
                accessibilityRole="button"
                accessibilityLabel={`Chọn màu ${color.name}`}
                accessibilityState={{ selected: selectedColor === color.name }}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.hex },
                  selectedColor === color.name && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color.name)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.description}>{product.description}</Text>

          <TouchableOpacity
            style={styles.wishlistButton}
            activeOpacity={0.75}
            disabled={savingWishlist}
            onPress={handleSaveWishlist}
          >
            {savingWishlist ? (
              <ActivityIndicator size="small" color="#25372e" />
            ) : (
              <Text style={styles.heart}>♡</Text>
            )}
            <Text style={styles.wishlistLabel}>
              {savingWishlist ? 'ĐANG LƯU...' : 'LƯU VÀO DANH SÁCH YÊU THÍCH'}
            </Text>
          </TouchableOpacity>

          {loadingAi ? (
            <View style={styles.adviceBox}>
              <ActivityIndicator color="#25372e" />
              <Text style={styles.adviceLoading}>Đang chuẩn bị gợi ý phối đồ...</Text>
            </View>
          ) : null}
          {aiAdvice ? (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceEyebrow}>STYLEME / STYLE ADVICE</Text>
              <Text style={styles.adviceTitle}>Gợi ý dành cho bạn</Text>
              <Text style={styles.adviceText}>{aiAdvice}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.adviceButton}
          activeOpacity={0.8}
          disabled={loadingAi}
          onPress={handleAskAI}
        >
          <Text style={styles.adviceButtonText}>Tư vấn phối đồ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={handleAddToCart}
        >
          <Text style={styles.addButtonText}>THÊM VÀO TÚI  ·  {formatPrice(product.price)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f5f0' },
  scrollContent: { paddingBottom: 14 },
  imageStage: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#eeece6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  imageTag: {
    position: 'absolute',
    top: 16,
    left: 18,
    backgroundColor: '#f7f5f0',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },
  imageTagText: { color: '#25372e', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  rating: {
    position: 'absolute',
    right: 17,
    bottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdf8',
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  ratingStar: { color: '#a27e41', fontSize: 12, marginRight: 5 },
  ratingText: { color: '#25372e', fontSize: 11, fontWeight: '700' },
  content: { paddingHorizontal: 21, paddingTop: 20, paddingBottom: 14, alignSelf: 'center', width: '100%', maxWidth: 720 },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  category: { color: '#8c7652', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  availability: { color: '#647767', fontSize: 9, fontWeight: '600', letterSpacing: 0.7, marginLeft: 10 },
  title: { color: '#25372e', fontSize: 25, fontWeight: '700', lineHeight: 32, marginTop: 9 },
  price: { color: '#25372e', fontSize: 21, fontWeight: '700', marginTop: 8 },
  rule: { height: 1, backgroundColor: '#e5e1d7', marginVertical: 19 },
  sectionTitle: { color: '#25372e', fontSize: 14, fontWeight: '700' },
  optionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedOption: { color: '#88877f', fontSize: 12 },
  sizeOptions: { flexDirection: 'row', gap: 9, marginTop: 10 },
  sizeOption: {
    width: 43,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dedbd1',
    backgroundColor: '#fff',
  },
  sizeOptionSelected: { backgroundColor: '#25372e', borderColor: '#25372e' },
  sizeOptionText: { color: '#25372e', fontSize: 12, fontWeight: '600' },
  sizeOptionTextSelected: { color: '#fffdf8' },
  colorHeader: { marginTop: 18 },
  colorOptions: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 18 },
  colorOption: { width: 27, height: 27, borderRadius: 14 },
  colorOptionSelected: { borderWidth: 3, borderColor: '#f7f5f0', shadowColor: '#25372e', shadowOpacity: 0.7, shadowRadius: 0, elevation: 2 },
  description: { color: '#77776f', fontSize: 13, lineHeight: 21, marginTop: 7 },
  wishlistButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d8d6cc',
    borderRadius: 12,
    marginTop: 18,
  },
  heart: { color: '#8c7652', fontSize: 21, marginRight: 8, marginTop: -2 },
  wishlistLabel: { color: '#25372e', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  adviceBox: {
    padding: 15,
    backgroundColor: '#e8e9df',
    borderRadius: 14,
    marginTop: 16,
  },
  adviceEyebrow: { color: '#8c7652', fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  adviceTitle: { color: '#25372e', fontSize: 15, fontWeight: '700', marginTop: 6 },
  adviceText: { color: '#60665d', fontSize: 13, lineHeight: 20, marginTop: 6 },
  adviceLoading: { color: '#60665d', fontSize: 12, textAlign: 'center', marginTop: 9 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 13,
    backgroundColor: '#fffdf9',
    borderTopWidth: 1,
    borderTopColor: '#e8e5dd',
    gap: 9,
  },
  adviceButton: {
    minHeight: 47,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eeece6',
    borderRadius: 12,
  },
  adviceButtonText: { color: '#25372e', fontSize: 11, fontWeight: '700' },
  addButton: {
    flex: 1,
    minHeight: 47,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25372e',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  addButtonText: { color: '#fffdf8', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
});
