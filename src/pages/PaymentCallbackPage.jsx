/**
 * PaymentCallbackPage.jsx — PeezuHub
 *
 * FIX: `refreshUser` now comes from AuthContext (it was previously undefined
 *   because AuthContext didn't export it). This caused a silent no-op and
 *   meant the UI didn't reflect the new premium status without a page reload.
 *
 * Also added a guard so the verify API call only fires once per mount
 *   (useEffect with a ref flag) – prevents double-calling on React 18
 *   Strict Mode in development.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();        // now correctly wired up in AuthContext
  const [status,  setStatus]  = useState('verifying');
  const [message, setMessage] = useState('Verifying your premium payment, please wait…');

  // Guard: make sure we only call the verify endpoint once per mount,
  // even in React 18 Strict Mode (which double-invokes effects in dev).
  const didVerify = useRef(false);

  useEffect(() => {
    if (didVerify.current) return;
    didVerify.current = true;

    async function verify() {
      const reference = params.get('reference');
      if (!reference) {
        setStatus('error');
        setMessage('Missing payment reference. Please contact support.');
        return;
      }

      try {
        const { data } = await client.get(
          `/payments/paystack/verify/${reference}`,
          { timeout: 15000 },
        );

        const paymentStatus = String(data.payment?.status || '').toLowerCase();

        // Refresh the in-memory user so premium badge/status appears immediately
        if (typeof refreshUser === 'function') {
          await refreshUser();
        }

        if (paymentStatus === 'success') {
          setStatus('success');
          setMessage(
            'Payment verified successfully. Your seller premium is now active, and your current and future listings can receive premium visibility while the upgrade stays active.',
          );
        } else if (['abandoned', 'failed', 'reversed', 'cancelled', 'canceled'].includes(paymentStatus)) {
          setStatus('error');
          setMessage(
            'This payment was not completed, so your pending premium state has been cleared. You can return to your profile and try the upgrade again whenever you are ready.',
          );
        } else {
          setStatus('error');
          setMessage(
            `Payment status: "${data.payment?.status || 'unknown'}". Please refresh your profile for the latest premium status or contact support if needed.`,
          );
        }
      } catch (err) {
        setStatus('error');
        setMessage(
          err.code === 'ECONNABORTED'
            ? 'Payment verification took too long. Please refresh this page in a few seconds or check your profile for the latest premium status.'
            : err.response?.data?.message || 'Unable to verify payment. Please try again.',
        );
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✅
          </div>
        )}
        {status === 'error' && (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            ❌
          </div>
        )}

        <h1 className="section-title">Premium Upgrade Payment</h1>
        <p className="text-slate-600">{message}</p>

        {status !== 'verifying' && (
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
            <Link to="/profile"  className="btn-primary">Back to Profile</Link>
            <Link to="/explore"  className="btn-secondary">Explore Listings</Link>
          </div>
        )}
      </div>
    </div>
  );
}
