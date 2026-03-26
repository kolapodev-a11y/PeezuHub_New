// FIX #1 – Better error messages for Google login failure.

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import GoogleAuthButton from '../components/GoogleAuthButton';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const destination = location.state?.from?.pathname || '/';

  async function onSubmit(values) {
    try {
      await login(values);
      toast.success('Welcome back!');
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  }

  async function handleGoogleLogin({ accessToken }) {
    try {
      await googleLogin({ accessToken, mode: 'login' });
      toast.success('Google login successful!');
      navigate(destination, { replace: true });
    } catch (err) {
      // Provide a helpful, specific message when possible
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Google login failed. Please try again.';
      toast.error(msg);
    }
  }

  return (
    <AuthShell
      mode="login"
      title="Login to PeezuHub"
      subtitle="Use your email/password or continue with Google. The Google button now always opens account selection, so you can switch emails cleanly."
      footer={
        <p className="text-sm text-slate-500">
          No account yet?{' '}
          <Link className="font-semibold text-brand-700" to="/register">
            Create one
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <input className="input" placeholder="Email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="mt-2 text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            className="input"
            placeholder="Password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="mt-2 text-sm text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>

        <button className="btn-primary w-full" type="submit">
          Login
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleAuthButton
        mode="login"
        onAuthenticated={handleGoogleLogin}
        onError={(error) =>
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              'Google login failed. Please try again.',
          )
        }
      />
    </AuthShell>
  );
}
