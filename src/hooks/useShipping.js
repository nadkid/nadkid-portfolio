import { useState, useEffect } from 'react';

export const useShipping = (customerInfo, cartItems) => {
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const calculateShippingCost = () => {
      setLoading(true);
      setError(null);
      setShippingCost(0);

      // Only calculate if we have country info and cart items
      if (!customerInfo?.country || cartItems.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Simple country-based shipping rates
        if (customerInfo.country === 'JP') {
          // Japan: $15 shipping
          setShippingCost(15);
        } else {
          // All other countries: $40 shipping
          setShippingCost(40);
        }
      } catch (err) {
        setError(`Failed to calculate shipping: ${err.message}`);
        setShippingCost(0);
      } finally {
        setLoading(false);
      }
    };

    calculateShippingCost();
  }, [customerInfo?.country, cartItems]);

  return { shippingCost, loading, error };
};