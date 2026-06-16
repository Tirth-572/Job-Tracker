import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { toast } from 'react-hot-toast';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PremiumPage = () => {
  const [loading, setLoading] = useState(false);
  const { user, checkAuth } = useAuth(); // Assuming checkAuth refreshes user data

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const order = await paymentService.createOrder();

      if (order.isDummy) {
        // Handle Dummy verification for local testing without Razorpay Keys
        const verifyRes = await paymentService.verifyPayment({
          isDummy: true,
          razorpay_order_id: order.id
        });
        if (verifyRes.success) {
          toast.success("Welcome to Premium! (Test Payment Successful)");
          if (checkAuth) await checkAuth();
        }
        setLoading(false);
        return;
      }

      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || '', // Safe to be empty if not provided
        amount: order.amount,
        currency: order.currency,
        name: 'HireBridge ATS',
        description: 'Upgrade to Premium',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verifyRes.success) {
              toast.success('Payment Successful! Welcome to Premium.');
              if (checkAuth) await checkAuth();
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error('Error verifying payment.');
          }
        },
        prefill: {
          name: user?.candidate?.firstName || user?.company?.name || user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#4F46E5', // Indigo 600
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      paymentObject.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
    } catch (error) {
      console.error('Payment flow error', error);
      toast.error('Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/30 animate-bounce">
            <Crown className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">
            You are a Premium Member
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Enjoy all your exclusive benefits and take your experience to the next level.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">Pricing</h2>
        <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
          Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Premium</span>
        </p>
        <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-400">
          Unlock exclusive features, stand out from the crowd, and accelerate your journey with UPI Payment.
        </p>
      </div>

      <div className="mt-16 flex justify-center">
        <div className="relative p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 max-w-lg w-full transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 -mt-4 -mr-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
              Most Popular
            </span>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-500" /> Lifetime Premium
            </h3>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
              ₹999
            </p>
          </div>

          <p className="text-gray-500 dark:text-gray-400 mb-8">
            One-time payment for lifetime access to all premium features.
          </p>

          <ul className="space-y-4 mb-8">
            {[
              { text: 'Priority support response', icon: <Zap className="w-5 h-5 text-indigo-500" /> },
              { text: 'Enhanced profile visibility', icon: <Crown className="w-5 h-5 text-yellow-500" /> },
              { text: 'Advanced analytics & insights', icon: <Check className="w-5 h-5 text-green-500" /> },
              { text: 'Verified premium badge', icon: <Shield className="w-5 h-5 text-blue-500" /> },
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center text-gray-700 dark:text-gray-300">
                <span className="mr-3 bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
                  {feature.icon}
                </span>
                <span className="font-medium">{feature.text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full py-4 px-6 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white 
              ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'} 
              transition-all duration-200 flex justify-center items-center`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Pay with UPI / Card'
            )}
          </button>
          
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Secure payment powered by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
