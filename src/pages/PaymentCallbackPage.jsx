import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import Loader from '../components/Loader';

export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    async function verify() {
      const reference = params.get('reference');
      if (!reference) {
        setMessage('Missing payment reference.');
        return;
      }
      try {
        const { data } = await client.get(`/payments/paystack/verify/${reference}`);
        setMessage(data.payment?.status === 'success' ? 'Payment verified. Your listing is now premium-ready and awaiting moderation.' : 'Payment verification completed, but status is not successful.');
      } catch (err) {
        setMessage(err.response?.data?.message || 'Unable to verify payment');
      }
    }
    verify();
  }, [params]);

  return (
    <div className="mx-auto max-w-2xl card text-center space-y-4">
      <Loader label="Contacting payment gateway..." />
      <h1 className="section-title">Premium listing payment</h1>
      <p className="text-slate-600">{message}</p>
    </div>
  );
}
