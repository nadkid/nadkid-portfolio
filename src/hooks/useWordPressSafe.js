import { useState, useEffect } from 'react';

// Generic safe WordPress hook that won't crash the app
const useWordPressSafe = (apiType, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if WordPress is configured
    const isConfigured = () => {
      try {
        // Check if environment variables are available
        return import.meta.env.VITE_WORDPRESS_URL &&
               !import.meta.env.VITE_WORDPRESS_URL.includes('your-wordpress-site.com');
      } catch (e) {
        return false;
      }
    };

    if (!isConfigured()) {
      setLoading(false);
      setData([]);
      setError('WordPress not configured');
      return;
    }

    setLoading(true);
    setError(null);

    // If WordPress is configured, try to load data
    const fetchData = async () => {
      try {
        const { wordpressAPI, woocommerceAPI, transformWordPressPost, transformWooCommerceProduct } = await import('../utils/api');

        let result;
        if (apiType === 'posts') {
          const { categorySlug } = options;
          result = categorySlug
            ? await wordpressAPI.getPostsByCategory(categorySlug, options)
            : await wordpressAPI.getPosts(options);
          const transformedData = result.map(transformWordPressPost);
          setData(transformedData);
        } else if (apiType === 'products') {
          result = await woocommerceAPI.getProducts(options);
          const transformedData = result.map(transformWooCommerceProduct);
          setData(transformedData);
        }
      } catch (err) {
        // Enhanced error handling for WooCommerce
        let errorMessage = err.message;
        
        if (apiType === 'products') {
          if (err.message.includes('401') || err.message.includes('cannot list resources')) {
            errorMessage = 'WooCommerce API authentication required. Please configure your API credentials.';
          } else if (err.message.includes('404')) {
            errorMessage = 'WooCommerce API endpoint not found. Please check your WordPress URL configuration.';
          } else if (err.message.includes('403')) {
            errorMessage = 'WooCommerce API access denied. Please check your API permissions.';
          } else if (err.message.includes('CORS')) {
            errorMessage = 'CORS error: Please ensure your WordPress site allows cross-origin requests.';
          }
        }
        
        setError(errorMessage);
        console.error('Error fetching data:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiType, JSON.stringify(options)]);

  return { data, loading, error };
};

// Specific hooks using the generic implementation
export const useWordPressPostsSafe = (categorySlug = null, options = {}) => {
  return useWordPressSafe('posts', { ...options, categorySlug });
};

export const useWooCommerceProductsSafe = (options = {}) => {
  return useWordPressSafe('products', options);
};

// Cart management hook
export const useCart = () => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('woocommerce-cart');
    return savedCart ? JSON.parse(savedCart) : { items: [], total: 0, itemCount: 0 };
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('woocommerce-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    // Check stock availability before adding to cart
    if (!product.inStock) {
      throw new Error('This product is currently out of stock');
    }

    if (product.manageStock && product.stockQuantity !== null && product.stockQuantity < quantity) {
      throw new Error(`Only ${product.stockQuantity} items available in stock`);
    }

    setCart(prevCart => {
      const existingItem = prevCart.items.find(item => item.id === product.id);
      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

      // Check if adding this quantity would exceed stock
      if (product.manageStock && product.stockQuantity !== null && newQuantity > product.stockQuantity) {
        throw new Error(`Cannot add ${quantity} items. Only ${product.stockQuantity - (existingItem?.quantity || 0)} more available in stock`);
      }

      let newItems;
      if (existingItem) {
        newItems = prevCart.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        newItems = [...prevCart.items, { ...product, quantity }];
      }

      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total: parseFloat(total.toFixed(2)),
        itemCount
      };
    });
  };

  // Validate cart items against current stock levels
  const validateCartStock = (products) => {
    setCart(prevCart => {
      const validatedItems = prevCart.items.filter(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return false;
        
        // Check if product is still in stock
        if (!product.inStock) return false;
        
        // Check stock quantity if managed
        if (product.manageStock && product.stockQuantity !== null) {
          return item.quantity <= product.stockQuantity;
        }
        
        return true;
      });

      const total = validatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      const itemCount = validatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: validatedItems,
        total: parseFloat(total.toFixed(2)),
        itemCount
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(item => item.id !== productId);
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total: parseFloat(total.toFixed(2)),
        itemCount
      };
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      const newItems = prevCart.items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total: parseFloat(total.toFixed(2)),
        itemCount
      };
    });
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, itemCount: 0 });
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    validateCartStock
  };
};
