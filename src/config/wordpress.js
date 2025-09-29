// WordPress Configuration
export const WORDPRESS_CONFIG = {
  // Replace with your WordPress site URL
  baseURL: (typeof process !== 'undefined' && process.env?.REACT_APP_WORDPRESS_URL) || 'https://your-wordpress-site.com',
  
  // WordPress REST API endpoints
  endpoints: {
    posts: '/wp-json/wp/v2/posts',
    pages: '/wp-json/wp/v2/pages',
    media: '/wp-json/wp/v2/media',
    categories: '/wp-json/wp/v2/categories',
    tags: '/wp-json/wp/v2/tags',
    users: '/wp-json/wp/v2/users',
  },
  
  // WooCommerce endpoints (if WooCommerce is installed)
  woocommerce: {
    products: '/wp-json/wc/v3/products',
    orders: '/wp-json/wc/v3/orders',
    customers: '/wp-json/wc/v3/customers',
  },
  
  // API authentication
  auth: {
    // For public WordPress sites, you might not need authentication
    // For private sites or custom endpoints, you'll need API keys
    consumerKey: (typeof process !== 'undefined' && process.env?.REACT_APP_WC_CONSUMER_KEY) || null,
    consumerSecret: (typeof process !== 'undefined' && process.env?.REACT_APP_WC_CONSUMER_SECRET) || null,
  },
  
  // Content settings
  content: {
    postsPerPage: 20,
    featuredImageSize: 'large',
    excerptLength: 150,
  },
  
  // Category mappings for different sections
  categories: {
    portfolio: 'portfolio', // WordPress category slug for portfolio items
    journal: 'journal',     // WordPress category slug for journal posts
    shop: 'product',       // WooCommerce product category
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint, params = {}) => {
  const baseUrl = WORDPRESS_CONFIG.baseURL;
  const url = new URL(endpoint, baseUrl);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

// Helper function to get featured image URL
export const getFeaturedImageUrl = (mediaId, size = 'large') => {
  if (!mediaId) return null;
  return `${WORDPRESS_CONFIG.baseURL}/wp-json/wp/v2/media/${mediaId}`;
};

// Helper function to format WordPress date
export const formatWordPressDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
