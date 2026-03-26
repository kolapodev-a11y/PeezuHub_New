// FIX #1 – Better error messages for Google sign-up failure.

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import GoogleAuthButton from '../components/GoogleAuthButton';

const schema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function RegisterPage() {
  const { register: signup, googleAuth } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values) {
    try {
      await signup(values);
      toast.success('Account created! Welcome to PeezuHub 🎉');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  }

  async function handleGoogleSuccess({ accessToken }) {
    try {
      await googleAuth({ accessToken, mode: 'register' });
      toast.success('Signed up with Google! Welcome 🎉');
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Google sign-up failed. Please try again.';
      toast.error(msg);
    }
  }

  return (
    <AuthShell
      mode="register"
      title="Create your account"
      subtitle="Start posting trusted Nigerian services and managing your profile without confusing mixed login/register states."
      footer={
        <p className="text-sm text-slate-500">
          Already registered?{' '}
          <Link className="font-semibold text-brand-700" to="/login">
            Login
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <input className="input" placeholder="Full name" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="mt-2 text-sm text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>

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
          Register
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleAuthButton
        mode="register"
        onAuthenticated={handleGoogleSuccess}
        onError={(error) =>
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              'Google sign-up failed. Please try again.',
          )
        }
      />
    </AuthShell>
  );
}
