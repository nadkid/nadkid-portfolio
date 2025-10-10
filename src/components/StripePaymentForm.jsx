import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';

// Initialize Stripe
const stripePromise = (() => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey || publishableKey === 'pk_test_your_stripe_publishable_key_here') {
    return null;
  }
  return loadStripe(publishableKey);
})();

// Payment form component
const PaymentForm = ({ 
  total, 
  onPaymentSuccess, 
  onPaymentError, 
  customerInfo,
  isProcessing,
  setIsProcessing 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message);
        onPaymentError(error);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        setPaymentIntent(paymentIntent);
        onPaymentSuccess(paymentIntent);
      } else {
        setPaymentError('Payment was not successful. Please try again.');
        onPaymentError(new Error('Payment not successful'));
      }
      
    } catch (error) {
      setPaymentError('An unexpected error occurred. Please try again.');
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
            <p className="text-green-600">Your payment has been processed successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Error */}
      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">Payment Error</p>
          </div>
          <p className="text-red-600 mt-1">{paymentError}</p>
        </div>
      )}

      {/* Payment Element */}
      <div className="p-4 border border-gray-300 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Information
        </label>
        <div className="stripe-payment-element">
          <PaymentElement 
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card'],
            }}
          />
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Amount:</span>
          <span className="text-xl font-bold">${total.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Secure payment powered by Stripe
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <motion.div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Processing Payment...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay ${total.toFixed(2)}
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your payment information is secure and encrypted
      </div>
    </form>
  );
};

// Main Stripe payment component
const StripePaymentForm = ({ 
  total, 
  onPaymentSuccess, 
  onPaymentError, 
  customerInfo,
  isProcessing,
  setIsProcessing 
}) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentError, setPaymentError] = useState(null);

  // Create Payment Intent on component mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);

        const response = await fetch('https://nadkid.net/stripe-payment-intent.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: 'usd',
            customer_email: customerInfo.email,
            customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            customer_address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zipCode,
              country: customerInfo.country,
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          throw new Error('No client secret received from server');
        }
      } catch (error) {
        setPaymentError(`Failed to initialize payment: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (stripePromise && !clientSecret) {
      createPaymentIntent();
    }
  }, [stripePromise, clientSecret, total, customerInfo]);

  // If Stripe is not configured, show a message
  if (!stripePromise) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Payment Configuration Required</h3>
            <p className="text-yellow-600">Stripe payment processing is not configured. Please set up your Stripe API keys.</p>
          </div>
        </div>
        <div className="text-sm text-yellow-700">
          <p>To enable payment processing:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Add your Stripe publishable key to the environment variables</li>
            <li>Configure the Stripe plugin in your WordPress admin</li>
            <li>Ensure SSL is enabled on your site</li>
          </ol>
        </div>
      </div>
    );
  }

  // Show loading state while creating Payment Intent
  if (isLoading || !clientSecret) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <motion.div
            className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mr-3"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Initializing Payment</h3>
            <p className="text-blue-600">Setting up secure payment processing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if Payment Intent creation failed
  if (paymentError && !clientSecret) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Payment Initialization Failed</h3>
            <p className="text-red-600">{paymentError}</p>
            <button 
              onClick={() => {
                setPaymentError(null);
                setIsLoading(true);
                setClientSecret(null);
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#9aa7c1',
            colorBackground: '#ffffff',
            colorText: '#333A3F',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentForm
        total={total}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        customerInfo={customerInfo}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />
    </Elements>
  );
};

export default StripePaymentForm;