// WordPress Configuration
export const WORDPRESS_CONFIG = {
  // WordPress site URL - use proxy in development, direct URL in production
  baseURL: import.meta.env.DEV
    ? '/api/wordpress'  // Use Vite proxy in development
    : import.meta.env.VITE_WORDPRESS_URL || 'https://nadkid.net',

  // WordPress REST API endpoints
  endpoints: {
    posts: '/wp-json/wp/v2/posts',
    pages: '/wp-json/wp/v2/pages',
    media: '/wp-json/wp/v2/media',
    categories: '/wp-json/wp/v2/categories',
    tags: '/wp-json/wp/v2/tags',
    users: '/wp-json/wp/v2/users',
    comments: '/wp-json/wp/v2/comments',
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
    consumerKey: import.meta.env.VITE_WC_CONSUMER_KEY || null,
    consumerSecret: import.meta.env.VITE_WC_CONSUMER_SECRET || null,
  },
  
  // Content settings
  content: {
    postsPerPage: 20,
    featuredImageSize: 'large',
    excerptLength: 150,
  },
  
  // Category mappings for different sections
  categories: {
    homepage: 19, // WordPress category ID for homepage content (actual: 19)
    portfolio: 2, // WordPress category ID for portfolio items (actual: 2)
    journal: 3,   // WordPress category ID for journal posts (actual: 3)
    shop: 'product', // WooCommerce product category (still uses slug)
  },

  // Category slugs (these match the actual category slugs on your site)
  categorySlugs: {
    homepage: 'homepage', // Category slug for homepage content
    portfolio: 'portfolio', // Category slug for portfolio
    journal: 'journal',     // Category slug for journal
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint, params = {}) => {
  const baseUrl = WORDPRESS_CONFIG.baseURL;

  // Handle relative URLs (for development proxy)
  if (baseUrl.startsWith('/')) {
    // For development proxy, construct the full URL
    const fullUrl = `${window.location.origin}${baseUrl}${endpoint}`;
    const url = new URL(fullUrl);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  } else {
    // For production, use the full WordPress URL
    const url = new URL(endpoint, baseUrl);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }
};

// Helper function to get featured image URL
export const getFeaturedImageUrl = (mediaId, size = 'large') => {
  if (!mediaId) return null;

  const baseUrl = WORDPRESS_CONFIG.baseURL;

  if (baseUrl.startsWith('/')) {
    // For development proxy - construct full URL
    return `${window.location.origin}${baseUrl}/wp-json/wp/v2/media/${mediaId}`;
  } else {
    // For production
    return `${baseUrl}/wp-json/wp/v2/media/${mediaId}`;
  }
};

// Helper function to get the actual image URL from media object
export const getMediaUrl = (mediaObject, size = 'large') => {
  if (!mediaObject) return null;

  // If it's already a URL string, return it
  if (typeof mediaObject === 'string') return mediaObject;

  // If it's a media object from WordPress API, get the source URL
  if (mediaObject.source_url) return mediaObject.source_url;

  // If it's a media object with sizes, get the specified size or fallback to full
  if (mediaObject.media_details?.sizes) {
    const sizeKey = size === 'large' ? 'large' : size === 'medium' ? 'medium' : 'thumbnail';
    return mediaObject.media_details.sizes[sizeKey]?.source_url || mediaObject.source_url;
  }

  return mediaObject.source_url || null;
};

// Helper function to format WordPress date
export const formatWordPressDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
