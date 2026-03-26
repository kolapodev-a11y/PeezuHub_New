// FIX #1 – Payment callback: added navigation button home after result is known,
//           and removed the always-spinning Loader so users get a clear final state.

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your payment, please wait…');

  useEffect(() => {
    async function verify() {
      const reference = params.get('reference');
      if (!reference) {
        setStatus('error');
        setMessage('Missing payment reference. Please contact support.');
        return;
      }

      try {
        const { data } = await client.get(`/payments/paystack/verify/${reference}`);
        if (data.payment?.status === 'success') {
          setStatus('success');
          setMessage(
            'Payment verified ✅  Your listing is now premium-ready and awaiting admin moderation.',
          );
        } else {
          setStatus('error');
          setMessage(
            `Payment status: "${data.payment?.status || 'unknown'}". If you believe this is wrong, please contact support.`,
          );
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Unable to verify payment. Please try again.');
      }
    }

    verify();
  }, [params]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-16 text-center">
      <div className="card space-y-5 p-8">
        {/* Icon */}
        {status === 'verifying' && (
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
        )}
        {status === 'success' && (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✅
          </div>
        )}
        {status === 'error' && (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            ❌
          </div>
        )}

        <h1 className="section-title">Premium Listing Payment</h1>
        <p className="text-slate-600">{message}</p>

        {/* Navigation – only show once we have a result */}
        {status !== 'verifying' && (
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
            <Link to="/profile" className="btn-secondary">
              View My Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
