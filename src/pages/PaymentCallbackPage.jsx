import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your premium payment, please wait…');

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
          await refreshUser();
          setStatus('success');
          setMessage('Payment verified successfully. Your seller premium is now active, and your current and future listings can receive premium visibility while the upgrade stays active.');
        } else {
          setStatus('error');
          setMessage(`Payment status: "${data.payment?.status || 'unknown'}". If you believe this is wrong, please contact support.`);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Unable to verify payment. Please try again.');
      }
    }

    verify();
  }, [params, refreshUser]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-16 text-center">
      <div className="card space-y-5 p-8">
        {status === 'verifying' && (
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
        )}
        {status === 'success' && (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✅</div>
        )}
        {status === 'error' && (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">❌</div>
        )}

        <h1 className="section-title">Premium Upgrade Payment</h1>
        <p className="text-slate-600">{message}</p>

        {status !== 'verifying' && (
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
            <Link to="/profile" className="btn-primary">Back to Profile</Link>
            <Link to="/explore" className="btn-secondary">Explore Listings</Link>
          </div>
        )}
      </div>
    </div>
  );
}
