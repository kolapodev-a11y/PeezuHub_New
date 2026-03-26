import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

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
      toast.success('Account created');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  }

  async function handleGoogleSuccess(response) {
    try {
      if (!response?.credential) {
        toast.error('Google credential missing');
        return;
      }
      await googleAuth(response.credential);
      toast.success('Signed up with Google!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-up failed');
    }
  }

  return (
    <div className="mx-auto max-w-lg card space-y-6">
      <div>
        <h1 className="section-title">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Start posting trusted Nigerian services and managing your profile.
        </p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <input className="input" placeholder="Full name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}

        <input className="input" placeholder="Email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}

        <input type="password" className="input" placeholder="Password" {...form.register('password')} />
        {form.formState.errors.password && (
          <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
        )}

        <button className="btn-primary w-full" type="submit">Register</button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google sign-up failed')}
          text="signup_with"
          shape="rectangular"
          width="300"
        />
      </div>

      <p className="text-sm text-slate-500">
        Already registered?{' '}
        <Link className="font-semibold text-brand-700" to="/login">
          Login
        </Link>
      </p>
    </div>
  );
}
