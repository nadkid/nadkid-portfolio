import { WORDPRESS_CONFIG, buildApiUrl } from '../config/wordpress.js';

// Generic API fetch function with error handling
const fetchFromAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

// WordPress Posts API
export const wordpressAPI = {
  // Get all posts
  getPosts: async (params = {}) => {
    const url = buildApiUrl(WORDPRESS_CONFIG.endpoints.posts, {
      per_page: WORDPRESS_CONFIG.content.postsPerPage,
      _embed: true, // Include featured images and author info
      ...params,
    });
    return fetchFromAPI(url);
  },

  // Get posts by category
  getPostsByCategory: async (categorySlug, params = {}) => {
    return wordpressAPI.getPosts({
      categories: categorySlug,
      ...params,
    });
  },

  // Get single post
  getPost: async (id) => {
    const url = buildApiUrl(`${WORDPRESS_CONFIG.endpoints.posts}/${id}`, {
      _embed: true,
    });
    return fetchFromAPI(url);
  },

  // Get media by ID
  getMedia: async (id) => {
    const url = buildApiUrl(`${WORDPRESS_CONFIG.endpoints.media}/${id}`);
    return fetchFromAPI(url);
  },

  // Get categories
  getCategories: async () => {
    const url = buildApiUrl(WORDPRESS_CONFIG.endpoints.categories);
    return fetchFromAPI(url);
  },
};

// WooCommerce API
export const woocommerceAPI = {
  // Get all products
  getProducts: async (params = {}) => {
    const url = buildApiUrl(WORDPRESS_CONFIG.woocommerce.products, {
      per_page: WORDPRESS_CONFIG.content.postsPerPage,
      ...params,
    });
    
    // Add WooCommerce authentication if needed
    const options = {};
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers = {
        'Authorization': `Basic ${auth}`,
      };
    }
    
    return fetchFromAPI(url, options);
  },

  // Get single product
  getProduct: async (id) => {
    const url = buildApiUrl(`${WORDPRESS_CONFIG.woocommerce.products}/${id}`);
    
    const options = {};
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers = {
        'Authorization': `Basic ${auth}`,
      };
    }
    
    return fetchFromAPI(url, options);
  },

  // Get products by category
  getProductsByCategory: async (categoryId, params = {}) => {
    return woocommerceAPI.getProducts({
      category: categoryId,
      ...params,
    });
  },
};

// Data transformation utilities
export const transformWordPressPost = (post) => {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  
  return {
    id: post.id,
    title: post.title.rendered,
    content: post.content.rendered,
    excerpt: post.excerpt.rendered,
    date: post.date,
    slug: post.slug,
    featuredImage: featuredMedia?.source_url || null,
    featuredImageAlt: featuredMedia?.alt_text || '',
    categories: post._embedded?.['wp:term']?.[0] || [],
    author: post._embedded?.author?.[0] || null,
    link: post.link,
  };
};

export const transformWooCommerceProduct = (product) => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    shortDescription: product.short_description,
    price: product.price,
    regularPrice: product.regular_price,
    salePrice: product.sale_price,
    images: product.images || [],
    categories: product.categories || [],
    tags: product.tags || [],
    stockStatus: product.stock_status,
    inStock: product.stock_status === 'instock',
    permalink: product.permalink,
    dateCreated: product.date_created,
    dateModified: product.date_modified,
  };
};
