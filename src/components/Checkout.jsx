import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { woocommerceAPI, transformWooCommerceOrder } from '../utils/api';
import { useShipping } from '../hooks/useShipping';
import StripePaymentForm from './StripePaymentForm';

// Section Title Component
function SectionTitle({ children }) {
  return <h2 className="font-header text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[var(--fg)] mb-6 sm:mb-8 tracking-tight mt-8" style={{ fontSize: window.innerWidth < 768 ? 'clamp(54px, 12vw, 132px)' : undefined }}>{children}</h2>;
}

const Checkout = ({ cart, clearCart, theme }) => {
  const { items, total, itemCount } = cart;
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('shipping'); // 'shipping', 'review', 'payment', 'success'
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  // Calculate shipping costs based on customer info
  const { shippingCost, loading: shippingLoading, error: shippingError } = useShipping(customerInfo, items);
  const finalTotal = total + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createWooCommerceOrder = async (orderData) => {
    try {
      const response = await woocommerceAPI.createOrder(orderData);
      return transformWooCommerceOrder(response);
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setOrderError(null);
    
    // Validate form
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      setOrderError('Please fill in all required fields');
      return;
    }
    
    // Move to payment step
    setCheckoutStep('review');
  };

  const handlePaymentSuccess = async (paymentMethod) => {
    setPaymentMethod(paymentMethod);
    setIsProcessing(true);
    setOrderError(null);

    try {
      // Prepare order data for WooCommerce with payment information
      const orderData = {
        payment_method: 'stripe',
        payment_method_title: 'Credit Card (Stripe)',
        set_paid: true, // Mark as paid since payment was successful
        billing: {
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          address_1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postcode: customerInfo.zipCode,
          country: customerInfo.country,
          email: customerInfo.email,
        },
        shipping: {
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          address_1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postcode: customerInfo.zipCode,
          country: customerInfo.country,
        },
        line_items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        shipping_lines: shippingCost > 0 ? [{
          method_id: 'flat_rate',
          method_title: 'Standard Shipping',
          total: shippingCost.toString(),
        }] : [],
        meta_data: [
          {
            key: '_order_created_via',
            value: 'react-frontend-stripe'
          },
          {
            key: '_stripe_payment_method_id',
            value: paymentMethod.id
          },
          {
            key: '_stripe_payment_intent_id',
            value: paymentMethod.id // In a real implementation, this would be the payment intent ID
          }
        ]
      };

      // Create the order
      const order = await createWooCommerceOrder(orderData);
      
      setOrderSuccess(true);
      setCheckoutStep('success');
      clearCart();
      
      // Show success message with order details

    } catch (error) {
      console.error('Order creation error:', error);
      setOrderError(error.message);
      setCheckoutStep('shipping'); // Go back to shipping form on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setOrderError('Payment failed. Please try again.');
    setCheckoutStep('review'); // Go back to review step on payment error
  };

  if (items.length === 0) {
    return (
      <div className="h-full relative">
        <SectionTitle>Checkout</SectionTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-[var(--body)]/70 mb-4">
              Your cart is empty
            </div>
            <div className="text-sm text-[var(--body)]/50">
              Add some products to your cart before checking out.
            </div>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <SectionTitle>Checkout</SectionTitle>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Order Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img
                    src={item.images?.[0]?.src}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span>Subtotal ({itemCount} items)</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            {/* Shipping Cost Display */}
            {shippingLoading ? (
              <div className="flex justify-between items-center text-gray-600">
                <span>Shipping</span>
                <span>Calculating...</span>
              </div>
            ) : shippingError ? (
              <div className="flex justify-between items-center text-red-600">
                <span>Shipping</span>
                <span>Error calculating</span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <span>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'Free'}</span>
              </div>
            )}
            
            <div className="border-t pt-2">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information Form */}
        {checkoutStep === 'shipping' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Shipping Information</h3>
          
          {/* Error Message */}
          {orderError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">Order Error</p>
              </div>
              <p className="text-red-600 mt-1">{orderError}</p>
            </div>
          )}

          {/* Success Message */}
          {orderSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 font-medium">Order Placed Successfully!</p>
              </div>
              <p className="text-green-600 mt-1">Your order has been created and is being processed.</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={customerInfo.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={customerInfo.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={customerInfo.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={customerInfo.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={customerInfo.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={customerInfo.zipCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                name="country"
                value={customerInfo.country}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              >
                <option value="AD">Andorra</option>
                <option value="AE">United Arab Emirates</option>
                <option value="AF">Afghanistan</option>
                <option value="AG">Antigua and Barbuda</option>
                <option value="AI">Anguilla</option>
                <option value="AL">Albania</option>
                <option value="AM">Armenia</option>
                <option value="AO">Angola</option>
                <option value="AQ">Antarctica</option>
                <option value="AR">Argentina</option>
                <option value="AS">American Samoa</option>
                <option value="AT">Austria</option>
                <option value="AU">Australia</option>
                <option value="AW">Aruba</option>
                <option value="AX">Åland Islands</option>
                <option value="AZ">Azerbaijan</option>
                <option value="BA">Bosnia and Herzegovina</option>
                <option value="BB">Barbados</option>
                <option value="BD">Bangladesh</option>
                <option value="BE">Belgium</option>
                <option value="BF">Burkina Faso</option>
                <option value="BG">Bulgaria</option>
                <option value="BH">Bahrain</option>
                <option value="BI">Burundi</option>
                <option value="BJ">Benin</option>
                <option value="BL">Saint Barthélemy</option>
                <option value="BM">Bermuda</option>
                <option value="BN">Brunei Darussalam</option>
                <option value="BO">Bolivia</option>
                <option value="BQ">Bonaire, Sint Eustatius and Saba</option>
                <option value="BR">Brazil</option>
                <option value="BS">Bahamas</option>
                <option value="BT">Bhutan</option>
                <option value="BV">Bouvet Island</option>
                <option value="BW">Botswana</option>
                <option value="BY">Belarus</option>
                <option value="BZ">Belize</option>
                <option value="CA">Canada</option>
                <option value="CC">Cocos (Keeling) Islands</option>
                <option value="CD">Congo, Democratic Republic of the</option>
                <option value="CF">Central African Republic</option>
                <option value="CG">Congo</option>
                <option value="CH">Switzerland</option>
                <option value="CI">Côte d'Ivoire</option>
                <option value="CK">Cook Islands</option>
                <option value="CL">Chile</option>
                <option value="CM">Cameroon</option>
                <option value="CN">China</option>
                <option value="CO">Colombia</option>
                <option value="CR">Costa Rica</option>
                <option value="CU">Cuba</option>
                <option value="CV">Cape Verde</option>
                <option value="CW">Curaçao</option>
                <option value="CX">Christmas Island</option>
                <option value="CY">Cyprus</option>
                <option value="CZ">Czech Republic</option>
                <option value="DE">Germany</option>
                <option value="DJ">Djibouti</option>
                <option value="DK">Denmark</option>
                <option value="DM">Dominica</option>
                <option value="DO">Dominican Republic</option>
                <option value="DZ">Algeria</option>
                <option value="EC">Ecuador</option>
                <option value="EE">Estonia</option>
                <option value="EG">Egypt</option>
                <option value="EH">Western Sahara</option>
                <option value="ER">Eritrea</option>
                <option value="ES">Spain</option>
                <option value="ET">Ethiopia</option>
                <option value="FI">Finland</option>
                <option value="FJ">Fiji</option>
                <option value="FK">Falkland Islands (Malvinas)</option>
                <option value="FM">Micronesia, Federated States of</option>
                <option value="FO">Faroe Islands</option>
                <option value="FR">France</option>
                <option value="GA">Gabon</option>
                <option value="GB">United Kingdom</option>
                <option value="GD">Grenada</option>
                <option value="GE">Georgia</option>
                <option value="GF">French Guiana</option>
                <option value="GG">Guernsey</option>
                <option value="GH">Ghana</option>
                <option value="GI">Gibraltar</option>
                <option value="GL">Greenland</option>
                <option value="GM">Gambia</option>
                <option value="GN">Guinea</option>
                <option value="GP">Guadeloupe</option>
                <option value="GQ">Equatorial Guinea</option>
                <option value="GR">Greece</option>
                <option value="GS">South Georgia and the South Sandwich Islands</option>
                <option value="GT">Guatemala</option>
                <option value="GU">Guam</option>
                <option value="GW">Guinea-Bissau</option>
                <option value="GY">Guyana</option>
                <option value="HK">Hong Kong</option>
                <option value="HM">Heard Island and McDonald Islands</option>
                <option value="HN">Honduras</option>
                <option value="HR">Croatia</option>
                <option value="HT">Haiti</option>
                <option value="HU">Hungary</option>
                <option value="ID">Indonesia</option>
                <option value="IE">Ireland</option>
                <option value="IM">Isle of Man</option>
                <option value="IN">India</option>
                <option value="IO">British Indian Ocean Territory</option>
                <option value="IQ">Iraq</option>
                <option value="IR">Iran, Islamic Republic of</option>
                <option value="IS">Iceland</option>
                <option value="IT">Italy</option>
                <option value="JE">Jersey</option>
                <option value="JM">Jamaica</option>
                <option value="JO">Jordan</option>
                <option value="JP">Japan</option>
                <option value="KE">Kenya</option>
                <option value="KG">Kyrgyzstan</option>
                <option value="KH">Cambodia</option>
                <option value="KI">Kiribati</option>
                <option value="KM">Comoros</option>
                <option value="KN">Saint Kitts and Nevis</option>
                <option value="KP">Korea, Democratic People's Republic of</option>
                <option value="KR">Korea, Republic of</option>
                <option value="KW">Kuwait</option>
                <option value="KY">Cayman Islands</option>
                <option value="KZ">Kazakhstan</option>
                <option value="LA">Lao People's Democratic Republic</option>
                <option value="LB">Lebanon</option>
                <option value="LC">Saint Lucia</option>
                <option value="LI">Liechtenstein</option>
                <option value="LK">Sri Lanka</option>
                <option value="LR">Liberia</option>
                <option value="LS">Lesotho</option>
                <option value="LT">Lithuania</option>
                <option value="LU">Luxembourg</option>
                <option value="LV">Latvia</option>
                <option value="LY">Libya</option>
                <option value="MA">Morocco</option>
                <option value="MC">Monaco</option>
                <option value="MD">Moldova, Republic of</option>
                <option value="ME">Montenegro</option>
                <option value="MF">Saint Martin (French part)</option>
                <option value="MG">Madagascar</option>
                <option value="MH">Marshall Islands</option>
                <option value="MK">North Macedonia</option>
                <option value="ML">Mali</option>
                <option value="MM">Myanmar</option>
                <option value="MN">Mongolia</option>
                <option value="MO">Macao</option>
                <option value="MP">Northern Mariana Islands</option>
                <option value="MQ">Martinique</option>
                <option value="MR">Mauritania</option>
                <option value="MS">Montserrat</option>
                <option value="MT">Malta</option>
                <option value="MU">Mauritius</option>
                <option value="MV">Maldives</option>
                <option value="MW">Malawi</option>
                <option value="MX">Mexico</option>
                <option value="MY">Malaysia</option>
                <option value="MZ">Mozambique</option>
                <option value="NA">Namibia</option>
                <option value="NC">New Caledonia</option>
                <option value="NE">Niger</option>
                <option value="NF">Norfolk Island</option>
                <option value="NG">Nigeria</option>
                <option value="NI">Nicaragua</option>
                <option value="NL">Netherlands</option>
                <option value="NO">Norway</option>
                <option value="NP">Nepal</option>
                <option value="NR">Nauru</option>
                <option value="NU">Niue</option>
                <option value="NZ">New Zealand</option>
                <option value="OM">Oman</option>
                <option value="PA">Panama</option>
                <option value="PE">Peru</option>
                <option value="PF">French Polynesia</option>
                <option value="PG">Papua New Guinea</option>
                <option value="PH">Philippines</option>
                <option value="PK">Pakistan</option>
                <option value="PL">Poland</option>
                <option value="PM">Saint Pierre and Miquelon</option>
                <option value="PN">Pitcairn</option>
                <option value="PR">Puerto Rico</option>
                <option value="PS">Palestine, State of</option>
                <option value="PT">Portugal</option>
                <option value="PW">Palau</option>
                <option value="PY">Paraguay</option>
                <option value="QA">Qatar</option>
                <option value="RE">Réunion</option>
                <option value="RO">Romania</option>
                <option value="RS">Serbia</option>
                <option value="RU">Russian Federation</option>
                <option value="RW">Rwanda</option>
                <option value="SA">Saudi Arabia</option>
                <option value="SB">Solomon Islands</option>
                <option value="SC">Seychelles</option>
                <option value="SD">Sudan</option>
                <option value="SE">Sweden</option>
                <option value="SG">Singapore</option>
                <option value="SH">Saint Helena, Ascension and Tristan da Cunha</option>
                <option value="SI">Slovenia</option>
                <option value="SJ">Svalbard and Jan Mayen</option>
                <option value="SK">Slovakia</option>
                <option value="SL">Sierra Leone</option>
                <option value="SM">San Marino</option>
                <option value="SN">Senegal</option>
                <option value="SO">Somalia</option>
                <option value="SR">Suriname</option>
                <option value="SS">South Sudan</option>
                <option value="ST">Sao Tome and Principe</option>
                <option value="SV">El Salvador</option>
                <option value="SX">Sint Maarten (Dutch part)</option>
                <option value="SY">Syrian Arab Republic</option>
                <option value="SZ">Eswatini</option>
                <option value="TC">Turks and Caicos Islands</option>
                <option value="TD">Chad</option>
                <option value="TF">French Southern Territories</option>
                <option value="TG">Togo</option>
                <option value="TH">Thailand</option>
                <option value="TJ">Tajikistan</option>
                <option value="TK">Tokelau</option>
                <option value="TL">Timor-Leste</option>
                <option value="TM">Turkmenistan</option>
                <option value="TN">Tunisia</option>
                <option value="TO">Tonga</option>
                <option value="TR">Turkey</option>
                <option value="TT">Trinidad and Tobago</option>
                <option value="TV">Tuvalu</option>
                <option value="TW">Taiwan, Province of China</option>
                <option value="TZ">Tanzania, United Republic of</option>
                <option value="UA">Ukraine</option>
                <option value="UG">Uganda</option>
                <option value="UM">United States Minor Outlying Islands</option>
                <option value="US">United States</option>
                <option value="UY">Uruguay</option>
                <option value="UZ">Uzbekistan</option>
                <option value="VA">Holy See (Vatican City State)</option>
                <option value="VC">Saint Vincent and the Grenadines</option>
                <option value="VE">Venezuela, Bolivarian Republic of</option>
                <option value="VG">Virgin Islands, British</option>
                <option value="VI">Virgin Islands, U.S.</option>
                <option value="VN">Viet Nam</option>
                <option value="VU">Vanuatu</option>
                <option value="WF">Wallis and Futuna</option>
                <option value="WS">Samoa</option>
                <option value="YE">Yemen</option>
                <option value="YT">Mayotte</option>
                <option value="ZA">South Africa</option>
                <option value="ZM">Zambia</option>
                <option value="ZW">Zimbabwe</option>
              </select>
            </div>

            {checkoutStep === 'shipping' && (
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Review Order & Shipping
                </button>
              </div>
            )}
          </form>
          </div>
        )}

        {/* Review Step */}
        {checkoutStep === 'review' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Review Your Order</h3>
            
            {/* Order Summary */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Order Items</h4>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.images?.[0]?.src}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Shipping Address</h4>
              <div className="text-sm text-gray-700">
                <p>{customerInfo.firstName} {customerInfo.lastName}</p>
                <p>{customerInfo.address}</p>
                <p>{customerInfo.city}, {customerInfo.state} {customerInfo.zipCode}</p>
                <p>{customerInfo.country}</p>
                <p>{customerInfo.email}</p>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span>Subtotal ({itemCount} items)</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              {shippingLoading ? (
                <div className="flex justify-between items-center text-gray-600">
                  <span>Shipping</span>
                  <span>Calculating...</span>
                </div>
              ) : shippingError ? (
                <div className="flex justify-between items-center text-red-600">
                  <span>Shipping</span>
                  <span>Error calculating</span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'Free'}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCheckoutStep('shipping')}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                ← Back to Shipping
              </button>
              <button
                onClick={() => setCheckoutStep('payment')}
                className="flex-1 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded-lg font-medium transition-colors"
              >
                Continue to Payment - ${finalTotal.toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {checkoutStep === 'payment' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Payment Information</h3>
            <StripePaymentForm
              total={finalTotal}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              customerInfo={customerInfo}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
            
            {/* Back to review button */}
            <div className="mt-4">
              <button
                onClick={() => setCheckoutStep('review')}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                ← Back to order review
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {checkoutStep === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <svg className="w-8 h-8 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-xl font-semibold text-green-800">Order Placed Successfully!</h3>
                    <p className="text-green-600">Your payment has been processed and your order is confirmed.</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span>Credit Card (Stripe)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-green-600 font-semibold">Paid</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>You will receive an email confirmation shortly.</p>
                  <p>Thank you for your purchase!</p>
                </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default Checkout;
