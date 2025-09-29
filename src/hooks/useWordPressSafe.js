import { useState, useEffect } from 'react';

// Safe WordPress hook that won't crash the app
export const useWordPressPostsSafe = (categorySlug = null, options = {}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if WordPress is configured
    const isConfigured = () => {
      try {
        // This will safely check if WordPress config is available
        const config = require('../config/wordpress');
        return config.WORDPRESS_CONFIG.baseURL && 
               !config.WORDPRESS_CONFIG.baseURL.includes('your-wordpress-site.com');
      } catch (e) {
        return false;
      }
    };

    if (!isConfigured()) {
      setLoading(false);
      setPosts([]);
      setError('WordPress not configured');
      return;
    }

    // If WordPress is configured, try to load data
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Dynamic import to avoid build-time errors
        const { wordpressAPI, transformWordPressPost } = await import('../utils/api');
        const { WORDPRESS_CONFIG } = await import('../config/wordpress');
        
        const data = categorySlug 
          ? await wordpressAPI.getPostsByCategory(categorySlug, options)
          : await wordpressAPI.getPosts(options);
        
        const transformedPosts = data.map(transformWordPressPost);
        setPosts(transformedPosts);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching WordPress posts:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [categorySlug, JSON.stringify(options)]);

  return { posts, loading, error };
};

export const useWooCommerceProductsSafe = (options = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if WordPress is configured
    const isConfigured = () => {
      try {
        const config = require('../config/wordpress');
        return config.WORDPRESS_CONFIG.baseURL && 
               !config.WORDPRESS_CONFIG.baseURL.includes('your-wordpress-site.com');
      } catch (e) {
        return false;
      }
    };

    if (!isConfigured()) {
      setLoading(false);
      setProducts([]);
      setError('WordPress not configured');
      return;
    }

    // If WordPress is configured, try to load data
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Dynamic import to avoid build-time errors
        const { woocommerceAPI, transformWooCommerceProduct } = await import('../utils/api');
        
        const data = await woocommerceAPI.getProducts(options);
        const transformedProducts = data.map(transformWooCommerceProduct);
        setProducts(transformedProducts);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching WooCommerce products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [JSON.stringify(options)]);

  return { products, loading, error };
};
