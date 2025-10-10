import { WORDPRESS_CONFIG, buildApiUrl, getMediaUrl } from '../config/wordpress.js';

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
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Non-JSON response:', responseText);
      throw new Error('API returned non-JSON response');
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
      _embed: 'wp:featuredmedia,wp:term,author', // Include featured images, categories, and author info
      ...params,
    });
    return fetchFromAPI(url);
  },

  // Get posts by category
  getPostsByCategory: async (categorySlug, params = {}) => {
    // First try to get category ID from configuration
    let categoryId = WORDPRESS_CONFIG.categories[categorySlug];

    // If not found in configuration, fetch category ID by slug
    if (!categoryId) {
      try {
        // First, get the category ID by fetching the category by slug
        const categoriesUrl = buildApiUrl(WORDPRESS_CONFIG.endpoints.categories, {
          slug: categorySlug,
        });
        const categories = await fetchFromAPI(categoriesUrl);
        
        if (categories && categories.length > 0) {
          categoryId = categories[0].id;
        } else {
          console.error(`Category '${categorySlug}' not found`);
          return [];
        }
      } catch (error) {
        console.error(`Error fetching category '${categorySlug}':`, error);
        return [];
      }
    }

    // Use category ID to fetch posts
    try {
      const result = await wordpressAPI.getPosts({
        categories: categoryId,
        ...params,
      });
      return result || [];
    } catch (error) {
      console.error(`Error fetching posts for category '${categorySlug}':`, error);
      return [];
    }
  },

  // Get comments for a specific post
  getComments: async (postId, params = {}) => {
    const url = buildApiUrl(WORDPRESS_CONFIG.endpoints.comments, {
      post: postId,
      per_page: 100, // Get up to 100 comments
      orderby: 'date',
      order: 'asc',
      status: 'approve', // Only approved comments
      ...params,
    });
    return fetchFromAPI(url);
  },

  // Submit a new comment using traditional WordPress comment form
  submitComment: async (commentData) => {
    // Use the traditional WordPress comment form endpoint instead of REST API
    const baseUrl = WORDPRESS_CONFIG.baseURL;
    const commentUrl = baseUrl.startsWith('/') 
      ? `${window.location.origin}${baseUrl}/wp-comments-post.php`
      : `${baseUrl}/wp-comments-post.php`;
    
    const formData = new FormData();
    formData.append('comment_post_ID', commentData.postId);
    formData.append('author', commentData.authorName);
    formData.append('email', commentData.authorEmail);
    formData.append('url', commentData.authorUrl || '');
    formData.append('comment', commentData.content);
    formData.append('comment_parent', commentData.parentId || 0);
    formData.append('submit', 'Post Comment');
    
    const options = {
      method: 'POST',
      headers: {
        // Don't set Content-Type, let the browser set it with boundary for FormData
      },
      body: formData,
    };

    try {
      const response = await fetch(commentUrl, options);
      
      // WordPress comment form returns HTML, not JSON
      // We check for success by looking for specific HTML content
      const responseText = await response.text();
      
      if (response.ok && !responseText.includes('error')) {
        // Comment submitted successfully
        return { success: true, message: 'Comment submitted successfully' };
      } else {
        // Extract error message from HTML response
        const errorMatch = responseText.match(/<p[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)<\/p>/i);
        const errorMessage = errorMatch ? errorMatch[1] : 'Failed to submit comment';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      throw error;
    }
  },

};

// WooCommerce API
export const woocommerceAPI = {
  // Get all products
  getProducts: async (params = {}) => {
    const url = buildApiUrl(WORDPRESS_CONFIG.woocommerce.products, {
      per_page: WORDPRESS_CONFIG.content.postsPerPage,
      status: 'publish', // Only get published products
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

  // Create a new order
  createOrder: async (orderData) => {
    const url = buildApiUrl(WORDPRESS_CONFIG.woocommerce.orders);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    };
    
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers['Authorization'] = `Basic ${auth}`;
    }
    
    return fetchFromAPI(url, options);
  },

  // Get order by ID
  getOrder: async (orderId) => {
    const url = buildApiUrl(`${WORDPRESS_CONFIG.woocommerce.orders}/${orderId}`);
    
    const options = {};
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers = {
        'Authorization': `Basic ${auth}`,
      };
    }
    
    return fetchFromAPI(url, options);
  },

  // Create a customer
  createCustomer: async (customerData) => {
    const url = buildApiUrl(WORDPRESS_CONFIG.woocommerce.customers);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    };
    
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers['Authorization'] = `Basic ${auth}`;
    }
    
    return fetchFromAPI(url, options);
  },

  // Calculate shipping costs using WooCommerce shipping calculator
  calculateShipping: async (shippingData) => {
    const url = buildApiUrl('/wp-json/wc/v3/shipping/calculator');
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shippingData),
    };
    
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers['Authorization'] = `Basic ${auth}`;
    }
    
    return fetchFromAPI(url, options);
  },

  // Get shipping packages (alternative method)
  getShippingPackages: async (packageData) => {
    const url = buildApiUrl('/wp-json/wc/v3/shipping/packages');
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packageData),
    };
    
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers['Authorization'] = `Basic ${auth}`;
    }
    
    return fetchFromAPI(url, options);
  },

  // Get shipping zones
  getShippingZones: async () => {
    const url = buildApiUrl('/wp-json/wc/v3/shipping/zones');
    
    const options = {};
    if (WORDPRESS_CONFIG.auth.consumerKey && WORDPRESS_CONFIG.auth.consumerSecret) {
      const auth = btoa(`${WORDPRESS_CONFIG.auth.consumerKey}:${WORDPRESS_CONFIG.auth.consumerSecret}`);
      options.headers = {
        'Authorization': `Basic ${auth}`,
      };
    }
    
    return fetchFromAPI(url, options);
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
    featuredImage: getMediaUrl(featuredMedia, WORDPRESS_CONFIG.content.featuredImageSize) || null,
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
    stockQuantity: product.stock_quantity,
    inStock: product.stock_status === 'instock',
    manageStock: product.manage_stock,
    backorders: product.backorders,
    permalink: product.permalink,
    dateCreated: product.date_created,
    dateModified: product.date_modified,
    sku: product.sku,
    weight: product.weight,
    dimensions: product.dimensions,
    attributes: product.attributes || [],
    variations: product.variations || [],
    type: product.type,
    status: product.status,
  };
};

export const transformWooCommerceOrder = (order) => {
  return {
    id: order.id,
    status: order.status,
    currency: order.currency,
    total: order.total,
    subtotal: order.subtotal,
    totalTax: order.total_tax,
    shippingTotal: order.shipping_total,
    dateCreated: order.date_created,
    dateModified: order.date_modified,
    customerId: order.customer_id,
    billing: order.billing,
    shipping: order.shipping,
    lineItems: order.line_items || [],
    paymentMethod: order.payment_method,
    paymentMethodTitle: order.payment_method_title,
    transactionId: order.transaction_id,
    orderKey: order.order_key,
    number: order.number,
  };
};

export const transformWooCommerceCustomer = (customer) => {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    username: customer.username,
    dateCreated: customer.date_created,
    dateModified: customer.date_modified,
    billing: customer.billing,
    shipping: customer.shipping,
    isPayingCustomer: customer.is_paying_customer,
    avatarUrl: customer.avatar_url,
    role: customer.role,
  };
};

export const transformWordPressComment = (comment) => {
  return {
    id: comment.id,
    author: comment.author_name,
    authorEmail: comment.author_email,
    authorUrl: comment.author_url,
    authorAvatar: comment.author_avatar_urls?.['96'] || null,
    content: comment.content.rendered,
    date: comment.date,
    dateGmt: comment.date_gmt,
    parent: comment.parent,
    post: comment.post,
    status: comment.status,
    type: comment.type,
    meta: comment.meta,
    link: comment.link,
  };
};
