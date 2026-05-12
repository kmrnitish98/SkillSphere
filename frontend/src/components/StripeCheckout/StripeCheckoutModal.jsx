import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { confirmPayment, createPaymentIntent } from '../../services/api';
import { FaLock, FaShieldAlt, FaTimes, FaCreditCard, FaDownload } from 'react-icons/fa';
import { SiStripe } from 'react-icons/si';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ── Card element shared style ──────────────────────────────────────────────
const cardStyle = {
  style: {
    base: {
      color:           '#1f2937',
      fontFamily:      'Inter, sans-serif',
      fontSize:        '15px',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Inner form (needs to be inside <Elements> provider)
// ─────────────────────────────────────────────────────────────────────────────
const CheckoutForm = ({ course, courseId, onClose }) => {
  const stripe     = useStripe();
  const elements   = useElements();
  const navigate   = useNavigate();
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [payment,  setPayment]  = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      // Step 1: Get clientSecret from backend
      const { data } = await createPaymentIntent({ courseId });
      const { clientSecret, paymentIntentId } = data;

      // Step 2: Confirm card payment on Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
        },
      });

      if (result.error) {
        toast.error(result.error.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        // Step 3: Confirm on backend → create DB record + send invoice email
        const confirmRes = await confirmPayment({ paymentIntentId, courseId });
        setPayment(confirmRes.data.data);
        setSuccess(true);
        toast.success('Payment successful! 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!payment?._id) return;
    try {
      const { data: blob } = await import('../../services/api').then((m) =>
        m.downloadInvoice(payment._id)
      );
      const url  = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${payment.invoiceNumber || 'invoice'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Could not download invoice');
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-6 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-500 mb-1 text-sm">You are now enrolled in</p>
        <p className="text-green-700 font-semibold text-base mb-4">{course?.title}</p>

        {payment?.invoiceNumber && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 inline-block">
            <p className="text-xs text-gray-500">Invoice No.</p>
            <p className="font-mono font-bold text-green-800 text-sm">{payment.invoiceNumber}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-6">📧 Invoice sent to your email address</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleDownloadInvoice}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all text-sm"
          >
            <FaDownload className="text-xs" /> Download Invoice PDF
          </button>
          {payment?.receiptUrl && (
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
            >
              View Stripe Receipt
            </a>
          )}
        </div>

        <button
          onClick={() => navigate('/student/courses')}
          className="mt-4 text-green-600 underline text-sm hover:text-green-800"
        >
          Go to My Courses →
        </button>
      </div>
    );
  }

  // ── Checkout Form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order Summary */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Order Summary</p>
        <div className="flex items-center gap-3">
          {course?.thumbnail && (
            <img src={course.thumbnail} alt={course?.title} className="w-14 h-10 object-cover rounded-lg" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{course?.title}</p>
            <p className="text-xs text-gray-500">by {course?.mentorName || 'Expert Mentor'}</p>
          </div>
          <span className="text-green-700 font-bold text-lg whitespace-nowrap">₹{course?.price}</span>
        </div>
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Card Number
        </label>
        <div className="border border-gray-300 rounded-xl px-4 py-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all bg-white flex items-center gap-2">
          <FaCreditCard className="text-gray-400 text-sm flex-shrink-0" />
          <div className="flex-1">
            <CardNumberElement options={cardStyle} />
          </div>
        </div>
      </div>

      {/* Expiry & CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Expiry Date
          </label>
          <div className="border border-gray-300 rounded-xl px-4 py-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all bg-white">
            <CardExpiryElement options={cardStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            CVC
          </label>
          <div className="border border-gray-300 rounded-xl px-4 py-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all bg-white">
            <CardCvcElement options={cardStyle} />
          </div>
        </div>
      </div>

      {/* Test card hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
        <strong>Test mode:</strong> Use card <span className="font-mono">4242 4242 4242 4242</span>, any future date, any CVC.
      </div>

      {/* Pay Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        id="stripe-pay-btn"
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <FaLock className="text-sm" /> Pay ₹{course?.price}
          </>
        )}
      </button>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-5 pt-1 text-gray-400 text-xs">
        <span className="flex items-center gap-1"><FaShieldAlt className="text-green-400" /> Secure Payment</span>
        <span className="flex items-center gap-1"><SiStripe className="text-[#635bff]" /> Powered by Stripe</span>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Export: Modal wrapper
// ─────────────────────────────────────────────────────────────────────────────
const StripeCheckoutModal = ({ courseId, course, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Gradient top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-green-400 to-emerald-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Complete Your Purchase</h2>
            <p className="text-xs text-gray-400 mt-0.5">SSL encrypted · 100% secure</p>
          </div>
          <button
            onClick={onClose}
            id="close-checkout-modal"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <FaTimes className="text-gray-500 text-xs" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          <Elements stripe={stripePromise}>
            <CheckoutForm course={course} courseId={courseId} onClose={onClose} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckoutModal;
