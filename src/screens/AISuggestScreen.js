//Ngô Kim Trâm_CE191681
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getOutfitRecommendations } from '../services/aiService';
import { fetchClothingCatalog } from '../services/apiService';

const OCCASIONS = ['Đi tiệc cưới', 'Đi làm', 'Đi tập gym', 'Phong cách mùa hè'];

export default function AISuggestScreen({ navigation }) {
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [occasion, setOccasion] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      setCatalog(await fetchClothingCatalog());
    } catch (loadError) {
      console.error('Failed to load catalog for AI stylist:', loadError);
      setCatalogError('Không tải được danh mục quần áo. Vui lòng thử lại.');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadInitialCatalog = async () => {
      try {
        const products = await fetchClothingCatalog();
        if (isActive) {
          setCatalog(products);
        }
      } catch (loadError) {
        console.error('Failed to load catalog for AI stylist:', loadError);
        if (isActive) {
          setCatalogError('Không tải được danh mục quần áo. Vui lòng thử lại.');
        }
      } finally {
        if (isActive) {
          setCatalogLoading(false);
        }
      }
    };

    loadInitialCatalog();
    return () => {
      isActive = false;
    };
  }, []);

  const requestAdvice = async () => {
    if (!occasion.trim() || loading) {
      setError('Hãy chọn dịp hoặc nhập phong cách bạn muốn.');
      return;
    }
    if (!catalog.length) {
      setError('Chưa có sản phẩm để phối đồ.');
      return;
    }

    setLoading(true);
    setError('');
    setAdvice('');
    setRecommendations([]);
    try {
      const result = await getOutfitRecommendations(occasion, catalog);
      setRecommendations(result.recommendations);
      setAdvice(result.advice);
    } catch (requestError) {
      console.error('Failed to generate outfit recommendations:', requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Chưa thể tạo gợi ý. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('HomeTab', {
          screen: 'Detail',
          params: { product: item },
        })
      }
    >
      <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={recommendations}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderProduct}
      numColumns={2}
      columnWrapperStyle={recommendations.length ? styles.productRow : undefined}
      ListHeaderComponent={
        <View>
          <Text style={styles.eyebrow}>STYLEME / PERSONAL STYLIST</Text>
          <Text style={styles.title}>Mặc gì hôm nay?</Text>
          <Text style={styles.subtitle}>
            Chia sẻ dịp bạn sắp đến, stylist sẽ chọn đồ từ bộ sưu tập hiện có.
          </Text>
          <View style={styles.occasionChoices}>
            {OCCASIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.occasionChip,
                  occasion === item && styles.occasionChipSelected,
                ]}
                onPress={() => {
                  setOccasion(item);
                  setError('');
                }}
              >
                <Text
                  style={[
                    styles.occasionText,
                    occasion === item && styles.occasionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={occasion}
            onChangeText={(value) => {
              setOccasion(value);
              setError('');
            }}
            placeholder="Hoặc nhập phong cách của bạn..."
            placeholderTextColor="#99958d"
            accessibilityLabel="Dịp hoặc phong cách muốn phối đồ"
            returnKeyType="done"
            onSubmitEditing={requestAdvice}
          />
          <TouchableOpacity
            style={[styles.submitButton, (loading || catalogLoading) && styles.disabledButton]}
            disabled={loading || catalogLoading}
            onPress={requestAdvice}
          >
            {loading ? (
              <ActivityIndicator color="#fffdf8" />
            ) : (
              <Text style={styles.submitText}>TẠO GỢI Ý PHỐI ĐỒ</Text>
            )}
          </TouchableOpacity>
          {catalogLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#25372e" />
              <Text style={styles.stateText}>Đang tải bộ sưu tập...</Text>
            </View>
          ) : catalogError ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{catalogError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadCatalog}>
                <Text style={styles.retryText}>TẢI LẠI</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {advice ? (
            <View style={styles.adviceCard}>
              <Text style={styles.adviceEyebrow}>GỢI Ý DÀNH RIÊNG CHO BẠN</Text>
              <Text style={styles.adviceText}>{advice}</Text>
              <Text style={styles.catalogNote}>
                {recommendations.length} sản phẩm đã đối chiếu với danh mục StyleMe.
              </Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={requestAdvice}>
                <Text style={styles.inlineRetry}>THỬ LẠI</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {recommendations.length > 0 ? (
            <Text style={styles.resultsTitle}>Món đồ được chọn</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !catalogLoading && !catalogError && !loading && !error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyMark}>✳</Text>
            <Text style={styles.emptyTitle}>Phong cách bắt đầu từ bạn</Text>
            <Text style={styles.stateText}>Chọn dịp ở trên để nhận gợi ý từ bộ sưu tập quần áo.</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f5f0' },
  content: { padding: 20, paddingBottom: 28, flexGrow: 1 },
  eyebrow: { color: '#8c7652', fontSize: 9, fontWeight: '700', letterSpacing: 1.7, marginTop: 10 },
  title: { color: '#25372e', fontSize: 28, fontWeight: '700', marginTop: 8 },
  subtitle: { color: '#88877f', fontSize: 13, lineHeight: 20, marginTop: 7 },
  occasionChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  occasionChip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 20, backgroundColor: '#eeece6' },
  occasionChipSelected: { backgroundColor: '#e0e5dc' },
  occasionText: { color: '#686a62', fontSize: 12, fontWeight: '600' },
  occasionTextSelected: { color: '#25372e' },
  input: { minHeight: 48, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, marginTop: 14, color: '#25372e', fontSize: 13 },
  submitButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25372e', borderRadius: 12, marginTop: 12 },
  disabledButton: { opacity: 0.65 },
  submitText: { color: '#fffdf8', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  stateBox: { alignItems: 'center', padding: 20 },
  stateText: { color: '#88877f', fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  retryButton: { backgroundColor: '#25372e', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11, marginTop: 12 },
  retryText: { color: '#fffdf8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  adviceCard: { backgroundColor: '#e8e9df', borderRadius: 15, padding: 16, marginTop: 18 },
  adviceEyebrow: { color: '#8c7652', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  adviceText: { color: '#34463a', fontSize: 14, lineHeight: 22, marginTop: 8 },
  catalogNote: { color: '#7c8478', fontSize: 10, marginTop: 10 },
  errorBox: { backgroundColor: '#f3e5df', borderRadius: 12, padding: 13, marginTop: 12 },
  errorText: { color: '#8c4b3c', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  inlineRetry: { color: '#25372e', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  resultsTitle: { color: '#25372e', fontSize: 18, fontWeight: '700', marginTop: 22, marginBottom: 12 },
  productRow: { justifyContent: 'space-between', gap: 12 },
  productCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 9, marginBottom: 12 },
  productImage: { width: '100%', height: 140, borderRadius: 10, backgroundColor: '#eeece6' },
  productTitle: { color: '#25372e', fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 8 },
  productPrice: { color: '#25372e', fontSize: 13, fontWeight: '700', marginTop: 5 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  emptyMark: { color: '#8c7652', fontSize: 31 },
  emptyTitle: { color: '#25372e', fontSize: 15, fontWeight: '700', marginTop: 10 },
});
