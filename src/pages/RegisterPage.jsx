// src/pages/RegisterPage.jsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';   // ← ADD THIS
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function RegisterPage() {
  const { register: signup, googleLogin } = useAuth();  // ← ADD googleLogin
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
        <input className="input" placeholder="Email" {...form.register('email')} />
        <input type="password" className="input" placeholder="Password" {...form.register('password')} />
        <button className="btn-primary w-full" type="submit">Register</button>
      </form>

      {/* ── Google Sign-Up Button ── */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async ({ credential }) => {
            try {
              await googleLogin(credential);
              toast.success('Signed up with Google!');
              navigate('/');
            } catch (err) {
              toast.error(err.response?.data?.message || 'Google sign-up failed');
            }
          }}
          onError={() => toast.error('Google sign-up failed')}
          text="signup_with"        // shows "Sign up with Google"
          shape="rectangular"
        />
      </div>

      <p className="text-sm text-slate-500">
        Already registered?{' '}
        <Link className="font-semibold text-brand-700" to="/login">Login</Link>
      </p>
    </div>
  );
}
