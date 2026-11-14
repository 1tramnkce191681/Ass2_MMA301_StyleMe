//Ngô Kim Trâm_CE191681
const BASE_URL = 'https://dummyjson.com/products';
const CLOTHING_CATEGORIES = ['mens-shirts', 'womens-dresses', 'tops'];
const PRODUCT_LIMIT = 20;

let clothingProductsRequest;

const normalizeProduct = (product) => ({
  id: product.id,
  title: product.title,
  price: Number(product.price),
  image: product.thumbnail || product.images?.[0] || '',
  thumbnail: product.thumbnail || product.images?.[0] || '',
  description: product.description || '',
  category: product.category,
  rating: Number(product.rating) || 0,
  stock: Number(product.stock) || 0,
});

export const isClothingProduct = (product) =>
  CLOTHING_CATEGORIES.includes(product?.category);

export const CLOTHING_CATEGORY_OPTIONS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'mens-shirts', label: 'Áo nam' },
  { id: 'womens-dresses', label: 'Đầm nữ' },
  { id: 'tops', label: 'Thời trang' },
];

export const fetchClothingCatalog = async (shouldRefresh = false) => {
  if (shouldRefresh) {
    clothingProductsRequest = undefined;
  }

  if (!clothingProductsRequest) {
    clothingProductsRequest = Promise.all(
      CLOTHING_CATEGORIES.map(async (category) => {
        const response = await fetch(`${BASE_URL}/category/${category}?limit=100`);
        if (!response.ok) {
          throw new Error(`Không thể tải danh mục ${category}: HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.products)) {
          throw new Error(`Dữ liệu danh mục ${category} không hợp lệ.`);
        }
        return data.products;
      })
    )
      .then((categories) =>
        categories
          .flat()
          .filter(isClothingProduct)
          .sort((first, second) => first.id - second.id)
          .slice(0, PRODUCT_LIMIT)
          .map(normalizeProduct)
      )
      .catch((error) => {
        clothingProductsRequest = undefined;
        throw error;
      });
  }

  return clothingProductsRequest;
};

export const fetchProducts = async (
  limit = 10,
  skip = 0,
  searchQuery = '',
  category = 'all',
  shouldRefresh = false
) => {
  const products = await fetchClothingCatalog(shouldRefresh);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesQuery = product.title.toLocaleLowerCase().includes(normalizedQuery);
    const matchesCategory = category === 'all' || product.category === category;
    return matchesQuery && matchesCategory;
  });

  return {
    products: filteredProducts.slice(skip, skip + limit),
    total: filteredProducts.length,
  };
};
