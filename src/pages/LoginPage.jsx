import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  async function onSubmit(values) {
    try {
      await login(values);
      toast.success('Welcome back');
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="mx-auto max-w-lg card space-y-6">
      <div>
        <h1 className="section-title">Login to PeezuHub</h1>
        <p className="mt-1 text-sm text-slate-500">Use email/password or Google OAuth.</p>
      </div>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <input className="input" placeholder="Email" {...form.register('email')} />
        <input type="password" className="input" placeholder="Password" {...form.register('password')} />
        <button className="btn-primary w-full" type="submit">Login</button>
      </form>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async ({ credential }) => {
            try {
              await googleLogin(credential);
              toast.success('Google login successful');
              navigate('/');
            } catch (err) {
              toast.error(err.response?.data?.message || 'Google login failed');
            }
          }}
          onError={() => toast.error('Google login failed')}
        />
      </div>
      <p className="text-sm text-slate-500">No account yet? <Link className="font-semibold text-brand-700" to="/register">Create one</Link></p>
    </div>
  );
}
